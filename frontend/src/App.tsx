import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import Dashboard from './components/Dashboard';
import { useAppStore } from './store/useAppStore';
import type { ConnectionTarget } from './store/useAppStore';
import { getActiveConnection, getTelemetry, removeActiveConnection } from './api/connectionsApi';
import { mockDashboardState } from './constants/system/systemConstants';
import { LayoutDashboard, Unplug, Sun, Moon, Menu, ChevronLeft, Settings, PlayCircle, GitCompare } from 'lucide-react';

import SetupSourceDB from './components/setup-source/SetupSourceDB';
import SetupTargetDB from './components/setup-target/SetupTargetDB';
import JobsView from './components/jobs/JobsView';
import Configuration from './components/Configuration';
import NotificationCenter from './components/NotificationCenter';
import { DataComparisonView } from './components/data-comparison/DataComparisonView';

const CONNECTION_MONITOR_NOTIF_ID = 'connection-status-monitor';

const App: React.FC = () => {
  const location = useLocation();
  const {
    theme,
    toggleTheme,
    sourceDb,
    targetDb,
    setSourceDb,
    setTargetDb,
    updateSourceTelemetry,
    updateTargetTelemetry,
    addNotification,
    removeNotification,
    config,
  } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const handleReconnect = useCallback(async (target: ConnectionTarget, notifId: string) => {
    useAppStore.getState().removeNotification(notifId);
    try {
      const active = await getActiveConnection(target);
      if (active && active.connection) {
        if (target === 'source') {
          setSourceDb(active);
        } else {
          setTargetDb(active);
        }
        const tel = await getTelemetry({ target });
        if (target === 'source') {
          updateSourceTelemetry({
            cpuUsage: tel.cpuUsage,
            memoryUsage: tel.memoryUsage,
            diskUsage: Math.round(tel.diskUsage),
            activeConnections: tel.activeConnections,
          });
        } else {
          updateTargetTelemetry({
            cpuUsage: tel.cpuUsage,
            memoryUsage: tel.memoryUsage,
            diskUsage: Math.round(tel.diskUsage),
            activeConnections: tel.activeConnections,
          });
        }
        addNotification({
          id: Date.now().toString(),
          message: `Connection re-established for ${target === 'source' ? 'Source' : 'Target'} database`,
          status: 'success',
        });
        return;
      }
    } catch {
      // Reconnect probe failed
    }
    navigate(target === 'source' ? '/setup-source' : '/setup-target');
  }, [setSourceDb, setTargetDb, updateSourceTelemetry, updateTargetTelemetry, addNotification, navigate]);

  const handleRemoveConnection = useCallback(async (target: ConnectionTarget, notifId: string) => {
    useAppStore.getState().removeNotification(notifId);
    try {
      await removeActiveConnection(target);
    } catch (e) {
      console.error('Failed to remove active connection on backend', e);
    }
    if (target === 'source') {
      setSourceDb(mockDashboardState.sourceDb);
    } else {
      setTargetDb(mockDashboardState.targetDb);
    }
    addNotification({
      id: Date.now().toString(),
      message: `${target === 'source' ? 'Source' : 'Target'} connection removed`,
      status: 'warning',
    });
  }, [setSourceDb, setTargetDb, addNotification]);

  const handleTelemetryError = useCallback((target: ConnectionTarget, err: unknown) => {
    const errorObj = err as { code?: number; status?: number; message?: string; detailed?: string; summary?: string } | undefined;
    const code = Number(errorObj?.code ?? errorObj?.status);
    const text = `${errorObj?.message || ''} ${errorObj?.detailed || ''} ${errorObj?.summary || ''}`.toLowerCase();
    const isConnectionLost = (code === 400 && text.includes('no active connection')) || text.includes('no active connection configured');

    if (isConnectionLost) {
      const state = useAppStore.getState();
      if (target === 'source' && state.sourceDb && state.sourceDb.status === 'active') {
        setSourceDb({ ...state.sourceDb, status: 'inactive' });
      } else if (target === 'target' && state.targetDb && state.targetDb.status === 'active') {
        setTargetDb({ ...state.targetDb, status: 'inactive' });
      }

      const notifId = `connection-lost-${target}`;
      const targetLabel = target === 'source' ? 'Source Database' : 'Target Database';

      addNotification({
        id: notifId,
        title: 'Connection lost',
        message: `${targetLabel}: no active connection configured.`,
        status: 'error',
        persistent: true,
        actions: [
          {
            label: 'Reconnect',
            variant: 'primary',
            onClick: () => void handleReconnect(target, notifId),
          },
          {
            label: 'Remove connection',
            variant: 'danger',
            onClick: () => void handleRemoveConnection(target, notifId),
          },
        ],
      });
    }
  }, [setSourceDb, setTargetDb, addNotification, handleReconnect, handleRemoveConnection]);

  // Restore active connections globally on initial mount
  useEffect(() => {
    let mounted = true;
    const restoreActiveConnections = async () => {
      try {
        const [sourceRes, targetRes] = await Promise.allSettled([
          getActiveConnection('source'),
          getActiveConnection('target'),
        ]);
        if (!mounted) return;
        if (sourceRes.status === 'fulfilled' && sourceRes.value) {
          setSourceDb(sourceRes.value);
        }
        if (targetRes.status === 'fulfilled' && targetRes.value) {
          setTargetDb(targetRes.value);
        }
      } catch (err) {
        console.error('Failed to restore active connections', err);
      }
    };

    void restoreActiveConnections();
    return () => {
      mounted = false;
    };
  }, [setSourceDb, setTargetDb]);

  // Global telemetry & connection status polling across all screens
  useEffect(() => {
    let mounted = true;

    const fetchAllTelemetry = async () => {
      const state = useAppStore.getState();

      if (state.sourceDb?.status === 'active') {
        try {
          const tel = await getTelemetry({ target: 'source' });
          if (mounted) {
            updateSourceTelemetry({
              cpuUsage: tel.cpuUsage,
              memoryUsage: tel.memoryUsage,
              diskUsage: Math.round(tel.diskUsage),
              activeConnections: tel.activeConnections,
            });
          }
        } catch (err) {
          console.error('Source telemetry failed', err);
          handleTelemetryError('source', err);
        }
      }

      if (state.targetDb?.status === 'active') {
        try {
          const tel = await getTelemetry({ target: 'target' });
          if (mounted) {
            updateTargetTelemetry({
              cpuUsage: tel.cpuUsage,
              memoryUsage: tel.memoryUsage,
              diskUsage: Math.round(tel.diskUsage),
              activeConnections: tel.activeConnections,
            });
          }
        } catch (err) {
          console.error('Target telemetry failed', err);
          handleTelemetryError('target', err);
        }
      }
    };

    void fetchAllTelemetry();
    const intv = setInterval(fetchAllTelemetry, config.telemetryInterval * 1000);
    return () => {
      mounted = false;
      clearInterval(intv);
    };
  }, [config.telemetryInterval, sourceDb?.status, targetDb?.status, updateSourceTelemetry, updateTargetTelemetry, handleTelemetryError]);

  // Show permanent push notification with Source & Target status on action/config screens;
  // automatically remove it on Dashboard ('/'), Setup Source ('/setup-source'), and Setup Target ('/setup-target').
  useEffect(() => {
    const hideStatusNotification =
      location.pathname === '/' ||
      location.pathname === '/setup-source' ||
      location.pathname === '/setup-target';
    if (hideStatusNotification) {
      removeNotification(CONNECTION_MONITOR_NOTIF_ID);
      return;
    }

    const sourceActive = sourceDb?.status === 'active';
    const targetActive = targetDb?.status === 'active';
    const sourceSchema =
      sourceDb?.dbName && sourceDb.dbName !== '-' ? ` (${sourceDb.dbName})` : '';
    const targetSchema =
      targetDb?.dbName && targetDb.dbName !== '-' ? ` (${targetDb.dbName})` : '';

    const overallStatus =
      sourceActive && targetActive
        ? 'success'
        : sourceActive || targetActive
        ? 'warning'
        : 'error';

    addNotification({
      id: CONNECTION_MONITOR_NOTIF_ID,
      title: 'Database Connections Status',
      message: `Source: ${sourceActive ? `Connected${sourceSchema}` : 'Inactive'} • Target: ${targetActive ? `Connected${targetSchema}` : 'Inactive'}`,
      status: overallStatus,
      persistent: true,
      dismissible: false,
    });
  }, [
    location.pathname,
    sourceDb?.status,
    sourceDb?.dbName,
    targetDb?.status,
    targetDb?.dbName,
    addNotification,
    removeNotification,
  ]);

  const actionItems = [
    { label: 'Jobs', path: '/jobs', icon: <PlayCircle size={20} /> },
    { label: 'Data Comparison', path: '/data-comparison', icon: <GitCompare size={20} /> },
  ];

  const databaseItems = [
    { label: 'Set up source DB', path: '/setup-source', icon: <Unplug size={20} /> },
    { label: 'Set up target DB', path: '/setup-target', icon: <Unplug size={20} /> },
  ];

  const renderMenuItem = (item: { label: string; path: string; icon: React.ReactNode }) => {
    const isActive = location.pathname === item.path;
    return (
      <Button
        key={item.path}
        onPress={() => navigate(item.path)}
        variant={isActive ? 'secondary' : 'ghost'}
        className={`w-full text-medium ${isSidebarOpen ? 'justify-start' : 'justify-center px-0 min-w-10'}`}
        isIconOnly={!isSidebarOpen}
      >
        {item.icon}
        {isSidebarOpen && <span className="ml-2">{item.label}</span>}
      </Button>
    );
  };

  return (
    <div className="relative flex h-screen w-full bg-background overflow-hidden text-foreground">
      <NotificationCenter />
      {/* Top Right Logo (Visible only when sidebar is collapsed) */}
      {!isSidebarOpen && (
        <div className="absolute top-6 right-8 text-foreground/60 opacity-60 font-bold text-2xl tracking-widest pointer-events-none select-none z-50 animate-appearance-in">
          Stewrd
        </div>
      )}

      {/* Sidebar */}
      <aside className={`border-r border-separator bg-surface flex flex-col p-4 justify-between transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div>
          <div className={`mb-8 flex items-center ${isSidebarOpen ? 'justify-between px-2' : 'justify-center'}`}>
            {isSidebarOpen && <h1 className="text-2xl font-bold text-foreground/60 opacity-60 tracking-widest">Stewrd</h1>}
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </Button>
          </div>
          <nav className={`flex flex-col gap-3 ${!isSidebarOpen ? 'items-center' : ''}`}>
            {/* Dashboard (Standalone) */}
            {renderMenuItem({ label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> })}

            {/* Actions Subdivision */}
            <div
              className={`flex flex-col gap-1 rounded-xl bg-foreground/[0.03] dark:bg-foreground/[0.04] border border-separator/40 ${isSidebarOpen ? 'p-2' : 'p-1.5 items-center'
                }`}
            >
              {isSidebarOpen && (
                <span className="px-2 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 select-none">
                  Actions
                </span>
              )}
              {actionItems.map(renderMenuItem)}
            </div>

            {/* Databases Subdivision */}
            <div
              className={`flex flex-col gap-1 rounded-xl bg-foreground/[0.03] dark:bg-foreground/[0.04] border border-separator/40 ${isSidebarOpen ? 'p-2' : 'p-1.5 items-center'
                }`}
            >
              {isSidebarOpen && (
                <span className="px-2 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 select-none">
                  Databases
                </span>
              )}
              {databaseItems.map(renderMenuItem)}
            </div>

            {/* Configuration (Standalone) */}
            {renderMenuItem({ label: 'Configuration', path: '/configuration', icon: <Settings size={20} /> })}
          </nav>
        </div>

        <div className={`flex items-center  justify-center `}>
          <button
            onClick={toggleTheme}
            className={`relative shrink-0 flex items-center p-1 w-12 h-6 rounded-full transition-colors duration-300 focus:outline-hidden ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
              }`}
            aria-label="Toggle Dark Mode"
          >
            <span
              className={`absolute left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 flex items-center justify-center shadow-md ${theme === 'dark' ? 'transform translate-x-6' : 'transform translate-x-0'
                }`}
            >
              {theme === 'dark' ? <Moon size={10} className="text-black stroke-black" /> : <Sun size={10} className="text-black stroke-black" />}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobsView />} />
          <Route path="/data-comparison" element={<DataComparisonView />} />
          <Route path="/setup-source" element={<SetupSourceDB />} />
          <Route path="/setup-target" element={<SetupTargetDB />} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
