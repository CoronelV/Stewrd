import type { Environment } from '../../store/useAppStore';

export const dashboardTheme = {
  environmentClasses: {
    DEV: 'bg-green-500/20 text-green-700 dark:text-green-400',
    STG: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    UAT: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
    PRD: 'bg-red-500/20 text-red-700 dark:text-red-400',
  } as Record<Environment, string>,
  defaultEnvironmentClass: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
  connectionStatusClasses: {
    active: 'bg-green-600',
    inactive: 'bg-red-600',
    connecting: 'bg-yellow-600',
  },
} as const;
