import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DATABASE_ENGINES, getEngineOption, type DatabaseEngineType } from '../../constants/database/engineConstants';
import { DatabaseEngineIcon } from './DatabaseEngineIcon';

export interface DatabaseEngineSelectorProps {
  value: string;
  onChange: (engine: DatabaseEngineType) => void;
  onAutoPortChange?: (newPort: string) => void;
  currentPort?: string;
  className?: string;
  disabled?: boolean;
}

export const DatabaseEngineSelector: React.FC<DatabaseEngineSelectorProps> = ({
  value,
  onChange,
  onAutoPortChange,
  currentPort,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasSelected = Boolean(value && value !== '-' && value.trim() !== '');
  const selectedEngine = hasSelected ? getEngineOption(value) : null;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (engineId: DatabaseEngineType) => {
    const previousEngine = selectedEngine;
    const newEngine = getEngineOption(engineId);

    onChange(engineId);
    setIsOpen(false);

    // If callback provided, update the default port if current port matches old default or is empty
    if (onAutoPortChange && newEngine.defaultPort) {
      if (!currentPort || (previousEngine && currentPort === previousEngine.defaultPort)) {
        onAutoPortChange(newEngine.defaultPort);
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`.trim()}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-12 px-3.5 bg-surface border rounded-xl flex items-center justify-between text-foreground transition-all duration-200 outline-none select-none ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-xs'
            : 'border-separator hover:border-primary/50'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <DatabaseEngineIcon engine={hasSelected && selectedEngine ? selectedEngine.id : '-'} size={30} />
          <div className="flex items-center gap-2 truncate">
            {hasSelected && selectedEngine ? (
              <>
                <span className="font-semibold text-sm truncate">{selectedEngine.name}</span>
                {selectedEngine.defaultPort && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[11px] font-mono bg-default-100 text-foreground/60 border border-separator/60">
                    :{selectedEngine.defaultPort}
                  </span>
                )}
              </>
            ) : (
              <span className="text-foreground/50 text-sm">Select engine... (-)</span>
            )}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-foreground/50 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Database engine list"
          className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-surface border border-separator rounded-xl shadow-xl backdrop-blur-md max-h-72 overflow-y-auto animate-appearance-in"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
            Select Database Engine (MySQL Compatible)
          </div>

          <div className="flex flex-col gap-1">
            {DATABASE_ENGINES.map((engine) => {
              const isSelected = selectedEngine?.id === engine.id;

              return (
                <div
                  key={engine.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(engine.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-default-100 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DatabaseEngineIcon engine={engine.id} size={32} />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{engine.name}</span>
                        {engine.defaultPort && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-default-100 text-foreground/60">
                            Port {engine.defaultPort}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-foreground/50 truncate">
                        {engine.description}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={18} className="text-primary shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseEngineSelector;
