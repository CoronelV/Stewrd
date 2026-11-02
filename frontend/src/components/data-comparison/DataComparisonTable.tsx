import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent, Chip, Spinner, Button } from '@heroui/react';
import { CheckCircle2, Eye, Database, ArrowRightToLine, ArrowLeftToLine } from 'lucide-react';
import type { ComparisonRow, ComparisonFilter, SyncDirection } from '../../api/requests.interface';
import { RowDiffModal } from './RowDiffModal';
import { SyncMissingRecordsModal } from './SyncMissingRecordsModal';

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
  sourceSchema: string;
  targetSchema: string;
  sourceEnvironment?: string | undefined;
  targetEnvironment?: string | undefined;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  canSync: boolean;
  syncingDirection: SyncDirection | null;
  syncProgress: number;
  isOtherJobRunning: boolean;
  onSyncMissing: (direction: SyncDirection, rowKeys?: string[]) => void;
}

const isSelectableRow = (row: ComparisonRow): boolean =>
  row.status === 'only_source' || row.status === 'only_target';

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
  sourceSchema,
  targetSchema,
  sourceEnvironment,
  targetEnvironment,
  sourceOnlyCount,
  targetOnlyCount,
  canSync,
  syncingDirection,
  syncProgress,
  isOtherJobRunning,
  onSyncMissing,
}) => {
  const [selectedRowForModal, setSelectedRowForModal] = useState<ComparisonRow | null>(null);
  const [pendingSync, setPendingSync] = useState<{ direction: SyncDirection; rowKeys: string[]; count: number } | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(() => new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clear the selection when the compared data changes or a sync finishes
  const uniqueKeysSignature = uniqueKeys.join('|');
  useEffect(() => {
    if (syncingDirection === null) {
      setSelectAll(false);
      setSelectedRowKeys(new Set());
    }
  }, [tableName, filter, uniqueKeysSignature, sourceSchema, targetSchema, syncingDirection]);

  const selectionEnabled = canSync && rows.some(isSelectableRow);

  const getRowKey = (row: ComparisonRow): string => {
    if (row.rowKey) {
      return row.rowKey;
    }
    if (row.keyValues && uniqueKeys.length > 0) {
      return uniqueKeys.map((k) => String(row.keyValues[k] ?? '')).join('\x00');
    }
    if (row.keyValues) {
      return Object.entries(row.keyValues)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${String(v)}`)
        .join('\x00');
    }
    return JSON.stringify(row.sourceData || row.targetData);
  };

  const isRowChecked = (row: ComparisonRow): boolean => selectAll || selectedRowKeys.has(getRowKey(row));

  const toggleSelectAll = (): void => {
    setSelectAll((prev) => !prev);
    setSelectedRowKeys(new Set());
  };

  const toggleRow = (row: ComparisonRow): void => {
    const key = getRowKey(row);
    if (selectAll) {
      // Leaving "select all": keep every loaded missing record except the one unchecked
      setSelectAll(false);
      setSelectedRowKeys(new Set(rows.filter((r) => isSelectableRow(r) && getRowKey(r) !== key).map(getRowKey)));
      return;
    }
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // "Select all" sends no row keys, meaning every missing record (including rows not loaded yet)
  const getSelection = (direction: SyncDirection): { rowKeys: string[]; count: number } => {
    const toTarget = direction === 'source_to_target';
    if (toTarget ? filter === 'only_target' : filter === 'only_source') {
      return { rowKeys: [], count: 0 };
    }
    if (selectAll) {
      return { rowKeys: [], count: toTarget ? sourceOnlyCount : targetOnlyCount };
    }
    const status = toTarget ? 'only_source' : 'only_target';
    const rowKeys = rows.filter((r) => r.status === status && selectedRowKeys.has(getRowKey(r))).map(getRowKey);
    return { rowKeys, count: rowKeys.length };
  };

  const toTargetSelection = getSelection('source_to_target');
  const toSourceSelection = getSelection('target_to_source');
  const syncButtonsDisabled = isLoading || syncingDirection !== null || isOtherJobRunning;

  // Do not render empty database columns if there is no data to show (e.g. target is always empty when inserting source-only records)
  const hasTargetData = rows.some((r) => r.targetData !== null);
  const hasSourceData = rows.some((r) => r.sourceData !== null);
  const showTargetColumns = filter === 'only_target' || (filter === 'differences' && hasTargetData);
  const showSourceColumns = filter === 'only_source' || (filter === 'differences' && (hasSourceData || !showTargetColumns));

  const renderSyncButton = (direction: SyncDirection, selection: { rowKeys: string[]; count: number }): React.ReactNode => {
    const toTarget = direction === 'source_to_target';
    const isSyncing = syncingDirection === direction;
    return (
      <Button
        size="sm"
        variant="secondary"
        isDisabled={syncButtonsDisabled}
        onPress={() => {
          setPendingSync({ direction, ...selection });
        }}
        className={`h-7 text-[11px] font-semibold gap-1.5 ${
          toTarget
            ? 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10'
            : 'border-blue-500/40 text-blue-500 hover:bg-blue-500/10'
        }`}
      >
        {isSyncing ? (
          <>
            <Spinner size="sm" />
            <span>Inserting… {syncProgress}%</span>
          </>
        ) : (
          <>
            {toTarget ? <ArrowRightToLine size={13} /> : <ArrowLeftToLine size={13} />}
            <span>
              Insert {selection.count.toLocaleString()} into {toTarget ? 'Target' : 'Source'}
            </span>
          </>
        )}
      </Button>
    );
  };

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
          {(toTargetSelection.count > 0 || toSourceSelection.count > 0 || syncingDirection !== null) && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-default-200">
              {(toTargetSelection.count > 0 || syncingDirection === 'source_to_target') &&
                renderSyncButton('source_to_target', toTargetSelection)}
              {(toSourceSelection.count > 0 || syncingDirection === 'target_to_source') &&
                renderSyncButton('target_to_source', toSourceSelection)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-foreground/60">
          {showSourceColumns && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500" />
              <span className="text-blue-500 font-semibold">Source Active</span>
            </div>
          )}
          {showTargetColumns && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500" />
              <span className="text-emerald-500 font-semibold">Target Active</span>
            </div>
          )}
          {showSourceColumns && showTargetColumns && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500" />
              <span className="text-amber-500 font-semibold">Values Differ</span>
            </div>
          )}
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
                    className="sticky left-0 z-30 bg-surface border-r border-default-200 py-2.5 px-3 font-bold text-foreground/80 min-w-[140px]"
                  >
                    <div className="flex items-center justify-between">
                      {selectionEnabled ? (
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          disabled={syncingDirection !== null}
                          title="Select all"
                          aria-label="Select all"
                          className="w-3.5 h-3.5 cursor-pointer accent-primary"
                        />
                      ) : (
                        <span />
                      )}
                      <span className="text-[10px] text-foreground/50 font-normal">Status</span>
                    </div>
                  </th>

                  {/* Group 1: Source DB Columns */}
                  {showSourceColumns && (
                    <th
                      colSpan={columns.length}
                      className={`py-1.5 px-3 bg-blue-500/10 border-b ${
                        showTargetColumns ? 'border-r border-blue-500/30' : 'border-r-0'
                      } text-center font-bold text-blue-500 uppercase tracking-wider`}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <Database size={13} />
                        <span>Source Database (Origin)</span>
                      </div>
                    </th>
                  )}

                  {/* Group 2: Target DB Columns */}
                  {showTargetColumns && (
                    <th
                      colSpan={columns.length}
                      className="py-1.5 px-3 bg-emerald-500/10 border-b border-r-0 text-center font-bold text-emerald-500 uppercase tracking-wider"
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <Database size={13} />
                        <span>Target Database (Destination)</span>
                      </div>
                    </th>
                  )}
                </tr>

                {/* Level 2: Individual Column Names */}
                <tr className="border-b border-default-200 font-mono text-[10px] uppercase tracking-wider text-foreground/70">
                  {/* Source Columns */}
                  {showSourceColumns &&
                    columns.map((col) => (
                      <th
                        key={`s-col-${col}`}
                        className={`py-1.5 px-3 bg-blue-500/5 text-blue-400 font-semibold truncate max-w-[150px] border-r border-default-100 ${
                          showTargetColumns ? 'last:border-r-blue-500/30' : 'last:border-r-0'
                        }`}
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
                  {showTargetColumns &&
                    columns.map((col) => (
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

                  return (
                    <tr
                      key={`${row.status}-${index}-${getRowKey(row)}`}
                      style={{
                        animation: 'stewrdRowEnter 0.25s ease-out forwards',
                        animationDelay: `${Math.min(index % 50, 10) * 15}ms`,
                      }}
                      className="hover:bg-default-100/50 transition-colors group"
                    >
                      {/* Sticky Left Identity & Status */}
                      <td className="sticky left-0 z-10 bg-surface group-hover:bg-default-100/90 border-r border-default-200 py-2 px-3">
                        <div className="flex items-center justify-between gap-2">
                          {selectionEnabled && isSelectableRow(row) ? (
                            <input
                              type="checkbox"
                              checked={isRowChecked(row)}
                              onChange={() => {
                                toggleRow(row);
                              }}
                              disabled={syncingDirection !== null}
                              className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-primary"
                            />
                          ) : (
                            <span />
                          )}

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
                      {showSourceColumns &&
                        columns.map((col) => {
                          const isDiffCol = isDifferent && row.differingColumns.includes(col);

                          if (isOnlyTarget || row.sourceData === null) {
                            return (
                              <td
                                key={`s-cell-${col}`}
                                className={`py-2 px-3 text-center bg-blue-500/5 border-r border-default-100 ${
                                  showTargetColumns ? '' : 'last:border-r-0'
                                } text-blue-400/30 italic`}
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
                                showTargetColumns ? '' : 'last:border-r-0'
                              } ${
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
                      {showTargetColumns &&
                        columns.map((col) => {
                          const isDiffCol = isDifferent && row.differingColumns.includes(col);

                          if (isOnlySource || row.targetData === null) {
                            return (
                              <td
                                key={`t-cell-${col}`}
                                className="py-2 px-3 text-center bg-emerald-500/5 border-r border-default-100 last:border-r-0 text-emerald-400/30 italic"
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
                              className={`py-2 px-3 truncate max-w-[160px] border-r border-default-100 last:border-r-0 ${
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

      {/* Insert-only sync confirmation */}
      <SyncMissingRecordsModal
        direction={pendingSync?.direction ?? null}
        tableName={tableName}
        sourceSchema={sourceSchema}
        targetSchema={targetSchema}
        sourceEnvironment={sourceEnvironment}
        targetEnvironment={targetEnvironment}
        recordCount={pendingSync?.count ?? 0}
        onConfirm={(direction) => {
          const rowKeys = pendingSync?.rowKeys ?? [];
          setPendingSync(null);
          onSyncMissing(direction, rowKeys.length > 0 ? rowKeys : undefined);
        }}
        onClose={() => {
          setPendingSync(null);
        }}
      />
    </Card>
  );
};
