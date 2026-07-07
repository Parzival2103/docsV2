import React, { useCallback, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

type TokenPasteFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function TokenPasteField({ id, value, onChange, disabled }: TokenPasteFieldProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        Token de acceso
      </label>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-50 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500">
        <textarea
          ref={textareaRef}
          id={id}
          className="block w-full min-h-[5.5rem] resize-y border-0 bg-transparent px-3 py-2.5 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          placeholder="15|pega_aqui_tu_token_completo"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
        />
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-500">
            Pega el token <strong>completo</strong> del correo, incluido el número y el símbolo{' '}
            <strong>|</strong> (ej. <code className="font-mono text-slate-700">15|abc…</code>).
            Se guarda solo en esta pestaña.
          </p>
          <button
            type="button"
            disabled={disabled || !value.trim()}
            onClick={() => void handleCopy()}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 sm:self-center"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? 'Copiado' : 'Copiar token'}
          </button>
        </div>
      </div>
    </div>
  );
}
