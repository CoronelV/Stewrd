import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import Dashboard from './components/Dashboard';
import { useAppStore } from './store/useAppStore';
import { LayoutDashboard, Unplug, Sun, Moon, Menu, ChevronLeft, Settings } from 'lucide-react';

import SetupSourceDB from './components/setup-source/SetupSourceDB';
import Configuration from './components/Configuration';
import NotificationCenter from './components/NotificationCenter';

const App: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Set up source DB', path: '/setup-source', icon: <Unplug size={20} /> },
    { label: 'Set up target DB', path: '/setup-target', icon: <Unplug size={20} /> },
    { label: 'Configuration', path: '/configuration', icon: <Settings size={20} /> },
  ];

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
          <nav className={`flex flex-col gap-2 ${!isSidebarOpen ? 'items-center' : ''}`}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  onPress={() => navigate(item.path)}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`text-medium ${isSidebarOpen ? 'justify-start' : 'justify-center px-0 min-w-10'}`}
                  isIconOnly={!isSidebarOpen}
                >
                  {item.icon}
                  {isSidebarOpen && <span className="ml-2">{item.label}</span>}
                </Button>
              );
            })}
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
          <Route path="/setup-source" element={<SetupSourceDB />} />
          <Route path="/setup-target" element={<div>Set up target DB - Placeholder</div>} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
