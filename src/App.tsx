import React, { useState, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DocViewer from './components/DocViewer';
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
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        navigation={NAVIGATION} 
        currentDocId={currentDocId} 
        onSelectDoc={handleSelectDoc}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Placeholder */}
            <div className="hidden sm:flex items-center gap-2 text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md text-sm border border-slate-200 w-64 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <Search className="w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar documentación..." 
                className="bg-transparent border-none outline-none text-slate-700 w-full placeholder-slate-400"
              />
              <span className="hidden lg:flex items-center gap-0.5 text-xs border border-slate-200 bg-white px-1.5 py-0.5 rounded shadow-sm">
                <span className="text-[10px]">⌘</span>K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#introduccion" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Ir al Dashboard
            </a>
          </div>
        </header>

        {/* Documentation Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
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
