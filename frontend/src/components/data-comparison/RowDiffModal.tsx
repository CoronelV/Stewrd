import React from 'react';
import { Button, Chip } from '@heroui/react';
import { X, GitCompare, Check, AlertTriangle } from 'lucide-react';
import type { ComparisonRow } from '../../api/requests.interface';

interface RowDiffModalProps {
  row: ComparisonRow | null;
  columns: string[];
  uniqueKeys: string[];
  tableName: string;
  onClose: () => void;
}

export const RowDiffModal: React.FC<RowDiffModalProps> = ({
  row,
  columns,
  uniqueKeys,
  tableName,
  onClose,
}) => {
  if (!row) return null;

  const keyDisplay = Object.entries(row.keyValues)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-appearance-in">
      <div className="bg-surface border border-separator rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-separator flex items-center justify-between bg-default-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <GitCompare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Record Inspection: <span className="font-mono text-primary font-semibold">`{tableName}`</span>
                </h3>
                <Chip
                  size="sm"
                  color={
                    row.status === 'only_target'
                      ? 'success'
                      : row.status === 'different'
                      ? 'warning'
                      : 'default'
                  }
                  variant="soft"
                  className={
                    row.status === 'only_source'
                      ? 'bg-blue-500/20 text-blue-400 capitalize font-semibold text-[11px]'
                      : 'capitalize font-semibold text-[11px]'
                  }
                >
                  {row.status.replace('_', ' ')}
                </Chip>
              </div>
              <p className="text-xs font-mono text-foreground/60 mt-0.5">{keyDisplay}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="ghost" onPress={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>

        {/* Diff Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-default-100 text-foreground/70 uppercase text-[10px] font-bold tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Column</th>
                <th className="py-2.5 px-3 text-blue-500">Source DB</th>
                <th className="py-2.5 px-3 text-emerald-500">Target DB</th>
                <th className="py-2.5 px-3 rounded-r-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {columns.map((col) => {
                const isKey = uniqueKeys.includes(col);
                const isDiffering = row.differingColumns.includes(col);
                const sourceVal = row.sourceData ? row.sourceData[col] : undefined;
                const targetVal = row.targetData ? row.targetData[col] : undefined;
                const sourceExists = row.sourceData !== null && sourceVal !== undefined;
                const targetExists = row.targetData !== null && targetVal !== undefined;

                return (
                  <tr
                    key={col}
                    className={`transition-colors ${
                      isDiffering
                        ? 'bg-amber-500/10'
                        : isKey
                        ? 'bg-primary/5 font-medium'
                        : 'hover:bg-default-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground flex items-center gap-1.5">
                      <span>{col}</span>
                      {isKey && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary font-bold">
                          KEY
                        </span>
                      )}
                    </td>

                    {/* Source Value */}
                    <td className="py-2.5 px-3 font-mono">
                      {row.sourceData === null ? (
                        <span className="text-blue-500/40 italic">— missing —</span>
                      ) : sourceVal === null ? (
                        <span className="text-foreground/40 italic">NULL</span>
                      ) : (
                        <span className={isDiffering ? 'text-amber-400 font-semibold' : 'text-blue-400'}>
                          {String(sourceVal)}
                        </span>
                      )}
                    </td>

                    {/* Target Value */}
                    <td className="py-2.5 px-3 font-mono">
                      {row.targetData === null ? (
                        <span className="text-emerald-500/40 italic">— missing —</span>
                      ) : targetVal === null ? (
                        <span className="text-foreground/40 italic">NULL</span>
                      ) : (
                        <span className={isDiffering ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                          {String(targetVal)}
                        </span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="py-2.5 px-3 text-center">
                      {isDiffering ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> Differing
                        </span>
                      ) : !sourceExists && targetExists ? (
                        <span className="text-[10px] text-emerald-500 font-medium">Target Only</span>
                      ) : sourceExists && !targetExists ? (
                        <span className="text-[10px] text-blue-500 font-medium">Source Only</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-foreground/50">
                          <Check size={11} className="text-success" /> Identical
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-separator flex items-center justify-end bg-default-50/50">
          <Button size="sm" variant="primary" onPress={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
