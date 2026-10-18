import React from 'react';
import { Card, CardContent, Button } from '@heroui/react';
import { KeyRound, Check, RotateCcw, AlertTriangle } from 'lucide-react';

interface UniquenessCriteriaSelectorProps {
  tableName: string;
  allColumns: string[];
  primaryKeys: string[];
  selectedUniqueKeys: string[];
  onToggleKey: (columnName: string) => void;
  onResetToPrimaryKeys: () => void;
}

export const UniquenessCriteriaSelector: React.FC<UniquenessCriteriaSelectorProps> = ({
  tableName,
  allColumns,
  primaryKeys,
  selectedUniqueKeys,
  onToggleKey,
  onResetToPrimaryKeys,
}) => {
  const hasNoKeysSelected = selectedUniqueKeys.length === 0;

  return (
    <Card className="w-full border border-default-200 bg-default-50/50 shadow-xs">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <KeyRound size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                Uniqueness Criteria (Unique Key)
                <span className="font-mono text-primary normal-case">`{tableName}`</span>
              </h4>
              <p className="text-[11px] text-foreground/60">
                Define the columns that make a record unique. stewrd uses these keys to detect missing rows and attribute diffs.
              </p>
            </div>
          </div>

          {primaryKeys.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onPress={onResetToPrimaryKeys}
              className="text-xs text-foreground/70 h-7 px-2.5 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw size={12} />
              Reset to Primary Keys
            </Button>
          )}
        </div>

        {/* Column Chips Selector */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {allColumns.map((col) => {
            const isSelected = selectedUniqueKeys.includes(col);
            const isPk = primaryKeys.includes(col);

            return (
              <button
                key={col}
                type="button"
                onClick={() => onToggleKey(col)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary'
                    : 'bg-default-100 hover:bg-default-200 text-foreground/80 border border-default-200'
                }`}
                title={isSelected ? 'Click to remove from unique keys' : 'Click to add to unique keys'}
              >
                {isSelected ? <Check size={12} className="stroke-[2.5]" /> : <KeyRound size={11} className="opacity-40" />}
                <span>{col}</span>
                {isPk && (
                  <span
                    className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-primary/20 text-primary'
                    }`}
                  >
                    PK
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {hasNoKeysSelected && (
          <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg px-2.5 py-1.5">
            <AlertTriangle size={14} className="shrink-0" />
            <span>At least one uniqueness key is recommended to accurately compare records.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
