import type { AppState } from '../../store/useAppStore';

export const mockDashboardState: Omit<AppState, 'setSourceDb' | 'setTargetDb' | 'toggleTheme'> = {
  sourceDb: {
    type: 'Source',
    status: 'active',
    dbName: 'production_db',
    channelType: 'Logical Replication',
    username: 'stewrd_admin',
    environment: 'PRD',
    telemetry: {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 75,
      activeConnections: 120,
    }
  },
  targetDb: {
    type: 'Target',
    status: 'connecting',
    dbName: 'data_warehouse',
    channelType: 'Standard',
    username: 'dw_writer',
    environment: 'STG',
    telemetry: {
      cpuUsage: 25,
      memoryUsage: 40,
      diskUsage: 30,
      activeConnections: 15,
    }
  },
  runningJob: {
    status: 'running',
    jobStats: {
      progress: 45,
      eta: '00:15:30',
      recordsToSync: 1000000,
      recordsSynced: 450000,
      throughput: 5000,
      replicationLag: 2,
      phase: 'Initial Load',
      errors: 0,
    },
    sourceConnection: {
      speed: '120 MB/s',
      latency: '15ms',
    },
    targetConnection: {
      speed: '150 MB/s',
      latency: '8ms',
    },
  },
  theme: 'dark',
};
