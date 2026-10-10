import type { AppState } from '../../store/useAppStore';

export const mockDashboardState: Omit<AppState, 'setSourceDb' | 'setTargetDb' | 'toggleTheme' | 'addNotification' | 'updateNotification' | 'removeNotification' | 'updateSourceTelemetry' | 'updateConfig'> = {
  notifications: [],
  config: { telemetryInterval: 30 },
  sourceDb: {
    type: 'Source',
    status: 'pending',
    dbName: '-',
    channelType: '-',
    username: '-',
    environment: '-',
  },
  targetDb: {
    type: 'Target',
    status: 'pending',
    dbName: '-',
    channelType: '-',
    username: '-',
    environment: '-',
  },
  runningJob: null,
  theme: 'dark',
};
