import type { AppState } from '../../store/useAppStore';

export const mockDashboardState: Omit<AppState, 'setSourceDb' | 'setTargetDb' | 'setRunningJob' | 'updateRunningJob' | 'toggleTheme' | 'addNotification' | 'updateNotification' | 'removeNotification' | 'updateSourceTelemetry' | 'updateTargetTelemetry' | 'updateConfig'> = {
  notifications: [],
  config: { telemetryInterval: 30 },
  sourceDb: {
    target: 'source',
    status: 'inactive',
    dbName: '-',
    channelType: '-',
    engine: '-',
    username: '-',
    environment: '-',
  },
  targetDb: {
    target: 'target',
    status: 'inactive',
    dbName: '-',
    channelType: '-',
    engine: '-',
    username: '-',
    environment: '-',
  },
  runningJob: null,
  theme: 'dark',
};
