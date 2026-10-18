import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const getActionClass = (variant?: string) => {
  switch (variant) {
    case 'danger':
      return 'bg-danger hover:bg-danger/90 text-white shadow-xs';
    case 'primary':
      return 'bg-primary hover:bg-primary/90 text-white shadow-xs';
    case 'warning':
      return 'bg-warning hover:bg-warning/90 text-white shadow-xs';
    case 'secondary':
      return 'bg-default-100 hover:bg-default-200 text-foreground border border-separator';
    default:
      return 'bg-default-200 hover:bg-default-300 text-foreground';
  }
};

const NotificationCenter: React.FC = () => {
  const notifications = useAppStore((s) => s.notifications);
  const sourceDb = useAppStore((s) => s.sourceDb);
  const targetDb = useAppStore((s) => s.targetDb);
  const removeNotification = useAppStore((s) => s.removeNotification);
  const [expanded, setExpanded] = useState(false);

  if (notifications.length === 0) {
    return null;
  }

  // Keep permanent connection status notification at the bottom of the stack while allowing transient notifications above it
  const orderedNotifications = [
    ...notifications.filter((n) => n.id !== 'connection-status-monitor'),
    ...notifications.filter((n) => n.id === 'connection-status-monitor'),
  ];

  const maxCollapsed = notifications.some((n) => n.id === 'connection-status-monitor') ? 3 : 2;
  const visible = expanded ? orderedNotifications : orderedNotifications.slice(0, maxCollapsed);
  const hasMore = orderedNotifications.length > maxCollapsed;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[360px] sm:w-[440px] max-w-[calc(100vw-32px)] items-center">
      {visible.map((n) => {
        const isStatusMonitor = n.id === 'connection-status-monitor';
        const color = n.status === 'success' ? 'bg-success' : n.status === 'error' ? 'bg-danger' : 'bg-warning';
        const isDismissible = n.dismissible !== false;

        if (isStatusMonitor) {
          const sourceActive = sourceDb?.status === 'active';
          const targetActive = targetDb?.status === 'active';
          const sourceSchema =
            sourceDb?.dbName && sourceDb.dbName !== '-' ? sourceDb.dbName : null;
          const targetSchema =
            targetDb?.dbName && targetDb.dbName !== '-' ? targetDb.dbName : null;

          return (
            <div
              key={n.id}
              role="status"
              aria-live="polite"
              className="bg-surface/95 backdrop-blur-md border border-separator shadow-2xl rounded-xl px-4 py-3 flex flex-col gap-2.5 pointer-events-auto transition-all animate-appearance-in w-full text-foreground"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                  {n.title || 'Live Connection Status'}
                </span>
                <span className="text-[10px] text-foreground/45 font-medium">
                  Active Monitor
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Source Status Pill */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                    sourceActive
                      ? 'bg-success/10 border-success/30 text-foreground'
                      : 'bg-default-100 border-separator text-foreground/70'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {sourceActive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-success"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        sourceActive ? 'bg-success' : 'bg-warning'
                      }`}
                    ></span>
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px]">Source:</span>
                      <span className="font-semibold text-[11px] capitalize">
                        {sourceActive ? 'Connected' : 'Inactive'}
                      </span>
                    </div>
                    {sourceActive && (
                      <span className="text-[10px] text-foreground/65 font-mono truncate">
                        {sourceSchema ? `Schema: ${sourceSchema}` : 'No default schema'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Status Pill */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                    targetActive
                      ? 'bg-success/10 border-success/30 text-foreground'
                      : 'bg-default-100 border-separator text-foreground/70'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {targetActive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-success"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        targetActive ? 'bg-success' : 'bg-warning'
                      }`}
                    ></span>
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px]">Target:</span>
                      <span className="font-semibold text-[11px] capitalize">
                        {targetActive ? 'Connected' : 'Inactive'}
                      </span>
                    </div>
                    {targetActive && (
                      <span className="text-[10px] text-foreground/65 font-mono truncate">
                        {targetSchema ? `Schema: ${targetSchema}` : 'No default schema'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={n.id}
            className="bg-surface border border-separator shadow-2xl rounded-xl p-4 flex flex-col gap-3 pointer-events-auto transition-all animate-appearance-in w-full text-foreground"
          >
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="flex items-start gap-3 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0 mt-1">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
                </span>
                <div className="flex flex-col min-w-0">
                  {n.title && <span className="font-semibold text-sm text-foreground truncate">{n.title}</span>}
                  <span className={`font-medium text-foreground/80 ${n.title ? 'text-xs' : 'text-sm'}`}>
                    {n.message}
                  </span>
                </div>
              </div>
              {isDismissible && (
                <button
                  onClick={() => removeNotification(n.id)}
                  className="text-foreground/40 hover:text-foreground/80 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {n.actions && n.actions.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator/40">
                {n.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      removeNotification(n.id);
                      action.onClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${getActionClass(action.variant)}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {!expanded && hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="pointer-events-auto mt-1 p-1 bg-surface border border-separator text-foreground/70 rounded-full hover:bg-default-100 transition-colors shadow-md animate-appearance-in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          className="pointer-events-auto mt-1 p-1 bg-surface border border-separator text-foreground/70 rounded-full hover:bg-default-100 transition-colors shadow-md animate-appearance-in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default NotificationCenter;

