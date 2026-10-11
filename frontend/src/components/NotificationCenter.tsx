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
  const removeNotification = useAppStore((s) => s.removeNotification);
  const [expanded, setExpanded] = useState(false);

  if (notifications.length === 0) {
    return null;
  }

  const visible = expanded ? notifications : notifications.slice(0, 2);
  const hasMore = notifications.length > 2;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] items-center">
      {visible.map((n) => {
        const color = n.status === 'success' ? 'bg-success' : n.status === 'error' ? 'bg-danger' : 'bg-warning';
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
              <button
                onClick={() => removeNotification(n.id)}
                className="text-foreground/40 hover:text-foreground/80 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
