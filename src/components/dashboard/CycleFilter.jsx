import React from 'react';

const cycles = [
  { value: 'AM', label: 'AM', icon: '☀️' },
  { value: 'PM', label: 'PM', icon: '🌙' },
  { value: 'TOTAL', label: 'Total', icon: '📊' },
];

export default function CycleFilter({ selected, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
      {cycles.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={`px-4 py-2 rounded-lg text-sm font-inter font-semibold transition-all duration-200 ${
            selected === c.value
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-background'
          }`}
        >
          <span className="mr-1.5">{c.icon}</span>
          {c.label}
        </button>
      ))}
    </div>
  );
}