import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const NotificationCenter: React.FC = () => {
  const notifications = useAppStore(s => s.notifications);
  const [expanded, setExpanded] = useState(false);

  if (notifications.length === 0) {
    return null;
  }

  const visible = expanded ? notifications : notifications.slice(0, 2);
  const hasMore = notifications.length > 2;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[300px] items-center">
      {visible.map(n => (
        <div key={n.id} className="bg-surface border border-separator shadow-xl rounded-xl p-4 flex items-center justify-center gap-3 pointer-events-auto transition-all animate-appearance-in w-full">
          {(() => {
            const color = n.status === 'success' ? 'bg-success' : n.status === 'error' ? 'bg-danger' : 'bg-warning';
            return (
              <span className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
              </span>
            );
          })()}
          <span className="font-medium text-sm text-foreground text-center">{n.message}</span>
        </div>
      ))}
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
