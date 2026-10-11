import React from 'react';
import type { Environment } from '../../../store/useAppStore';

interface EnvironmentSelectorProps {
  value: Environment;
  onChange: (env: Environment) => void;
  options?: Environment[];
  className?: string;
  size?: 'sm' | 'md';
}

const DEFAULT_OPTIONS: Environment[] = ['DEV', 'STG', 'UAT', 'PRD'];

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className = '',
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-surface border border-separator rounded-xl ${
        isSm ? 'h-9' : 'h-10'
      } ${className}`}
    >
      {options.map((env) => {
        const isSelected = value === env;
        return (
          <button
            key={env}
            type="button"
            onClick={() => onChange(env)}
            className={`flex-1 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
              isSm ? 'h-7' : 'h-8'
            } ${
              isSelected
                ? 'bg-primary text-white shadow-xs font-bold'
                : 'text-foreground/70 hover:text-foreground hover:bg-default-100 dark:hover:bg-default-200/40'
            }`}
          >
            <span>{env}</span>
            {env === 'DEV' && options.length <= 3 && (
              <span className="hidden sm:inline text-[10px] opacity-75 font-normal">(Local)</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
