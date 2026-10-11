import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Separator, Chip, Spinner, Button } from '@heroui/react';
import { ArrowRight, Activity, Clock, Layers, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getTelemetry, getActiveConnection } from '../api/connectionsApi';
import { getActiveJob } from '../api/jobsApi';
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

const DatabaseStatusCard: React.FC<{ info: DatabaseInfo | null, title: string }> = ({ info, title }) => {
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

  return (
    <Card className="w-full relative">
      <CardHeader className="flex flex-row items-start justify-between w-full">
        <div className="flex flex-col items-start gap-1">
          <p className="text-md font-bold">{title}</p>
          <p className="text-small text-foreground/70">{info.dbName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
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
              <span className="text-sm font-medium">{info.channelType}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/70 uppercase font-semibold">Username</span>
              <span className="text-sm font-medium">{info.username}</span>
            </div>
          </div>

          {(info.status === 'active' || info.status === 'pending') && (
            <>
              <Separator />
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status === 'pending' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.cpuUsage}%</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">CPU</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status === 'pending' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.memoryUsage}%</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">Mem</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status === 'pending' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.diskUsage} MB</span> : <Spinner size="sm" className="mb-1" />)}
                  <span className="text-xs text-foreground/50">Disk</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-default-100 rounded-lg min-h-[60px]">
                  {info.status === 'pending' ? <span className="text-md font-bold">-</span> : (info.telemetry ? <span className="text-md font-bold">{info.telemetry.activeConnections}</span> : <Spinner size="sm" className="mb-1" />)}
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
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            <p className="text-md font-bold">Replication Job</p>
          </div>
          <Chip size="sm" variant="soft">No active runs</Chip>
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
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          <p className="text-md font-bold">{jobInfo.name || 'Replicate in local'}</p>
        </div>
        <div className="flex items-center gap-2">
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
  const {
    sourceDb,
    targetDb,
    runningJob,
    updateSourceTelemetry,
    setSourceDb,
    setTargetDb,
    config,
  } = useAppStore();
  const [selectedSchemaTarget, setSelectedSchemaTarget] = useState<ConnectionTarget | null>(null);
  const [selectedDbInfo, setSelectedDbInfo] = useState<DatabaseInfo | null>(null);

  const handleOpenSchema = (target: ConnectionTarget, info: DatabaseInfo | null) => {
    if (info?.status !== 'active') return;
    setSelectedSchemaTarget(target);
    setSelectedDbInfo(info);
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
          const { connection, ...rest } = sourceRes.value;
          setSourceDb(rest);
        }

        if (targetRes.status === 'fulfilled' && targetRes.value) {
          const { connection, ...rest } = targetRes.value;
          setTargetDb(rest);
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

  // Telemetry polling (only if source is active)
  useEffect(() => {
    let mounted = true;
    const fetchTel = async () => {
      const state = useAppStore.getState();
      if (!state.sourceDb || state.sourceDb.status !== 'active') return;
      try {
        const tel = await getTelemetry();
        if (mounted) {
          updateSourceTelemetry({
            cpuUsage: tel.cpuUsage,
            memoryUsage: tel.memoryUsage,
            diskUsage: Math.round(tel.diskUsage),
            activeConnections: tel.activeConnections,
          });
        }
      } catch (err) {
        console.error('Telemetry failed', err);
      }
    };

    void fetchTel();
    const intv = setInterval(fetchTel, config.telemetryInterval * 1000);
    return () => {
      mounted = false;
      clearInterval(intv);
    };
  }, [config.telemetryInterval, sourceDb?.status, updateSourceTelemetry]);

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
          const isConnectionActive = item.info?.status === 'active';
          return (
            <div key={item.target} className="flex flex-col gap-3">
              <DatabaseStatusCard info={item.info} title={item.title} />
              <Button
                variant="secondary"
                isDisabled={!isConnectionActive}
                className="w-full flex items-center justify-center gap-2 font-semibold shadow-xs"
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
          dbName={selectedDbInfo.dbName}
          environment={selectedDbInfo.environment}
          channelType={selectedDbInfo.channelType}
        />
      )}
    </div>
  );
};

export default Dashboard;
