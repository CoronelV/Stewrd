import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Separator, Button, Chip, Spinner, Input } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Server, Database, Check, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { validateReplication, startReplication } from '../../api/jobsApi';
import { getSchema, getActiveConnection } from '../../api/connectionsApi';
import { EnvironmentBadge } from '../common/EnvironmentBadge';
import type { JobValidationResult } from '../../api/requests.interface';

export const JobsView: React.FC = () => {
  const navigate = useNavigate();
  const { sourceDb, targetDb, runningJob, setRunningJob, addNotification } = useAppStore();

  const [sourceSchema, setSourceSchema] = useState<string>(
    sourceDb?.dbName && sourceDb.dbName !== '-' ? sourceDb.dbName : '',
  );
  const [destSchema, setDestSchema] = useState<string>(
    targetDb?.dbName && targetDb.dbName !== '-' ? targetDb.dbName : 'stewrd_local',
  );
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<JobValidationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Restore active connections on mount if not already populated
  useEffect(() => {
    let mounted = true;
    const restoreConnections = async () => {
      try {
        const [sourceRes, targetRes] = await Promise.allSettled([
          getActiveConnection('source'),
          getActiveConnection('target'),
        ]);
        if (!mounted) return;
        if (sourceRes.status === 'fulfilled' && sourceRes.value) {
          const { connection, ...rest } = sourceRes.value;
          useAppStore.getState().setSourceDb(rest);
        }
        if (targetRes.status === 'fulfilled' && targetRes.value) {
          const { connection, ...rest } = targetRes.value;
          useAppStore.getState().setTargetDb(rest);
        }
      } catch (err) {
        console.error('Failed to restore connections in JobsView:', err);
      }
    };

    if (sourceDb?.status === 'pending' || targetDb?.status === 'pending') {
      void restoreConnections();
    }
    return () => {
      mounted = false;
    };
  }, [sourceDb?.status, targetDb?.status]);

  // Auto-discover available schemas from the source database
  useEffect(() => {
    let mounted = true;
    const fetchSchemas = async () => {
      if (sourceDb?.status !== 'active') return;
      setIsLoadingSchemas(true);
      try {
        const schemaRes = await getSchema('source');
        if (mounted && schemaRes) {
          const list = schemaRes.availableSchemas || [];
          setAvailableSchemas(list);
          if (!sourceSchema && (schemaRes.schema || list.length > 0)) {
            const defaultSource = schemaRes.schema || (list.length > 0 ? list[0] : '');
            if (defaultSource) {
              setSourceSchema(defaultSource);
              if (!destSchema || destSchema === 'stewrd_local') {
                setDestSchema(defaultSource);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load source schemas:', err);
      } finally {
        if (mounted) setIsLoadingSchemas(false);
      }
    };

    void fetchSchemas();
    return () => {
      mounted = false;
    };
  }, [sourceDb?.status]);

  const handleRunJob = async () => {
    if (!sourceSchema.trim()) {
      addNotification({
        id: Date.now().toString(),
        message: 'Please define or select the source schema to copy.',
        status: 'warning',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateReplication({
        sourceTarget: 'source',
        destTarget: 'target',
        sourceSchema: sourceSchema.trim(),
        destSchema: destSchema.trim() || sourceSchema.trim(),
      });

      setValidationResult(result);

      if (!result.valid) {
        setIsModalOpen(true);
        setIsValidating(false);
        return;
      }

      const activeJob = await startReplication({
        sourceTarget: 'source',
        destTarget: 'target',
        sourceSchema: sourceSchema.trim(),
        destSchema: destSchema.trim() || sourceSchema.trim(),
      });

      setRunningJob(activeJob);
      addNotification({
        id: Date.now().toString(),
        message: `Job 'Replicate in local' started for schema '${sourceSchema.trim()}'.`,
        status: 'success',
      });

      navigate('/');
    } catch (err) {
      addNotification({
        id: Date.now().toString(),
        message: 'Failed to validate or start job: ' + String(err),
        status: 'error',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const isJobRunning = runningJob?.status === 'running';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Jobs Orchestrator</h2>
          <p className="text-sm text-foreground/70 mt-1">
            Execute and orchestrate data synchronization, cloning, and masking pipelines.
          </p>
        </div>
        {isJobRunning && (
          <Button
            variant="secondary"
            className="flex items-center gap-2 border-primary/50 text-primary"
            onPress={() => navigate('/')}
          >
            <RefreshCw size={16} className="animate-spin" />
            View Active Job in Dashboard
          </Button>
        )}
      </div>

      {/* Primary Job: Replicate in local */}
      <Card className="w-full border-2 border-default-200 hover:border-primary/40 transition-colors shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold">Replicate in local</h3>
                <Chip size="sm" variant="soft">
                  Core Sync
                </Chip>
              </div>
              <p className="text-sm text-foreground/70 mt-0.5">
                Copy full schema (DDL) and table data from source directly into your local MySQL database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {targetDb?.status === 'active' ? (
              <Chip size="md" color="success" variant="soft" className="gap-1.5 font-medium">
                <Check size={14} />
                Local Target Ready
              </Chip>
            ) : (
              <Chip size="md" color="warning" variant="soft" className="gap-1.5 font-medium">
                <AlertTriangle size={14} />
                Target Not Configured
              </Chip>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="py-5 flex flex-col gap-6">
          {/* Source and Target Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Source Database */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-default-100 border border-default-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-foreground/60 tracking-wider">
                  Source Database (Origin)
                </span>
                <EnvironmentBadge environment={sourceDb?.environment} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Server size={18} className="text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {sourceDb?.dbName && sourceDb.dbName !== '-' ? sourceDb.dbName : 'Configured Source'}
                  </span>
                  <span className="text-xs text-foreground/50">
                    Channel: {sourceDb?.channelType || '-'} • Status: {sourceDb?.status || 'inactive'}
                  </span>
                </div>
              </div>

              {/* Source Schema Selector */}
              <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-default-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/80">
                    Schema to copy:
                  </label>
                  {isLoadingSchemas && (
                    <div className="flex items-center gap-1 text-[11px] text-foreground/50">
                      <Spinner size="sm" />
                      <span>Loading schemas...</span>
                    </div>
                  )}
                </div>

                {availableSchemas.length > 0 ? (
                  <select
                    value={sourceSchema}
                    onChange={(e) => {
                      setSourceSchema(e.target.value);
                      if (destSchema === 'stewrd_local' || destSchema === sourceSchema) {
                        setDestSchema(e.target.value);
                      }
                    }}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-surface border border-separator text-foreground rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary cursor-pointer [color-scheme:dark]"
                  >
                    {availableSchemas.map((s) => (
                      <option key={s} value={s} className="bg-surface text-foreground">
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="Enter schema name to copy (e.g. my_db)"
                    value={sourceSchema}
                    onChange={(e) => {
                      setSourceSchema(e.target.value);
                      if (!destSchema || destSchema === 'stewrd_local') {
                        setDestSchema(e.target.value);
                      }
                    }}
                    variant="primary"
                    required
                  />
                )}
                <p className="text-[11px] text-foreground/50">
                  The origin database schema containing tables and records to replicate.
                </p>
              </div>
            </div>

            {/* Destination Database */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-default-100 border border-default-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-foreground/60 tracking-wider">
                  Destination Database (Local Target)
                </span>
                <EnvironmentBadge environment={targetDb?.environment && targetDb.environment !== '-' ? targetDb.environment : 'DEV'} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Database size={18} className="text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {targetDb?.dbName && targetDb.dbName !== '-' ? targetDb.dbName : 'stewrd_local'}
                  </span>
                  <span className="text-xs text-foreground/50">
                    Status: {targetDb?.status || 'Pending setup'}
                  </span>
                </div>
              </div>

              {/* Destination Schema Input */}
              <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-default-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/80">
                    Destination schema name:
                  </label>
                  {targetDb?.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-primary h-6 px-2"
                      onPress={() => navigate('/setup-target')}
                    >
                      Configure Target
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="stewrd_local"
                  value={destSchema}
                  onChange={(e) => setDestSchema(e.target.value)}
                  variant="primary"
                  required
                />
                <p className="text-[11px] text-foreground/50">
                  Target schema on your local MySQL. Will be automatically created if not present.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Checklist Info */}
          <div className="p-4 rounded-xl bg-default-50 border border-default-200 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase text-foreground/60">
              Pre-execution Environment Validations:
            </span>
            <ul className="text-xs text-foreground/75 list-disc list-inside space-y-1">
              <li>Verify connectivity to local MySQL service on port 3306.</li>
              <li>Check host database engine version and compatibility with source.</li>
              <li>Verify and prepare destination schema with DDL table creation privileges.</li>
            </ul>
          </div>

          {/* Execution Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-foreground/60">
              {isJobRunning && <span className="text-warning font-medium">A job is currently running.</span>}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="font-bold flex items-center gap-2.5 shadow-md px-6"
              isDisabled={isValidating || isJobRunning}
              onPress={handleRunJob}
            >
              {isValidating ? (
                <>
                  <Spinner size="sm" />
                  <span>Validating Local Environment...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Replicate in local</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Result Modal (if errors or warnings found) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex flex-col w-full max-w-xl bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-danger/10 text-danger">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Local Environment Validation</h4>
                  <p className="text-xs text-foreground/70">
                    Configuration issues were detected before starting replication.
                  </p>
                </div>
              </div>
              <Button isIconOnly variant="ghost" size="sm" onPress={() => setIsModalOpen(false)}>
                <X size={18} />
              </Button>
            </div>

            <div className="p-6 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {validationResult?.steps.map((step) => {
                const isSuccess = step.status === 'success';
                const isError = step.status === 'error';
                return (
                  <div
                    key={step.key}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      isSuccess
                        ? 'bg-success/5 border-success/30'
                        : isError
                        ? 'bg-danger/5 border-danger/30'
                        : 'bg-warning/5 border-warning/30'
                    }`}
                  >
                    {isSuccess && <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />}
                    {isError && <XCircle size={18} className="text-danger shrink-0 mt-0.5" />}
                    {step.status === 'warning' && <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />}

                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="font-semibold text-foreground">{step.title}</span>
                      <span className="text-foreground/80">{step.message}</span>
                      {step.detail && (
                        <span className="font-mono text-[11px] text-danger/80 mt-1 break-all">
                          {step.detail}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t border-separator bg-default-50">
              <Button
                variant="secondary"
                onPress={() => {
                  setIsModalOpen(false);
                  navigate('/setup-target');
                }}
              >
                Configure Local Target
              </Button>
              <Button variant="ghost" onPress={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsView;
