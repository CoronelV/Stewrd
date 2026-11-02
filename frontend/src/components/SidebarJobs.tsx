import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

interface SidebarJobsProps {
  isSidebarOpen: boolean;
}

const SidebarJobs: React.FC<SidebarJobsProps> = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const runningJob = useAppStore((s) => s.runningJob);

  const isRunning = runningJob?.status === 'running';
  const runningCount = isRunning ? 1 : 0;
  const tooltipText = isRunning
    ? `Jobs: ${runningCount} running${runningJob?.name ? ` (${runningJob.name})` : ''}`
    : 'Jobs: 0 running';

  if (!isSidebarOpen) {
    return (
      <div
        role="status"
        aria-live="polite"
        onClick={() => navigate('/jobs')}
        className="w-full rounded-xl bg-foreground/[0.03] dark:bg-foreground/[0.04] border border-separator/40 p-1.5 flex flex-col gap-1 items-center cursor-pointer hover:bg-foreground/5 transition-colors text-foreground select-none"
        title={tooltipText}
      >
        <div className="text-[9px] font-semibold uppercase tracking-wider text-foreground/50 border-b border-separator/40 pb-0.5 w-full text-center">
          Jobs
        </div>
        <div className="flex items-center gap-1.5 px-1 py-0.5 rounded w-full justify-start">
          <span className="relative flex h-2 w-2 shrink-0">
            {isRunning ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-success"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/25"></span>
            )}
          </span>
          <span className="text-[10px] font-medium text-foreground/80 leading-none tracking-tight whitespace-nowrap">
            {isRunning ? `${runningCount} running` : '0'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => navigate('/jobs')}
      className="w-full rounded-xl bg-foreground/[0.03] dark:bg-foreground/[0.04] border border-separator/40 p-2.5 flex flex-col gap-1.5 cursor-pointer hover:bg-foreground/5 transition-colors text-foreground select-none"
      title={tooltipText}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50 border-b border-separator/40 pb-1">
        Jobs
      </div>
      <div className="flex items-center gap-2 px-1.5 py-1 rounded-md text-xs">
        <span className="relative flex h-2 w-2 shrink-0">
          {isRunning ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-success"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/25"></span>
          )}
        </span>
        <span className="text-[11px] font-medium text-foreground/80">
          {runningCount} running
        </span>
      </div>
    </div>
  );
};

export default SidebarJobs;
