import { create } from 'zustand';
import { mockDashboardState } from '../constants/system/systemConstants';

export type ConnectionStatus = 'active' | 'inactive' | 'connecting' | 'pending';
export type Environment = 'DEV' | 'STG' | 'UAT' | 'PRD' | '-';
export interface AppConfig {
  telemetryInterval: number;
}

export type NotificationStatus = 'loading' | 'success' | 'error' | 'warning';
export interface AppNotification {
  id: string;
  message: string;
  status: NotificationStatus;
}

interface DbTelemetry {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
}

export interface DatabaseInfo {
  type: 'Source' | 'Target';
  status: ConnectionStatus;
  dbName: string;
  channelType: string;
  username: string;
  environment: Environment;
  telemetry?: DbTelemetry;
}

export interface ConnectionStats {
  speed: string;
  latency: string;
}

interface JobStats {
  progress: number;
  eta: string;
  recordsToSync: number;
  recordsSynced: number;
  throughput: number;
  replicationLag: number;
  phase: 'Initial Load' | 'CDC' | 'Validation';
  errors: number;
}

export interface RunningJobInfo {
  status: 'running' | 'paused' | 'stopped' | 'idle';
  jobStats: JobStats;
  sourceConnection: ConnectionStats;
  targetConnection: ConnectionStats;
}

export interface AppState {
  sourceDb: DatabaseInfo | null;
  targetDb: DatabaseInfo | null;
  runningJob: RunningJobInfo | null;
  theme: 'light' | 'dark';
  notifications: AppNotification[];
  config: AppConfig;
  setSourceDb: (info: DatabaseInfo) => void;
  setTargetDb: (info: DatabaseInfo) => void;
  toggleTheme: () => void;
  addNotification: (notif: AppNotification) => void;
  updateNotification: (id: string, updates: Partial<AppNotification>) => void;
  removeNotification: (id: string) => void;
  updateSourceTelemetry: (tel: DbTelemetry) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ...mockDashboardState,
  notifications: [],
  config: { telemetryInterval: 30 },
  updateConfig: (updates: Partial<AppConfig>) => set((s) => ({ config: { ...s.config, ...updates } })),
  setSourceDb: (info) => set({ sourceDb: info }),
  setTargetDb: (info) => set({ targetDb: info }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  addNotification: (n) => {
    set((s) => ({ notifications: [n, ...s.notifications] }));
    if (n.status !== 'loading') {
      setTimeout(() => {
        useAppStore.getState().removeNotification(n.id);
      }, 5000);
    }
  },
  updateNotification: (id, updates) => {
    set((s) => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, ...updates } : n)
    }));
    if (updates.status === 'success' || updates.status === 'error' || updates.status === 'warning') {
      setTimeout(() => {
        useAppStore.getState().removeNotification(id);
      }, 5000);
    }
  },
  updateSourceTelemetry: (tel: DbTelemetry) => set(s => s.sourceDb ? { sourceDb: { ...s.sourceDb, telemetry: tel } } : s),
  removeNotification: (id) => set((s) => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),
}));
