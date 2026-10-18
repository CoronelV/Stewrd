import type { AppState } from '../../store/useAppStore';

export const mockDashboardState: Pick<
  AppState,
  'notifications' | 'config' | 'sourceDb' | 'targetDb' | 'runningJob' | 'theme'
> = {
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
    availableSchemas: [],
  },
  targetDb: {
    target: 'target',
    status: 'inactive',
    dbName: '-',
    channelType: '-',
    engine: '-',
    username: '-',
    environment: '-',
    availableSchemas: [],
  },
  runningJob: null,
  theme: 'dark',
};
