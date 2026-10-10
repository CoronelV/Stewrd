import React from 'react';
import { Button } from '@heroui/react';

export type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface StatusButtonProps {
  status: ActionStatus;
  idleText: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onPress: () => void;
  variant?: any;
  isDisabled?: boolean;
  className?: string;
}

export const StatusButton: React.FC<StatusButtonProps> = ({
  status,
  idleText,
  loadingText,
  successText,
  errorText,
  onPress,
  variant = 'solid',
  isDisabled = false,
  className = ''
}) => {
  let bgClass = '';
  let text = idleText;
  if (status === 'loading') {
    bgClass = 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent';
    text = loadingText || idleText;
  } else if (status === 'success') {
    bgClass = 'bg-green-600 hover:bg-green-700 text-white border-transparent';
    text = successText || idleText;
  } else if (status === 'error') {
    bgClass = 'bg-red-600 hover:bg-red-700 text-white border-transparent';
    text = errorText || 'Retry';
  }

  return (
    <Button
      onPress={onPress}
      isDisabled={isDisabled || status === 'loading'}
      variant={status === 'idle' ? variant : 'solid'}
      className={`${bgClass} font-medium transition-colors ${className}`}
    >
      {status === 'loading' && (
        <span className="relative flex h-3 w-3 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
        </span>
      )}
      {text}
    </Button>
  );
};
