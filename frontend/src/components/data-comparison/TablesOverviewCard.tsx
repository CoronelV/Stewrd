import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Chip, Spinner } from '@heroui/react';
import { Table as TableIcon, Search, Check, AlertCircle, ArrowRight, Layers, X } from 'lucide-react';
import type { TableOverviewItem } from '../../api/requests.interface';

interface TablesOverviewCardProps {
  tables: TableOverviewItem[];
  selectedTable: string;
  onSelectTable: (tableName: string) => void;
  isLoading: boolean;
  sourceSchema: string;
  targetSchema: string;
}

export const TablesOverviewCard: React.FC<TablesOverviewCardProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
  sourceSchema,
  targetSchema,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTables = tables.filter((t) =>
    t.tableName.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  return (
    <Card className="w-full border border-default-200 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-5 border-b border-default-200/80 bg-default-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {sourceSchema === targetSchema ? (
                <>
                  Tables in Schema <span className="font-mono text-primary font-semibold">`{sourceSchema}`</span>
                </>
              ) : (
                <>
                  Tables Comparing <span className="font-mono text-blue-400 font-semibold">`{sourceSchema}`</span>{' '}
                  <span className="text-foreground/50 font-normal">↔</span>{' '}
                  <span className="font-mono text-emerald-400 font-semibold">`{targetSchema}`</span>
                </>
              )}
            </h3>
            <p className="text-xs text-foreground/60">
              {tables.length} table{tables.length === 1 ? '' : 's'} available • Click a row to compare data
            </p>
          </div>
        </div>

        <div className="w-48 md:w-64 relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-default-100 hover:bg-default-200/70 border border-separator/60 rounded-lg pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-foreground/40 focus:outline-hidden focus:border-primary transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 text-foreground/40 hover:text-foreground cursor-pointer"
              aria-label="Clear table filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-foreground/60">
            <Spinner size="md" />
            <span className="text-xs">Analyzing tables and counting records in Source & Target...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-10 text-center text-xs text-foreground/50">
            {searchTerm ? `No tables match "${searchTerm}"` : 'No tables found in this schema'}
          </div>
        ) : (
          /* Compact table container: "no muy alta" */
          <div className="max-h-56 overflow-y-auto divide-y divide-default-100 select-none">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xs border-b border-default-200 text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                <tr>
                  <th className="py-2 px-4">Table</th>
                  <th className="py-2 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 text-blue-500">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Source Count
                    </span>
                  </th>
                  <th className="py-2 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Target Count
                    </span>
                  </th>
                  <th className="py-2 px-4 text-center">Status</th>
                  <th className="py-2 px-4 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100 text-xs font-medium">
                {filteredTables.map((t) => {
                  const isSelected = t.tableName === selectedTable;
                  const delta = t.sourceCount - t.targetCount;
                  const isIdenticalCount = t.sourceCount >= 0 && t.targetCount >= 0 && delta === 0;

                  return (
                    <tr
                      key={t.tableName}
                      onClick={() => onSelectTable(t.tableName)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? 'bg-primary/10 border-l-4 border-l-primary font-semibold'
                          : 'hover:bg-default-100/70 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="py-2 px-4 font-mono font-semibold text-foreground flex items-center gap-2">
                        <TableIcon size={14} className={isSelected ? 'text-primary' : 'text-foreground/40'} />
                        <span className="truncate max-w-[240px]">{t.tableName}</span>
                        {t.primaryKeys.length > 0 && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-default-200 text-foreground/60 font-mono">
                            PK: {t.primaryKeys.join(', ')}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-4 text-right font-mono text-foreground/90">
                        {t.existsInSource ? (
                          <span className="text-blue-500 font-semibold">{t.sourceCount.toLocaleString()}</span>
                        ) : (
                          <span className="text-danger text-[11px] italic">Not in source</span>
                        )}
                      </td>

                      <td className="py-2 px-4 text-right font-mono text-foreground/90">
                        {t.existsInTarget ? (
                          <span className="text-emerald-500 font-semibold">{t.targetCount.toLocaleString()}</span>
                        ) : (
                          <span className="text-danger text-[11px] italic">Not in target</span>
                        )}
                      </td>

                      <td className="py-2 px-4 text-center">
                        {!t.existsInTarget ? (
                          <Chip size="sm" color="danger" variant="soft" className="text-[10px] h-5">
                            Missing in Target
                          </Chip>
                        ) : !t.existsInSource ? (
                          <Chip size="sm" color="danger" variant="soft" className="text-[10px] h-5">
                            Missing in Source
                          </Chip>
                        ) : isIdenticalCount ? (
                          <Chip size="sm" color="success" variant="soft" className="text-[10px] h-5 gap-1">
                            <Check size={11} /> Same Count
                          </Chip>
                        ) : (
                          <Chip size="sm" color="warning" variant="soft" className="text-[10px] h-5 gap-1">
                            <AlertCircle size={11} />
                            Diff: {delta > 0 ? `+${delta}` : delta}
                          </Chip>
                        )}
                      </td>

                      <td className="py-2 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-default-100 text-foreground/70 hover:bg-default-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Compare'}
                          <ArrowRight size={11} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
