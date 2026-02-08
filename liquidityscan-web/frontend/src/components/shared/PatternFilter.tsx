import React from 'react';

// Map display labels to internal values
const OPTION_MAP: Record<string, string> = {
  'All': 'All',
  'Run': 'Run',
  'Run+': 'Run+',
  'Rev': 'Rev',
  'Rev+': 'Rev+',
};

const DISPLAY_OPTIONS = ['All', 'Run', 'Run+', 'Rev', 'Rev+'] as const;
const STANDARD_ONLY_OPTIONS = ['All', 'Run', 'Rev'] as const;

interface PatternFilterProps {
  type: 'bull' | 'bear';
  value: string; // Internal value (Run, Run+, Rev, Rev+)
  onChange: (value: string) => void; // Returns internal value
  /** When true (e.g. Free Forever plan), only show Standard REV/RUN (hide Rev+, Run+) */
  standardOnly?: boolean;
}

export const PatternFilter: React.FC<PatternFilterProps> = ({
  type,
  value,
  onChange,
  standardOnly = false,
}) => {
  const isBull = type === 'bull';
  const colorClass = isBull
    ? 'text-primary bg-primary text-black shadow-[0_0_10px_rgba(19,236,55,0.4)] border-primary'
    : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border-red-500';

  const options = standardOnly ? STANDARD_ONLY_OPTIONS : DISPLAY_OPTIONS;

  // Map display label to internal value
  const getInternalValue = (displayLabel: string): string => {
    return OPTION_MAP[displayLabel as keyof typeof OPTION_MAP] || displayLabel;
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-2xl dark:bg-white/5 light:bg-white dark:border-white/5 light:border-green-300 shrink-0">
      <span className={`text-[10px] font-black ${isBull ? 'text-primary' : 'text-red-500'} uppercase tracking-widest pl-1`}>
        {isBull ? 'Bull' : 'Bear'}
      </span>
      <div className="flex items-center gap-1">
        {options.map((displayLabel) => {
          const internalValue = getInternalValue(displayLabel);
          const isSelected = value === internalValue;
          return (
            <button
              key={displayLabel}
              onClick={() => onChange(internalValue)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all ${isSelected
                ? colorClass
                : 'dark:border-white/10 light:border-green-300 dark:bg-white/5 light:bg-green-50 dark:text-gray-400 light:text-text-light-secondary dark:hover:bg-white/10 light:hover:bg-green-100 dark:hover:text-white light:hover:text-text-dark'
                }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
