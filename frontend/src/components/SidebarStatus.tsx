import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { ConnectionStatus } from '../store/useAppStore';

interface SidebarStatusProps {
  isSidebarOpen: boolean;
}

interface StatusIndicator {
  color: string;
  ping: boolean;
  label: string;
}

const getStatusIndicator = (status?: ConnectionStatus): StatusIndicator => {
  if (status === 'active') {
    return {
      color: 'bg-success',
      ping: true,
      label: 'Connected',
    };
  }
  if (status === 'connecting' || status === 'pending') {
    return {
      color: 'bg-warning',
      ping: true,
      label: status === 'connecting' ? 'Connecting' : 'Pending',
    };
  }
  return {
    color: 'bg-danger',
    ping: false,
    label: 'Inactive',
  };
};

const SidebarStatus: React.FC<SidebarStatusProps> = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const sourceDb = useAppStore((s) => s.sourceDb);
  const targetDb = useAppStore((s) => s.targetDb);

  const targetIndicator = getStatusIndicator(targetDb?.status);
  const sourceIndicator = getStatusIndicator(sourceDb?.status);

  const targetTitle = `Target: ${targetIndicator.label}${targetDb?.dbName && targetDb.dbName !== '-' ? ` (${targetDb.dbName})` : ''}`;
  const sourceTitle = `Source: ${sourceIndicator.label}${sourceDb?.dbName && sourceDb.dbName !== '-' ? ` (${sourceDb.dbName})` : ''}`;

  if (!isSidebarOpen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full rounded-xl bg-foreground/[0.03] dark:bg-foreground/[0.04] border border-separator/40 p-1.5 flex flex-col gap-1 items-center transition-all text-foreground"
      >
        <div className="text-[9px] font-semibold uppercase tracking-wider text-foreground/50 border-b border-separator/40 pb-0.5 w-full text-center select-none">
          Status
        </div>
        <div className="flex flex-col gap-1 w-full">
          {/* Target status row */}
          <div
            onClick={() => navigate('/setup-target')}
            className="flex items-center gap-1.5 px-1 py-0.5 rounded cursor-pointer hover:bg-foreground/5 transition-colors"
            title={targetTitle}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {targetIndicator.ping && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${targetIndicator.color}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${targetIndicator.color}`}></span>
            </span>
            <span className="text-[10px] font-medium text-foreground/80 leading-none">Target</span>
          </div>

          {/* Source status row */}
          <div
            onClick={() => navigate('/setup-source')}
            className="flex items-center gap-1.5 px-1 py-0.5 rounded cursor-pointer hover:bg-foreground/5 transition-colors"
            title={sourceTitle}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {sourceIndicator.ping && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sourceIndicator.color}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${sourceIndicator.color}`}></span>
            </span>
            <span className="text-[10px] font-medium text-foreground/80 leading-none">Source</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-xl bg-foreground/[0.03] dark:bg-foreground/[0.04] border border-separator/40 p-2.5 flex flex-col gap-1.5 transition-all text-foreground"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50 border-b border-separator/40 pb-1 select-none">
        Status
      </div>
      <div className="flex flex-col gap-1">
        {/* Target status row */}
        <div
          onClick={() => navigate('/setup-target')}
          className="flex items-center gap-2 px-1.5 py-1 rounded-md text-xs cursor-pointer hover:bg-foreground/5 transition-colors"
          title={targetTitle}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {targetIndicator.ping && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${targetIndicator.color}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${targetIndicator.color}`}></span>
          </span>
          <span className="text-[11px] font-medium text-foreground/80">Target</span>
        </div>

        {/* Source status row */}
        <div
          onClick={() => navigate('/setup-source')}
          className="flex items-center gap-2 px-1.5 py-1 rounded-md text-xs cursor-pointer hover:bg-foreground/5 transition-colors"
          title={sourceTitle}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {sourceIndicator.ping && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sourceIndicator.color}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${sourceIndicator.color}`}></span>
          </span>
          <span className="text-[11px] font-medium text-foreground/80">Source</span>
        </div>
      </div>
    </div>
  );
};

export default SidebarStatus;
