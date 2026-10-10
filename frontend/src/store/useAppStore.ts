import { create } from 'zustand';
import { mockDashboardState } from '../constants/system/systemConstants';

export type ConnectionStatus = 'active' | 'inactive' | 'connecting';
export type Environment = 'DEV' | 'STG' | 'UAT' | 'PRD';

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
  setSourceDb: (info: DatabaseInfo) => void;
  setTargetDb: (info: DatabaseInfo) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  ...mockDashboardState,
  setSourceDb: (info) => set({ sourceDb: info }),
  setTargetDb: (info) => set({ targetDb: info }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
