import React from 'react';

type TokenPasteFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function TokenPasteField({ id, value, onChange, disabled }: TokenPasteFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        Token de acceso
      </label>
      <textarea
        id={id}
        className="block w-full min-h-[5.5rem] resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-sm leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="21|pega_aqui_tu_token_completo"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
      />
    </div>
  );
}
