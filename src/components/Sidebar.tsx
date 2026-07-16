import React from 'react';
import { DocSection } from '../types';
import { ChevronRight, FileText, Code2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  navigation: DocSection[];
  currentDocId: string;
  onSelectDoc: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ navigation, currentDocId, onSelectDoc, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar: drawer on mobile; in-flow column on desktop (scrolls its own nav) */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 flex h-dvh w-72 shrink-0 flex-col border-r border-slate-200 bg-white
          transform transition-transform duration-300 ease-in-out
          lg:static lg:z-0 lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="z-10 flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white p-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900 tracking-tight">
            Lebytek API
          </span>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          {navigation.map((section, idx) => (
            <div key={section.title} className="mb-8">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentDocId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onSelectDoc(item.id);
                          onClose();
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                          ${isActive 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }
                        `}
                      >
                        {item.isApiRef ? (
                          <Code2 className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        ) : (
                          <FileText className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        )}
                        <span className="flex-1 text-left">{item.title}</span>
                        {isActive && (
                          <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500 flex flex-col gap-1">
            <p>Conectado a GitHub/VPS</p>
            <p className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Sincronizado</p>
          </div>
        </div>
      </aside>
    </>
  );
}
