import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { DOCS_DATABASE, NAVIGATION } from '../data';

type SearchHit = {
  id: string;
  title: string;
  snippet: string;
};

function buildIndex(): SearchHit[] {
  const navTitles = new Map<string, string>();
  for (const section of NAVIGATION) {
    for (const item of section.items) {
      navTitles.set(item.id, item.title);
    }
  }

  return Object.values(DOCS_DATABASE).map((doc) => ({
    id: doc.id,
    title: navTitles.get(doc.id) ?? doc.title,
    snippet: doc.markdown.replace(/[#*`>_\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim(),
  }));
}

function searchDocs(query: string, index: SearchHit[]): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  return index
    .map((hit) => {
      const hay = `${hit.title} ${hit.snippet}`.toLowerCase();
      const titleHit = terms.every((t) => hit.title.toLowerCase().includes(t));
      const allHit = terms.every((t) => hay.includes(t));
      if (!allHit) return null;

      let snippet = '';
      const firstTerm = terms[0];
      const idx = hit.snippet.toLowerCase().indexOf(firstTerm);
      if (idx >= 0) {
        const start = Math.max(0, idx - 40);
        snippet = `${start > 0 ? '…' : ''}${hit.snippet.slice(start, start + 110)}${start + 110 < hit.snippet.length ? '…' : ''}`;
      } else {
        snippet = hit.snippet.slice(0, 110) + (hit.snippet.length > 110 ? '…' : '');
      }

      return { ...hit, snippet, score: titleHit ? 0 : 1 };
    })
    .filter((h): h is SearchHit & { score: number } => h !== null)
    .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
    .slice(0, 8)
    .map(({ id, title, snippet }) => ({ id, title, snippet }));
}

type DocSearchProps = {
  onSelectDoc: (id: string) => void;
};

export default function DocSearch({ onSelectDoc }: DocSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(), []);
  const results = useMemo(() => searchDocs(query, index), [query, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = (id: string) => {
    onSelectDoc(id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={rootRef} className="relative hidden sm:block w-64 lg:w-80">
      <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md text-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        <Search className="w-4 h-4 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              go(results[activeIndex].id);
            }
          }}
          placeholder="Buscar documentación..."
          className="bg-transparent border-none outline-none text-slate-700 w-full placeholder-slate-400"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="hidden lg:flex items-center gap-0.5 text-xs border border-slate-200 bg-white px-1.5 py-0.5 rounded shadow-sm shrink-0">
          <span className="text-[10px]">⌘</span>K
        </span>
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">Sin resultados para “{query.trim()}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((hit, i) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(hit.id)}
                    className={`w-full text-left px-3 py-2.5 ${
                      i === activeIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{hit.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{hit.snippet}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
