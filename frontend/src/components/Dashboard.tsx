import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Separator, Chip, Spinner, Button } from '@heroui/react';
import { ArrowRight, Activity, Clock, Layers, PlayCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  getTelemetry,
  getActiveConnection,
  removeActiveConnection,
  getConnectionSchemas,
  updatePreferredSchema,
} from '../api/connectionsApi';
import { getActiveJob } from '../api/jobsApi';
import { mockDashboardState } from '../constants/system/systemConstants';
import type {
  ConnectionStatus,
  DatabaseInfo,
  RunningJobInfo,
  ConnectionStats,
  ConnectionTarget,
} from '../store/useAppStore';
import { dashboardTheme } from '../constants/ui/themeConstants';
import { SchemaDiagramModal } from './schema-diagram/SchemaDiagramModal';
import { EnvironmentBadge } from './common/EnvironmentBadge';
import { DatabaseEngineIcon } from './common/DatabaseEngineIcon';
import { getEngineOption } from '../constants/database/engineConstants';

const StatusIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const bgClass = dashboardTheme.connectionStatusClasses[status] || 'bg-gray-600';

  return (
    <Chip className={`${bgClass} text-white font-medium border-none px-3`} size="md">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          {status !== 'inactive' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          )}
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <span className="capitalize">{status}</span>
      </div>
    </Chip>
  );
};

const DatabaseStatusCard: React.FC<{ info: DatabaseInfo | null; title: string }> = ({ info, title }) => {
  const { setSourceDb, setTargetDb, setAvailableSchemas, setPreferredSchema, addNotification } = useAppStore();
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const [isUpdatingSchema, setIsUpdatingSchema] = useState(false);

  const schemas = info?.availableSchemas || [];

  useEffect(() => {
    if (!info || info.status !== 'active') {
      return;
    }
    if (info.availableSchemas && info.availableSchemas.length > 0) {
      return;
    }

    let mounted = true;
    setIsLoadingSchemas(true);

    getConnectionSchemas(info.target)
      .then((list) => {
        if (!mounted) return;
        setAvailableSchemas(info.target, list);
      })
      .catch((err) => {
        console.error(`Failed to load available schemas for ${info.target}:`, err);
      })
      .finally(() => {
        if (mounted) setIsLoadingSchemas(false);
      });

    return () => {
      mounted = false;
    };
  }, [info?.status, info?.target, info?.availableSchemas?.length, setAvailableSchemas]);

  if (!info) {
    return (
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <p className="text-md font-bold">{title}</p>
        </CardHeader>
        <Separator />
        <CardContent className="py-8 flex justify-center items-center text-foreground/70">
          Not configured yet
        </CardContent>
      </Card>
    );
  }

  const hasEngine = Boolean(info.engine && info.engine !== '-' && info.engine.trim() !== '');
  const engineOption = getEngineOption(info.engine);
  const currentPreferredSchema = info.dbName && info.dbName !== '-' ? info.dbName : '';
  const schemaDisplay =
    info.status === 'active' && !currentPreferredSchema
      ? 'No preferred schema (per-action)'
      : info.dbName;

  const handlePreferredSchemaChange = async (newSchema: string) => {
    setIsUpdatingSchema(true);
    setPreferredSchema(info.target, newSchema);
    try {
      const updated = await updatePreferredSchema(info.target, newSchema);
      const mergedSchemas =
        updated.availableSchemas && updated.availableSchemas.length > 0
          ? updated.availableSchemas
          : schemas;
      if (info.target === 'source') {
        setSourceDb({ ...updated, availableSchemas: mergedSchemas });
      } else {
        setTargetDb({ ...updated, availableSchemas: mergedSchemas });
      }
      addNotification({
        id: Date.now().toString(),
        message: newSchema
          ? `Preferred schema for ${title} set to '${newSchema}'`
          : `Cleared preferred schema for ${title}`,
        status: 'success',
      });
    } catch (err) {
      console.error('Failed to update preferred schema:', err);
      addNotification({
        id: Date.now().toString(),
        message: `Failed to update preferred schema for ${title}`,
        status: 'error',
      });
    } finally {
      setIsUpdatingSchema(false);
    }
  };

  return (
    <Card className="w-full relative">
      <CardHeader className="flex flex-row items-center justify-between w-full py-4 px-5 min-h-[88px]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-default-100/90 border border-separator shadow-xs shrink-0 flex items-center justify-center">
            <DatabaseEngineIcon engine={info.engine} size={30} />
          </div>
          <div className="flex flex-col items-start gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-md font-bold truncate">{title}</p>
              {hasEngine && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-default-100 border border-separator text-xs font-semibold text-foreground shrink-0">
                  <DatabaseEngineIcon engine={info.engine} size={15} />
                  <span>{engineOption.name}</span>
                </div>
              )}
            </div>
            <p className="text-small text-foreground/70 truncate">{schemaDisplay}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusIndicator status={info.status} />
          <EnvironmentBadge environment={info.environment} size="md" />
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/70 uppercase font-semibold">Channel Type</span>
              <span className="text-sm font-medium truncate">{info.channelType}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/70 uppercase font-semibold">Username</span>
              <span className="text-sm font-medium truncate">{info.username}</span>
            </div>
          </div>

          {info.status === 'active' && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-default-100/80 border border-primary/20">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`dashboard-preferred-schema-${info.target}`}
                  className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5"
                >
                  <Database size={13} className="text-primary shrink-0" />
                  <span>Preferred DB Schema (Default)</span>
                </label>
                {(isLoadingSchemas || isUpdatingSchema) && <Spinner size="sm" />}
              </div>
              <select
                id={`dashboard-preferred-schema-${info.target}`}
                value={currentPreferredSchema}
                disabled={isLoadingSchemas || isUpdatingSchema}
                onChange={(e) => void handlePreferredSchemaChange(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-surface border border-separator text-foreground rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-primary cursor-pointer [color-scheme:dark]"
              >
                <option value="" className="bg-surface text-foreground font-sans">
                  No preferred schema (select per action)
                </option>
                {schemas.map((schema) => (
                  <option key={schema} value={schema} className="bg-surface text-foreground font-mono">
                    {schema}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-foreground/55">
                Used as default across Jobs, Data Comparison, and Schema Viewer.
              </span>
            </div>
          )}

          {(info.status === 'active' || info.status === 'inactive' || info.status === 'pending') && (
            <>
              <Separator />
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status !== 'active' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.cpuUsage}%</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">CPU</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status !== 'active' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.memoryUsage}%</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">Mem</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status !== 'active' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.diskUsage} MB</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">Disk</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status !== 'active' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.activeConnections}</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">Conns</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ConnectionStatsView: React.FC<{ stats: ConnectionStats, title: string }> = ({ stats, title }) => (
  <div className="flex flex-col items-center justify-center p-4 gap-2 bg-default-100 rounded-lg w-full h-full">
    <span className="text-sm font-semibold text-foreground/70">{title}</span>
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold">{stats.speed}</span>
        <span className="text-xs text-foreground/50">Speed</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold">{stats.latency}</span>
        <span className="text-xs text-foreground/50">Latency</span>
      </div>
    </div>
  </div>
);

const RunningJobCard: React.FC<{ jobInfo: RunningJobInfo | null }> = ({ jobInfo }) => {
  const navigate = useNavigate();

  if (!jobInfo) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between w-full py-4 px-5">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            <p className="text-md font-bold">Replication Job</p>
          </div>
          <div className="ml-auto">
            <Chip size="sm" variant="soft">No active runs</Chip>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-sm text-foreground/70">
            <p className="font-semibold text-foreground">No replication jobs currently running.</p>
            <p>You can launch &apos;Replicate in local&apos; to clone the schema and data into your local database.</p>
          </div>
          <Button
            variant="primary"
            className="font-bold flex items-center gap-2 shadow-xs"
            onPress={() => navigate('/jobs')}
          >
            <PlayCircle size={16} />
            Go to Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusColor =
    jobInfo.status === 'running'
      ? 'primary'
      : jobInfo.status === 'completed'
      ? 'success'
      : jobInfo.status === 'failed'
      ? 'danger'
      : 'default';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between w-full py-4 px-5">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          <p className="text-md font-bold">{jobInfo.name || 'Replicate in local'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Chip size="sm" variant="soft" className="capitalize">
            {jobInfo.jobStats.phase}
          </Chip>
          <Chip size="sm" color={statusColor as any} variant="soft" className="capitalize font-bold">
            {jobInfo.status}
          </Chip>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="py-3">
        {jobInfo.errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-mono">
            Error: {jobInfo.errorMessage}
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          {/* Source Connection */}
          <div className="flex-1 w-full h-full">
            <ConnectionStatsView stats={jobInfo.sourceConnection} title="Source Connection" />
          </div>

          {/* Arrow */}
          <div className="hidden md:flex text-default-300">
            <ArrowRight size={32} />
          </div>

          {/* Job Stats */}
          <div className="flex-[2] w-full px-4 flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Synchronization Progress</span>
                <span className="text-xs text-foreground/50">{jobInfo.jobStats.recordsSynced.toLocaleString()} / {jobInfo.jobStats.recordsToSync.toLocaleString()} records</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Clock size={14} className="text-foreground/50" />
                ETA: {jobInfo.jobStats.eta}
              </div>
            </div>

            <div className="w-full bg-default-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${jobInfo.jobStats.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-foreground/50">
              <span>0%</span>
              <span className="font-semibold text-primary">{jobInfo.jobStats.progress}%</span>
              <span>100%</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div className="flex flex-col p-2 bg-default-100 rounded-lg">
                <span className="text-lg font-bold text-primary">{jobInfo.jobStats.throughput.toLocaleString()}</span>
                <span className="text-xs text-foreground/50">Rows/sec</span>
              </div>
              <div className="flex flex-col p-2 bg-default-100 rounded-lg">
                <span className="text-lg font-bold text-warning">{jobInfo.jobStats.replicationLag}s</span>
                <span className="text-xs text-foreground/50">Lag</span>
              </div>
              <div className="flex flex-col p-2 bg-default-100 rounded-lg">
                <span className="text-lg font-bold text-danger">{jobInfo.jobStats.errors}</span>
                <span className="text-xs text-foreground/50">Errors</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex text-default-300">
            <ArrowRight size={32} />
          </div>

          {/* Target Connection */}
          <div className="flex-1 w-full h-full">
            <ConnectionStatsView stats={jobInfo.targetConnection} title="Target Connection" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    sourceDb,
    targetDb,
    runningJob,
    updateSourceTelemetry,
    updateTargetTelemetry,
    setSourceDb,
    setTargetDb,
    addNotification,
    config,
  } = useAppStore();
  const [selectedSchemaTarget, setSelectedSchemaTarget] = useState<ConnectionTarget | null>(null);
  const [selectedDbInfo, setSelectedDbInfo] = useState<DatabaseInfo | null>(null);

  const handleOpenSchema = (target: ConnectionTarget, info: DatabaseInfo | null) => {
    if (!info || info.status !== 'active') return;
    setSelectedSchemaTarget(target);
    setSelectedDbInfo(info);
  };

  const handleReconnect = async (target: ConnectionTarget, notifId: string) => {
    useAppStore.getState().removeNotification(notifId);
    try {
      const active = await getActiveConnection(target);
      if (active && active.connection) {
        if (target === 'source') {
          setSourceDb(active);
        } else {
          setTargetDb(active);
        }
        const tel = await getTelemetry({ target });
        if (target === 'source') {
          updateSourceTelemetry({
            cpuUsage: tel.cpuUsage,
            memoryUsage: tel.memoryUsage,
            diskUsage: Math.round(tel.diskUsage),
            activeConnections: tel.activeConnections,
          });
        } else {
          updateTargetTelemetry({
            cpuUsage: tel.cpuUsage,
            memoryUsage: tel.memoryUsage,
            diskUsage: Math.round(tel.diskUsage),
            activeConnections: tel.activeConnections,
          });
        }
        addNotification({
          id: Date.now().toString(),
          message: `Connection re-established for ${target === 'source' ? 'Source' : 'Target'} database`,
          status: 'success',
        });
        return;
      }
    } catch {
      // Reconnect probe failed or no active connection on backend
    }
    navigate(target === 'source' ? '/setup-source' : '/setup-target');
  };

  const handleRemoveConnection = async (target: ConnectionTarget, notifId: string) => {
    useAppStore.getState().removeNotification(notifId);
    try {
      await removeActiveConnection(target);
    } catch (e) {
      console.error('Failed to remove active connection on backend', e);
    }
    if (target === 'source') {
      setSourceDb(mockDashboardState.sourceDb);
    } else {
      setTargetDb(mockDashboardState.targetDb);
    }
    addNotification({
      id: Date.now().toString(),
      message: `${target === 'source' ? 'Source' : 'Target'} connection removed`,
      status: 'warning',
    });
  };

  const handleTelemetryError = (target: ConnectionTarget, err: unknown) => {
    const errorObj = err as { code?: number; status?: number; message?: string; detailed?: string; summary?: string } | undefined;
    const code = Number(errorObj?.code ?? errorObj?.status);
    const text = `${errorObj?.message || ''} ${errorObj?.detailed || ''} ${errorObj?.summary || ''}`.toLowerCase();
    const isConnectionLost = (code === 400 && text.includes('no active connection')) || text.includes('no active connection configured');

    if (isConnectionLost) {
      const state = useAppStore.getState();
      if (target === 'source' && state.sourceDb && state.sourceDb.status === 'active') {
        setSourceDb({ ...state.sourceDb, status: 'inactive' });
      } else if (target === 'target' && state.targetDb && state.targetDb.status === 'active') {
        setTargetDb({ ...state.targetDb, status: 'inactive' });
      }

      const notifId = `connection-lost-${target}`;
      const targetLabel = target === 'source' ? 'Source Database' : 'Target Database';

      addNotification({
        id: notifId,
        title: 'Connection lost',
        message: `${targetLabel}: no active connection configured.`,
        status: 'error',
        persistent: true,
        actions: [
          {
            label: 'Reconnect',
            variant: 'primary',
            onClick: () => void handleReconnect(target, notifId),
          },
          {
            label: 'Remove connection',
            variant: 'danger',
            onClick: () => void handleRemoveConnection(target, notifId),
          },
        ],
      });
    }
  };

  // Restore active connections from backend on initial mount
  useEffect(() => {
    let mounted = true;

    const restoreActiveConnections = async () => {
      try {
        const [sourceRes, targetRes] = await Promise.allSettled([
          getActiveConnection('source'),
          getActiveConnection('target'),
        ]);

        if (!mounted) return;

        if (sourceRes.status === 'fulfilled' && sourceRes.value) {
          setSourceDb(sourceRes.value);
        }

        if (targetRes.status === 'fulfilled' && targetRes.value) {
          setTargetDb(targetRes.value);
        }
      } catch (err) {
        console.error('Failed to restore active connections', err);
      }
    };

    void restoreActiveConnections();

    return () => {
      mounted = false;
    };
  }, [setSourceDb, setTargetDb]);

  // Telemetry polling for both source and target connections when active
  useEffect(() => {
    let mounted = true;

    const fetchAllTelemetry = async () => {
      const state = useAppStore.getState();

      if (state.sourceDb?.status === 'active') {
        try {
          const tel = await getTelemetry({ target: 'source' });
          if (mounted) {
            updateSourceTelemetry({
              cpuUsage: tel.cpuUsage,
              memoryUsage: tel.memoryUsage,
              diskUsage: Math.round(tel.diskUsage),
              activeConnections: tel.activeConnections,
            });
          }
        } catch (err) {
          console.error('Source telemetry failed', err);
          handleTelemetryError('source', err);
        }
      }

      if (state.targetDb?.status === 'active') {
        try {
          const tel = await getTelemetry({ target: 'target' });
          if (mounted) {
            updateTargetTelemetry({
              cpuUsage: tel.cpuUsage,
              memoryUsage: tel.memoryUsage,
              diskUsage: Math.round(tel.diskUsage),
              activeConnections: tel.activeConnections,
            });
          }
        } catch (err) {
          console.error('Target telemetry failed', err);
          handleTelemetryError('target', err);
        }
      }
    };

    void fetchAllTelemetry();
    const intv = setInterval(fetchAllTelemetry, config.telemetryInterval * 1000);
    return () => {
      mounted = false;
      clearInterval(intv);
    };
  }, [config.telemetryInterval, sourceDb?.status, targetDb?.status, updateSourceTelemetry, updateTargetTelemetry]);

  // Check active job once on mount (no continuous polling if idle)
  useEffect(() => {
    let mounted = true;
    const fetchInitialJob = async () => {
      try {
        const job = await getActiveJob();
        if (mounted && job) {
          useAppStore.getState().setRunningJob(job);
        }
      } catch (err) {
        console.error('Active job check failed', err);
      }
    };

    void fetchInitialJob();
    return () => {
      mounted = false;
    };
  }, []);

  // ONLY poll periodically if a job is currently running
  useEffect(() => {
    if (runningJob?.status !== 'running') {
      return;
    }

    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const job = await getActiveJob();
        if (mounted) {
          useAppStore.getState().setRunningJob(job);
        }
      } catch (err) {
        console.error('Active job poll failed', err);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [runningJob?.status]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* First Section: Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {([
          { info: sourceDb, title: 'Source Database', target: 'source' as const },
          { info: targetDb, title: 'Target Database', target: 'target' as const },
        ]).map((item) => {
          const isConfigured = Boolean(item.info && item.info.status === 'active');
          return (
            <div key={item.target} className="flex flex-col gap-3">
              <DatabaseStatusCard info={item.info} title={item.title} />
              <Button
                variant="secondary"
                isDisabled={!isConfigured}
                className={`w-full flex items-center justify-center gap-2 font-semibold shadow-xs ${
                  isConfigured ? 'text-primary' : ''
                }`}
                onPress={() => handleOpenSchema(item.target, item.info)}
              >
                <Layers size={16} />
                Show Schema
              </Button>
            </div>
          );
        })}
      </div>

      {/* Second Section: Running Job */}
      <RunningJobCard jobInfo={runningJob} />

      {/* Schema Diagram Modal */}
      {selectedSchemaTarget && selectedDbInfo && (
        <SchemaDiagramModal
          isOpen={!!selectedSchemaTarget}
          onClose={() => setSelectedSchemaTarget(null)}
          target={selectedSchemaTarget}
          dbName={
            (selectedSchemaTarget === 'source' ? sourceDb?.dbName : targetDb?.dbName) ||
            selectedDbInfo.dbName
          }
          environment={selectedDbInfo.environment}
          channelType={selectedDbInfo.channelType}
        />
      )}
    </div>
  );
};

export default Dashboard;
