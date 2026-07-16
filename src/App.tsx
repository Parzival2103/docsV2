import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DocViewer from './components/DocViewer';
import DocSearch from './components/DocSearch';
import DemoSandbox from './components/Sandbox/DemoSandbox';
import ApiTester from './components/ApiTester';
import { NAVIGATION, DOCS_DATABASE } from './data';

export default function App() {
  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash && DOCS_DATABASE[hash] ? hash : 'introduccion';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && DOCS_DATABASE[hash]) {
        setCurrentDocId(hash);
      } else if (!hash) {
        setCurrentDocId('introduccion');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectDoc = (id: string) => {
    setCurrentDocId(id);
    window.location.hash = id;
  };

  const currentDoc = DOCS_DATABASE[currentDocId];

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 font-sans">
      <Sidebar 
        navigation={NAVIGATION} 
        currentDocId={currentDocId} 
        onSelectDoc={handleSelectDoc}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <DocSearch onSelectDoc={handleSelectDoc} />
          </div>

          <div className="flex items-center gap-4">
            <a href="#introduccion" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Ir al Dashboard
            </a>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
          {currentDocId === 'sandbox' ? (
            <DemoSandbox />
          ) : currentDocId === 'tester' ? (
            <ApiTester />
          ) : currentDoc ? (
            <DocViewer doc={currentDoc} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>Documento no encontrado.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
