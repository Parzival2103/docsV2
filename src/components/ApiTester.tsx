import React from 'react';
import { Download, ExternalLink } from 'lucide-react';

/**
 * Embeds the standalone PHP API tester inside the docs chrome (like the sandbox).
 * Requires /tester.php to be executable on the docs host (PHP-FPM).
 */
export default function ApiTester() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[640px] -m-4 sm:-m-8 lg:-m-12">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">API Tester (PHP)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            UI standalone — pega tu Bearer token de cliente y prueba instancias, mensajes, cuenta y uso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/tester.php?download=1"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar tester.php
          </a>
          <a
            href="/tester.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir en pestaña
          </a>
        </div>
      </div>
      <iframe
        title="WhatsApiLebytek API Tester"
        src="/tester.php"
        className="flex-1 w-full border-0 bg-[#0f1115]"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
