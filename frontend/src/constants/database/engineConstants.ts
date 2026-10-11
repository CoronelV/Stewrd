export type DatabaseEngineType = 'mysql' | 'percona';

export interface DatabaseEngineOption {
  id: DatabaseEngineType;
  name: string;
  defaultPort: string;
  defaultUser: string;
  description: string;
  accentColor: string;
}

export const DATABASE_ENGINES: DatabaseEngineOption[] = [
  {
    id: 'mysql',
    name: 'MySQL',
    defaultPort: '3306',
    defaultUser: 'root',
    description: 'Standard MySQL Relational Database Server',
    accentColor: '#00758F',
  },
  {
    id: 'percona',
    name: 'Percona Server for MySQL',
    defaultPort: '3306',
    defaultUser: 'root',
    description: '100% drop-in compatible MySQL open-source branch',
    accentColor: '#E65100',
  },
];

export const getEngineOption = (id?: string | null): DatabaseEngineOption => {
  const norm = (id || '').toLowerCase().trim();
  if (!norm || norm === '-') {
    return {
      id: 'mysql',
      name: '-',
      defaultPort: '',
      defaultUser: '',
      description: 'Not configured',
      accentColor: '#888888',
    };
  }
  const found = DATABASE_ENGINES.find((e) => e.id === norm || e.name.toLowerCase() === norm);
  if (found) return found;

  return {
    id: 'mysql',
    name: id ? id.toUpperCase() : '-',
    defaultPort: '3306',
    defaultUser: 'root',
    description: 'Database engine',
    accentColor: '#00758F',
  };
};
