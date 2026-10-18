import React, { useState } from 'react';
import { Card, CardContent, Chip, Button, Spinner } from '@heroui/react';
import {
  Database,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DatabaseInfo } from '../../store/useAppStore';
import type { SchemaValidationResponse } from '../../api/requests.interface';
import { DatabaseEngineIcon } from '../common/DatabaseEngineIcon';
import { EnvironmentBadge } from '../common/EnvironmentBadge';

interface CommonSchemaSelectorProps {
  sourceSchemas: string[];
  targetSchemas: string[];
  selectedSourceSchema: string;
  selectedTargetSchema: string;
  onSelectSourceSchema: (schema: string) => void;
  onSelectTargetSchema: (schema: string) => void;
  isValidating: boolean;
  validationResult: SchemaValidationResponse | null;
  sourceDb: DatabaseInfo | null;
  targetDb: DatabaseInfo | null;
}

export const CommonSchemaSelector: React.FC<CommonSchemaSelectorProps> = ({
  sourceSchemas,
  targetSchemas,
  selectedSourceSchema,
  selectedTargetSchema,
  onSelectSourceSchema,
  onSelectTargetSchema,
  isValidating,
  validationResult,
  sourceDb,
  targetDb,
}) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const isSourceActive = sourceDb?.status === 'active';
  const isTargetActive = targetDb?.status === 'active';

  if (!isSourceActive || !isTargetActive) {
    return (
      <Card className="w-full border border-warning/40 bg-warning/5 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/20 text-warning">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Both Database Connections Required</h3>
              <p className="text-sm text-foreground/70">
                To compare data, both <strong>Source</strong> and <strong>Target</strong> databases must be active.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Chip size="sm" color={isSourceActive ? 'success' : 'danger'} variant="soft">
                  Source: {isSourceActive ? 'Connected' : 'Not Connected'}
                </Chip>
                <Chip size="sm" color={isTargetActive ? 'success' : 'danger'} variant="soft">
                  Target: {isTargetActive ? 'Connected' : 'Not Connected'}
                </Chip>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSourceActive && (
              <Button size="sm" variant="secondary" onPress={() => navigate('/setup-source')}>
                Configure Source <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
            {!isTargetActive && (
              <Button size="sm" variant="secondary" onPress={() => navigate('/setup-target')}>
                Configure Target <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mismatchedTables = validationResult?.tables.filter((t) => t.status !== 'compatible') ?? [];
  const preferredSourceSchema = sourceDb?.dbName && sourceDb.dbName !== '-' ? sourceDb.dbName : '';
  const preferredTargetSchema = targetDb?.dbName && targetDb.dbName !== '-' ? targetDb.dbName : '';

  return (
    <Card className="w-full border border-default-200 shadow-xs">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          {/* Source Schema Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <DatabaseEngineIcon engine={sourceDb?.engine || '-'} size={18} />
              <span className="text-xs font-semibold text-blue-500 shrink-0">Source Schema:</span>
              <EnvironmentBadge environment={sourceDb?.environment} size="sm" />
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-[240px]">
              {sourceSchemas.length > 0 ? (
                <select
                  id="source-schema-select"
                  aria-label="Select Source Schema"
                  value={selectedSourceSchema}
                  onChange={(e) => onSelectSourceSchema(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-default-100 hover:bg-default-200 border border-blue-500/30 rounded-lg px-3 py-1.5 text-sm font-semibold font-mono text-foreground focus:outline-hidden focus:border-blue-500 cursor-pointer transition-colors [color-scheme:dark]"
                >
                  {sourceSchemas.map((s) => (
                    <option key={s} value={s} className="bg-surface text-foreground font-mono">
                      {s}{s === preferredSourceSchema ? ' (Preferred)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-1.5 bg-default-100 rounded-lg text-xs text-danger border border-danger/30">
                  No source schemas
                </div>
              )}
            </div>
          </div>

          {/* Target Schema Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <DatabaseEngineIcon engine={targetDb?.engine || '-'} size={18} />
              <span className="text-xs font-semibold text-emerald-500 shrink-0">Target Schema:</span>
              <EnvironmentBadge environment={targetDb?.environment} size="sm" />
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-[240px]">
              {targetSchemas.length > 0 ? (
                <select
                  id="target-schema-select"
                  aria-label="Select Target Schema"
                  value={selectedTargetSchema}
                  onChange={(e) => onSelectTargetSchema(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-default-100 hover:bg-default-200 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-sm font-semibold font-mono text-foreground focus:outline-hidden focus:border-emerald-500 cursor-pointer transition-colors [color-scheme:dark]"
                >
                  {targetSchemas.map((s) => (
                    <option key={s} value={s} className="bg-surface text-foreground font-mono">
                      {s}{s === preferredTargetSchema ? ' (Preferred)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-1.5 bg-default-100 rounded-lg text-xs text-danger border border-danger/30">
                  No target schemas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Automatic Schema Validation Status Bar */}
        {isValidating ? (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-default-100/80 border border-default-200 text-xs text-foreground/70">
            <Spinner size="sm" />
            <span>
              Validating schema compatibility between{' '}
              <strong className="font-mono text-blue-400">{selectedSourceSchema}</strong> and{' '}
              <strong className="font-mono text-emerald-400">{selectedTargetSchema}</strong>...
            </span>
          </div>
        ) : validationResult ? (
          <div
            className={`flex flex-col gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
              validationResult.status === 'valid'
                ? 'bg-success/10 border-success/30 text-foreground'
                : validationResult.status === 'warning'
                ? 'bg-warning/10 border-warning/30 text-foreground'
                : 'bg-danger/10 border-danger/30 text-foreground'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-start md:items-center gap-2.5">
                {validationResult.status === 'valid' && (
                  <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5 md:mt-0" />
                )}
                {validationResult.status === 'warning' && (
                  <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5 md:mt-0" />
                )}
                {validationResult.status === 'invalid' && (
                  <XCircle size={18} className="text-danger shrink-0 mt-0.5 md:mt-0" />
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <span className="font-semibold">{validationResult.summary}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Chip size="sm" color="success" variant="soft" className="text-[10px] h-5 font-mono">
                  {validationResult.compatibleTables} Compatible
                </Chip>
                {validationResult.columnMismatchTables > 0 && (
                  <Chip size="sm" color="warning" variant="soft" className="text-[10px] h-5 font-mono">
                    {validationResult.columnMismatchTables} Column Diff
                  </Chip>
                )}
                {validationResult.missingInTargetCount > 0 && (
                  <Chip size="sm" color="danger" variant="soft" className="text-[10px] h-5 font-mono">
                    {validationResult.missingInTargetCount} Missing in Target
                  </Chip>
                )}
                {validationResult.missingInSourceCount > 0 && (
                  <Chip size="sm" color="danger" variant="soft" className="text-[10px] h-5 font-mono">
                    {validationResult.missingInSourceCount} Missing in Source
                  </Chip>
                )}
                {mismatchedTables.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setShowDetails((prev) => !prev)}
                    className="h-6 px-2 text-[11px] font-semibold text-foreground/80"
                  >
                    {showDetails ? (
                      <>
                        Hide Schema Details <ChevronUp size={13} className="ml-1" />
                      </>
                    ) : (
                      <>
                        View Schema Details ({mismatchedTables.length}) <ChevronDown size={13} className="ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {showDetails && mismatchedTables.length > 0 && (
              <div className="mt-1 pt-2.5 border-t border-default-200/60 max-h-48 overflow-y-auto flex flex-col gap-1.5">
                {mismatchedTables.map((tbl) => (
                  <div
                    key={tbl.tableName}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-surface/70 border border-default-200/70 text-[11px]"
                  >
                    <div className="flex items-center gap-2 font-mono font-semibold">
                      <Database size={12} className="text-foreground/50" />
                      <span>{tbl.tableName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-foreground/75">
                      {tbl.status === 'missing_in_target' && (
                        <span className="text-danger font-medium">
                          Table missing in Target schema ({tbl.sourceColumnCount} cols in Source)
                        </span>
                      )}
                      {tbl.status === 'missing_in_source' && (
                        <span className="text-danger font-medium">
                          Table missing in Source schema ({tbl.targetColumnCount} cols in Target)
                        </span>
                      )}
                      {tbl.status === 'column_mismatch' && (
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                          {tbl.missingInTarget.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
                              Only in Source: {tbl.missingInTarget.join(', ')}
                            </span>
                          )}
                          {tbl.missingInSource.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                              Only in Target: {tbl.missingInSource.join(', ')}
                            </span>
                          )}
                          {tbl.typeMismatches.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                              Type Diff: {tbl.typeMismatches.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
