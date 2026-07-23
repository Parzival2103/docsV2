import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';

type TesterTab = 'html' | 'php';

/**
 * Embeds standalone API testers inside the docs chrome.
 * HTML/JS works on any static host (Vite / docs). PHP needs PHP-FPM on the docs host.
 */
export default function ApiTester() {
  const [tab, setTab] = useState<TesterTab>('html');
  const iframeSrc = tab === 'html' ? '/tester.html' : '/tester.php';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[640px] -m-4 sm:-m-8 lg:-m-12">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">API Tester</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pega tu Bearer token de cliente y prueba instancias, mensajes, cuenta y uso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'html' ? (
            <>
              <a
                href="/tester.html"
                download="tester.html"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar tester.html
              </a>
              <a
                href="/tester.js"
                download="tester.js"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar tester.js
              </a>
            </>
          ) : (
            <a
              href="/tester.php?download=1"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar tester.php
            </a>
          )}
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir en pestaña
          </a>
        </div>
      </div>

      <div className="flex gap-1 px-4 sm:px-6 pt-2 border-b border-slate-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setTab('html')}
          className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            tab === 'html'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          HTML/JS
        </button>
        <button
          type="button"
          onClick={() => setTab('php')}
          className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            tab === 'php'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          PHP
        </button>
      </div>

      <iframe
        key={tab}
        title={tab === 'html' ? 'WhatsApiLebytek API Tester HTML/JS' : 'WhatsApiLebytek API Tester PHP'}
        src={iframeSrc}
        className="flex-1 w-full border-0 bg-[#0f1115]"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
