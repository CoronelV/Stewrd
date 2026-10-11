import React from 'react';
import { Chip } from '@heroui/react';
import type { Environment } from '../../store/useAppStore';
import { dashboardTheme } from '../../constants/ui/themeConstants';

export interface EnvironmentBadgeProps {
  environment?: Environment | string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  className?: string | undefined;
  fallback?: string | undefined;
}

export const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({
  environment,
  size = 'md',
  className = '',
  fallback = '-',
}) => {
  const envKey = (environment && environment !== '-' ? environment : fallback).trim().toUpperCase();
  const envClass =
    (dashboardTheme.environmentClasses as Record<string, string>)[envKey] ||
    dashboardTheme.defaultEnvironmentClass;

  const paddingClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 text-xs';

  return (
    <Chip
      size={size === 'lg' ? 'md' : size}
      className={`font-bold uppercase border-none ${paddingClass} ${envClass} ${className}`.trim()}
    >
      {envKey}
    </Chip>
  );
};

export default EnvironmentBadge;
