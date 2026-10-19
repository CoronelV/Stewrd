import { create } from 'zustand';
import { mockDashboardState } from '../constants/system/systemConstants';
import type { SshMysqlConnectionInput } from '../api/requests.interface';

export type ConnectionStatus = 'active' | 'inactive' | 'connecting' | 'pending';
export const ENVIRONMENTS = ['DEV', 'STG', 'UAT', 'PRD', '-'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];
export type ConnectionTarget = 'source' | 'target';

export interface AppConfig {
  telemetryInterval: number;
}

export type NotificationStatus = 'loading' | 'success' | 'error' | 'warning';
export interface NotificationAction {
  label: string;
  variant?: 'primary' | 'danger' | 'warning' | 'secondary' | 'default';
  onClick: () => void;
}

export interface AppNotification {
  id: string;
  title?: string;
  message: string;
  status: NotificationStatus;
  persistent?: boolean;
  dismissible?: boolean;
  actions?: NotificationAction[];
}

interface DbTelemetry {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
}

export interface DatabaseInfo {
  target: ConnectionTarget;
  status: ConnectionStatus;
  dbName: string;
  channelType: string;
  engine: string;
  username: string;
  environment: Environment;
  serverVersion?: string;
  availableSchemas?: string[];
  connection?: SshMysqlConnectionInput;
  telemetry?: DbTelemetry;
}

export interface ConnectionStats {
  speed: string;
  latency: string;
}

export interface JobStats {
  progress: number;
  eta: string;
  recordsToSync: number;
  recordsSynced: number;
  throughput: number;
  replicationLag: number;
  phase: string;
  errors: number;
}

export interface RunningJobInfo {
  jobId?: string;
  name?: string;
  status: 'running' | 'paused' | 'stopped' | 'idle' | 'completed' | 'failed' | 'cancelled';
  jobStats: JobStats;
  sourceConnection: ConnectionStats;
  targetConnection: ConnectionStats;
  errorMessage?: string;
}

export interface AppState {
  sourceDb: DatabaseInfo | null;
  targetDb: DatabaseInfo | null;
  runningJob: RunningJobInfo | null;
  theme: 'light' | 'dark';
  notifications: AppNotification[];
  config: AppConfig;
  setSourceDb: (info: DatabaseInfo | null) => void;
  setTargetDb: (info: DatabaseInfo | null) => void;
  setAvailableSchemas: (target: ConnectionTarget, schemas: string[]) => void;
  setPreferredSchema: (target: ConnectionTarget, schema: string) => void;
  setRunningJob: (job: RunningJobInfo | null) => void;
  updateRunningJob: (updates: Partial<RunningJobInfo>) => void;
  toggleTheme: () => void;
  addNotification: (notif: AppNotification) => void;
  updateNotification: (id: string, updates: Partial<AppNotification>) => void;
  removeNotification: (id: string) => void;
  updateSourceTelemetry: (tel: DbTelemetry) => void;
  updateTargetTelemetry: (tel: DbTelemetry) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  restoreSessionFromEnv: () => { source: DatabaseInfo | null; target: DatabaseInfo | null };
}

export function buildDatabaseInfoFromEnv(target: ConnectionTarget): DatabaseInfo | null {
  const env = import.meta.env;
  const prefix = target === 'source' ? 'VITE_SOURCE_' : 'VITE_TARGET_';

  const channelType = env[`${prefix}CHANNEL_TYPE`];
  const engine = env[`${prefix}ENGINE`];
  const environment = ENVIRONMENTS.find((e) => e === env[`${prefix}ENVIRONMENT`]);

  const dbHost = env[`${prefix}DB_HOST`];
  const dbPort = Number(env[`${prefix}DB_PORT`]);
  const dbUser = env[`${prefix}DB_USER`];
  const dbPassword = env[`${prefix}DB_PASSWORD`] ?? '';
  const dbSchema = env[`${prefix}DB_SCHEMA`];

  if (!channelType || !engine || !environment || !dbHost || !dbPort || !dbUser) {
    return null;
  }

  const isDirect = channelType === 'Direct (Local)';
  const sshHost = env[`${prefix}SSH_HOST`];
  const sshPort = Number(env[`${prefix}SSH_PORT`]);
  const sshUser = env[`${prefix}SSH_USER`];

  if (!isDirect && (!sshHost || !sshPort || !sshUser)) {
    return null;
  }

  const connection: SshMysqlConnectionInput = {
    target,
    environment,
    channelType,
    engine,
    ssh: isDirect
      ? { host: '', port: 22, user: '' }
      : {
          host: sshHost,
          port: sshPort,
          user: sshUser,
          password: env[`${prefix}SSH_PASSWORD`],
          privateKeyPath: env[`${prefix}SSH_PRIVATE_KEY_PATH`],
          insecureIgnoreHostKey: env[`${prefix}SSH_INSECURE_IGNORE_HOST_KEY`] === 'true',
        },
    mysql: {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      schema: dbSchema,
    },
  };

  return {
    target,
    status: 'inactive',
    dbName: dbSchema || '-',
    channelType,
    engine,
    username: dbUser,
    environment,
    availableSchemas: [],
    connection,
  };
}

function mergeDatabaseInfo(prev: DatabaseInfo | null, next: DatabaseInfo | null): DatabaseInfo | null {
  if (!next) return null;
  const mergedSchemas =
    next.availableSchemas && next.availableSchemas.length > 0
      ? next.availableSchemas
      : prev?.availableSchemas ?? next.availableSchemas ?? [];
  const mergedConnection = next.connection
    ? {
        ...prev?.connection,
        ...next.connection,
        ssh: {
          ...prev?.connection?.ssh,
          ...next.connection.ssh,
          password: next.connection.ssh?.password || prev?.connection?.ssh?.password,
        },
        mysql: {
          ...prev?.connection?.mysql,
          ...next.connection.mysql,
          password: next.connection.mysql?.password || prev?.connection?.mysql?.password || '',
          schema:
            next.dbName && next.dbName !== '-'
              ? next.dbName
              : next.connection.mysql?.schema || undefined,
        },
        ...(next.connection.aws || prev?.connection?.aws
          ? {
              aws: {
                ...prev?.connection?.aws,
                ...next.connection.aws,
              },
            }
          : {}),
      }
    : prev?.connection;

  return {
    ...(next.status === 'active' && prev?.status === 'active'
      ? {
          telemetry: prev.telemetry,
          serverVersion: prev.serverVersion,
        }
      : {}),
    ...next,
    availableSchemas: mergedSchemas,
    ...(mergedConnection ? { connection: mergedConnection } : {}),
  };
}

export const useAppStore = create<AppState>((set) => ({
  ...mockDashboardState,
  notifications: [],
  config: { telemetryInterval: 30 },
  updateConfig: (updates: Partial<AppConfig>) => set((s) => ({ config: { ...s.config, ...updates } })),
  restoreSessionFromEnv: () => {
    const source = buildDatabaseInfoFromEnv('source');
    const target = buildDatabaseInfoFromEnv('target');
    set({
      sourceDb: source,
      targetDb: target,
    });
    return { source, target };
  },
  setSourceDb: (info) =>
    set((s) => ({
      sourceDb: mergeDatabaseInfo(s.sourceDb, info),
    })),
  setTargetDb: (info) =>
    set((s) => ({
      targetDb: mergeDatabaseInfo(s.targetDb, info),
    })),
  setAvailableSchemas: (target, schemas) =>
    set((s) => {
      if (target === 'source') {
        const base = s.sourceDb ?? mockDashboardState.sourceDb!;
        return {
          sourceDb: {
            ...base,
            availableSchemas: schemas,
            ...(base.connection ? { connection: { ...base.connection, availableSchemas: schemas } } : {}),
          },
        };
      }
      const base = s.targetDb ?? mockDashboardState.targetDb!;
      return {
        targetDb: {
          ...base,
          availableSchemas: schemas,
          ...(base.connection ? { connection: { ...base.connection, availableSchemas: schemas } } : {}),
        },
      };
    }),
  setPreferredSchema: (target, schema) =>
    set((s) => {
      const normalizedDbName = schema.trim() || '-';
      if (target === 'source' && s.sourceDb) {
        return {
          sourceDb: {
            ...s.sourceDb,
            dbName: normalizedDbName,
            ...(s.sourceDb.connection
              ? {
                  connection: {
                    ...s.sourceDb.connection,
                    mysql: {
                      ...s.sourceDb.connection.mysql,
                      schema: schema.trim() || undefined,
                    },
                  },
                }
              : {}),
          },
        };
      }
      if (target === 'target' && s.targetDb) {
        return {
          targetDb: {
            ...s.targetDb,
            dbName: normalizedDbName,
            ...(s.targetDb.connection
              ? {
                  connection: {
                    ...s.targetDb.connection,
                    mysql: {
                      ...s.targetDb.connection.mysql,
                      schema: schema.trim() || undefined,
                    },
                  },
                }
              : {}),
          },
        };
      }
      return s;
    }),
  setRunningJob: (job) => set({ runningJob: job }),
  updateRunningJob: (updates) => set((s) => ({
    runningJob: s.runningJob ? { ...s.runningJob, ...updates } : null,
  })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  addNotification: (n) => {
    set((s) => ({
      notifications: [n, ...s.notifications.filter(item => item.id !== n.id)]
    }));
    if (n.status !== 'loading' && !n.persistent && (!n.actions || n.actions.length === 0)) {
      setTimeout(() => {
        useAppStore.getState().removeNotification(n.id);
      }, 5000);
    }
  },
  updateNotification: (id, updates) => {
    set((s) => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, ...updates } : n)
    }));
    const updated = useAppStore.getState().notifications.find(n => n.id === id);
    if (
      (updates.status === 'success' || updates.status === 'error' || updates.status === 'warning') &&
      !updated?.persistent &&
      (!updated?.actions || updated.actions.length === 0)
    ) {
      setTimeout(() => {
        useAppStore.getState().removeNotification(id);
      }, 5000);
    }
  },
  updateSourceTelemetry: (tel: DbTelemetry) => set(s => s.sourceDb ? { sourceDb: { ...s.sourceDb, telemetry: tel } } : s),
  updateTargetTelemetry: (tel: DbTelemetry) => set(s => s.targetDb ? { targetDb: { ...s.targetDb, telemetry: tel } } : s),
  removeNotification: (id) => set((s) => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),
}));
