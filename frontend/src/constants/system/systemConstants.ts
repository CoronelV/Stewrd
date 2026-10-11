import type { AppState } from '../../store/useAppStore';

export const mockDashboardState: Omit<AppState, 'setSourceDb' | 'setTargetDb' | 'setRunningJob' | 'updateRunningJob' | 'toggleTheme' | 'addNotification' | 'updateNotification' | 'removeNotification' | 'updateSourceTelemetry' | 'updateConfig'> = {
  notifications: [],
  config: { telemetryInterval: 30 },
  sourceDb: {
    target: 'source',
    status: 'pending',
    dbName: '-',
    channelType: '-',
    username: '-',
    environment: '-',
  },
  targetDb: {
    target: 'target',
    status: 'pending',
    dbName: '-',
    channelType: '-',
    username: '-',
    environment: '-',
  },
  runningJob: null,
  theme: 'dark',
};
