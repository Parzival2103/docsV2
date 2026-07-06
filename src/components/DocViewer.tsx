import React, { useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocContent } from '../types';
import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';

interface DocViewerProps {
  doc: DocContent;
}

const CodeBlock = ({ children, className }: any) => {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute right-2 top-2 p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copiar código"
        title="Copiar código"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
      <code className={className}>{children}</code>
    </div>
  );
};

export default function DocViewer({ doc }: DocViewerProps) {
  const components: Components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <motion.div
      key={doc.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto w-full pb-20"
    >
      <div className="prose prose-slate prose-headings:font-display prose-headings:tracking-tight max-w-none 
          prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-8 
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:pb-2 prose-h2:border-slate-200
          prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
          prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-[#0f172a] prose-pre:text-slate-50 prose-pre:font-mono prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:relative
          prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-700
          prose-th:bg-slate-50 prose-th:p-3 prose-th:text-left
          prose-td:p-3 prose-td:border-t prose-td:border-slate-200"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {doc.markdown}
        </ReactMarkdown>
      </div>
      
      <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
        <p>Última actualización: Hoy (Vía GitHub)</p>
        <a href="https://github.com/Parzival2103/WhatsApiLebytek" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Sugerir una edición</a>
      </div>
    </motion.div>
  );
}
