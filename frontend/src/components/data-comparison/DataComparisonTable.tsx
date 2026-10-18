import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent, Chip, Spinner, Button } from '@heroui/react';
import { CheckCircle2, Eye, Database } from 'lucide-react';
import type { ComparisonRow, ComparisonFilter } from '../../api/requests.interface';
import { RowDiffModal } from './RowDiffModal';

interface DataComparisonTableProps {
  rows: ComparisonRow[];
  columns: string[];
  uniqueKeys: string[];
  filter: ComparisonFilter;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalMatches: number;
  tableName: string;
  onLoadMore: () => void;
}

export const DataComparisonTable: React.FC<DataComparisonTableProps> = ({
  rows,
  columns,
  uniqueKeys,
  filter,
  isLoading,
  isLoadingMore,
  hasMore,
  totalMatches,
  tableName,
  onLoadMore,
}) => {
  const [selectedRowForModal, setSelectedRowForModal] = useState<ComparisonRow | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll listener
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // When approaching within 150px of bottom, trigger next page
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (hasMore && !isLoadingMore && !isLoading) {
        onLoadMore();
      }
    }
  };

  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <Card className="w-full border border-default-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Subheader / Counter */}
      <CardHeader className="py-2.5 px-4 bg-default-50/50 border-b border-default-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">
            {filter === 'differences'
              ? 'Data Discrepancies'
              : filter === 'only_target'
              ? 'Target-Exclusive Records'
              : 'Source-Exclusive Records'}
          </span>
          <Chip size="sm" variant="soft" className="font-mono text-[11px] h-5">
            Showing {rows.length.toLocaleString()} of {totalMatches.toLocaleString()}
          </Chip>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-foreground/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500" />
            <span className="text-blue-500 font-semibold">Source Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500" />
            <span className="text-emerald-500 font-semibold">Target Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500" />
            <span className="text-amber-500 font-semibold">Values Differ</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-foreground/60">
            <Spinner size="lg" />
            <span className="text-sm font-medium animate-pulse">
              Computing diffs and comparing records...
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="p-3 rounded-2xl bg-success/10 text-success">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">No Records Found for this Filter</h4>
              <p className="text-xs text-foreground/60 mt-1 max-w-md">
                {filter === 'differences'
                  ? 'All compared records are identical between Source and Target databases.'
                  : filter === 'only_target'
                  ? 'No records exist exclusively in the Target database.'
                  : 'No records exist exclusively in the Source database.'}
              </p>
            </div>
          </div>
        ) : (
          /* Table container with limits and scroll-driven lazy loading */
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-auto max-h-[540px] relative select-none divide-y divide-default-100"
          >
            <style>{`
              @keyframes stewrdRowEnter {
                from {
                  opacity: 0;
                  transform: translateY(5px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <table className="w-full text-left border-collapse text-xs">
              {/* Sticky Multi-Level Header */}
              <thead className="sticky top-0 z-20 bg-surface shadow-xs text-[11px]">
                {/* Level 1: Section Groups */}
                <tr className="border-b border-default-200">
                  {/* Left Column: Identity & Status */}
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-30 bg-surface border-r border-default-200 py-2.5 px-3 font-bold text-foreground/80 min-w-[200px]"
                  >
                    <div className="flex items-center justify-between">
                      <span>Row / Unique Identity</span>
                      <span className="text-[10px] text-foreground/50 font-normal">Status</span>
                    </div>
                  </th>

                  {/* Group 1: Source DB Columns */}
                  <th
                    colSpan={columns.length}
                    className="py-1.5 px-3 bg-blue-500/10 border-b border-r border-blue-500/30 text-center font-bold text-blue-500 uppercase tracking-wider"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <Database size={13} />
                      <span>Source Database (Origin)</span>
                    </div>
                  </th>

                  {/* Group 2: Target DB Columns */}
                  <th
                    colSpan={columns.length}
                    className="py-1.5 px-3 bg-emerald-500/10 border-b border-emerald-500/30 text-center font-bold text-emerald-500 uppercase tracking-wider"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <Database size={13} />
                      <span>Target Database (Destination)</span>
                    </div>
                  </th>
                </tr>

                {/* Level 2: Individual Column Names */}
                <tr className="border-b border-default-200 font-mono text-[10px] uppercase tracking-wider text-foreground/70">
                  {/* Source Columns */}
                  {columns.map((col) => (
                    <th
                      key={`s-col-${col}`}
                      className="py-1.5 px-3 bg-blue-500/5 text-blue-400 font-semibold truncate max-w-[150px] border-r border-default-100 last:border-r-blue-500/30"
                      title={col}
                    >
                      <span className="flex items-center gap-1">
                        {col}
                        {uniqueKeys.includes(col) && (
                          <span className="text-[8px] px-1 rounded bg-blue-500/20 text-blue-400 font-bold">
                            KEY
                          </span>
                        )}
                      </span>
                    </th>
                  ))}

                  {/* Target Columns */}
                  {columns.map((col) => (
                    <th
                      key={`t-col-${col}`}
                      className="py-1.5 px-3 bg-emerald-500/5 text-emerald-400 font-semibold truncate max-w-[150px] border-r border-default-100 last:border-r-0"
                      title={col}
                    >
                      <span className="flex items-center gap-1">
                        {col}
                        {uniqueKeys.includes(col) && (
                          <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            KEY
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-default-100 font-mono text-[11px]">
                {rows.map((row, index) => {
                  const isOnlySource = row.status === 'only_source';
                  const isOnlyTarget = row.status === 'only_target';
                  const isDifferent = row.status === 'different';

                  const keyString = Object.entries(row.keyValues)
                    .map(([k, v]) => `${k}:${String(v)}`)
                    .join(' • ');

                  return (
                    <tr
                      key={`${row.status}-${index}-${keyString}`}
                      style={{
                        animation: 'stewrdRowEnter 0.25s ease-out forwards',
                        animationDelay: `${Math.min(index % 50, 10) * 15}ms`,
                      }}
                      className="hover:bg-default-100/50 transition-colors group"
                    >
                      {/* Sticky Left Identity & Status */}
                      <td className="sticky left-0 z-10 bg-surface group-hover:bg-default-100/90 border-r border-default-200 py-2 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate max-w-[130px]">
                              {keyString}
                            </span>
                            <span className="text-[10px] text-foreground/50 font-sans">
                              Row #{(index + 1).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOnlySource && (
                              <Chip size="sm" variant="soft" className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] h-5 font-sans font-bold">
                                Source Only
                              </Chip>
                            )}
                            {isOnlyTarget && (
                              <Chip size="sm" color="success" variant="soft" className="text-[10px] h-5 font-sans font-bold">
                                Target Only
                              </Chip>
                            )}
                            {isDifferent && (
                              <Chip size="sm" color="warning" variant="soft" className="text-[10px] h-5 font-sans font-bold">
                                Diff ({row.differingColumns.length})
                              </Chip>
                            )}

                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              onPress={() => setSelectedRowForModal(row)}
                              aria-label="Inspect full row comparison"
                              className="h-6 w-6 min-w-6 text-foreground/40 hover:text-foreground"
                            >
                              <Eye size={13} />
                            </Button>
                          </div>
                        </div>
                      </td>

                      {/* Source Columns Data */}
                      {columns.map((col) => {
                        const isDiffCol = isDifferent && row.differingColumns.includes(col);

                        if (isOnlyTarget || row.sourceData === null) {
                          // In "view only target" or target-only rows: source is empty!
                          return (
                            <td
                              key={`s-cell-${col}`}
                              className="py-2 px-3 text-center bg-blue-500/5 border-r border-default-100 text-blue-400/30 italic"
                            >
                              —
                            </td>
                          );
                        }

                        const val = row.sourceData[col];
                        const display = formatCellValue(val);

                        return (
                          <td
                            key={`s-cell-${col}`}
                            className={`py-2 px-3 truncate max-w-[160px] border-r border-default-100 ${
                              isDiffCol
                                ? 'bg-amber-500/20 text-amber-300 font-bold'
                                : 'text-blue-300'
                            }`}
                            title={display}
                          >
                            {display === 'NULL' ? (
                              <span className="text-foreground/30 italic">NULL</span>
                            ) : (
                              display
                            )}
                          </td>
                        );
                      })}

                      {/* Target Columns Data */}
                      {columns.map((col) => {
                        const isDiffCol = isDifferent && row.differingColumns.includes(col);

                        if (isOnlySource || row.targetData === null) {
                          // In "view only source" or source-only rows: target is empty!
                          return (
                            <td
                              key={`t-cell-${col}`}
                              className="py-2 px-3 text-center bg-emerald-500/5 border-r border-default-100 text-emerald-400/30 italic"
                            >
                              —
                            </td>
                          );
                        }

                        const val = row.targetData[col];
                        const display = formatCellValue(val);

                        return (
                          <td
                            key={`t-cell-${col}`}
                            className={`py-2 px-3 truncate max-w-[160px] border-r border-default-100 ${
                              isDiffCol
                                ? 'bg-amber-500/20 text-emerald-300 font-bold'
                                : 'text-emerald-300'
                            }`}
                            title={display}
                          >
                            {display === 'NULL' ? (
                              <span className="text-foreground/30 italic">NULL</span>
                            ) : (
                              display
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom Spinner / Progress indicator when loading more */}
            {isLoadingMore && (
              <div className="sticky bottom-0 z-20 py-3 bg-surface/90 backdrop-blur-xs border-t border-default-200 flex items-center justify-center gap-2 text-xs text-primary font-medium">
                <Spinner size="sm" />
                <span>Loading more records ({rows.length} of {totalMatches})...</span>
              </div>
            )}

            {!hasMore && rows.length > 0 && (
              <div className="py-3 text-center text-[11px] text-foreground/50 border-t border-default-200">
                All {totalMatches.toLocaleString()} matching records loaded
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Row detail inspection modal */}
      <RowDiffModal
        row={selectedRowForModal}
        columns={columns}
        uniqueKeys={uniqueKeys}
        tableName={tableName}
        onClose={() => setSelectedRowForModal(null)}
      />
    </Card>
  );
};
