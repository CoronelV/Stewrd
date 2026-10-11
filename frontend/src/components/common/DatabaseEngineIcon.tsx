import React from 'react';
import { Database } from 'lucide-react';

export interface DatabaseEngineIconProps {
  engine: string;
  size?: number | string | undefined;
  className?: string | undefined;
}

export const DatabaseEngineIcon: React.FC<DatabaseEngineIconProps> = ({
  engine,
  size = 28,
  className = '',
}) => {
  const norm = (engine || '').toLowerCase().trim();
  const numSize = typeof size === 'number' ? size : 28;

  if (!norm || norm === '-') {
    return <Database size={numSize} className={`text-foreground/30 shrink-0 ${className}`.trim()} />;
  }

  switch (norm) {
    case 'mysql':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="MySQL"
        >
          {/* MySQL dolphin inspired icon */}
          <circle cx="24" cy="24" r="22" fill="#E6F4F8" className="dark:fill-[#003B4C]" />
          <path
            d="M34 23C32.5 19 28.5 14 21 14C17.5 14 13.5 16 11 20C9.5 22.5 9 25 10 27C11.5 30 15 32 20 32C24 32 28 30.5 31 28L36 31C35.5 28 36.5 25.5 37 24C36.2 24 35 23.5 34 23Z"
            fill="#00758F"
          />
          <path
            d="M20 18C18 19 16.5 21 16 23C15.5 25 16 26.5 17 27C18.5 27.5 20.5 27 22.5 25C24.5 23 25.5 21 25 19.5C24.5 18 22.5 17.5 20 18Z"
            fill="#F29111"
          />
          <circle cx="16" cy="21" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'percona':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="Percona Server for MySQL"
        >
          {/* Percona orange/navy circular badge with MySQL dolphin compatibility */}
          <circle cx="24" cy="24" r="22" fill="#FFF3E0" className="dark:fill-[#3E2723]" />
          <path
            d="M34 23C32.5 19 28.5 14 21 14C17.5 14 13.5 16 11 20C9.5 22.5 9 25 10 27C11.5 30 15 32 20 32C24 32 28 30.5 31 28L36 31C35.5 28 36.5 25.5 37 24C36.2 24 35 23.5 34 23Z"
            fill="#E65100"
          />
          <path
            d="M20 18C18 19 16.5 21 16 23C15.5 25 16 26.5 17 27C18.5 27.5 20.5 27 22.5 25C24.5 23 25.5 21 25 19.5C24.5 18 22.5 17.5 20 18Z"
            fill="#FFA726"
          />
          <circle cx="16" cy="21" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'postgres':
    case 'postgresql':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="PostgreSQL"
        >
          {/* PostgreSQL elephant Slonik inspired icon */}
          <circle cx="24" cy="24" r="22" fill="#EBF2F7" className="dark:fill-[#1A344D]" />
          <path
            d="M24 10C17 10 12 14.5 12 21.5C12 25 13.5 28.5 16 31V38H20V33C21.2 33.7 22.6 34 24 34C25.4 34 26.8 33.7 28 33V38H32V31C34.5 28.5 36 25 36 21.5C36 14.5 31 10 24 10Z"
            fill="#336791"
          />
          <path
            d="M24 18C21.8 18 20 19.8 20 22C20 23.5 20.8 24.8 22 25.5V30H26V25.5C27.2 24.8 28 23.5 28 22C28 19.8 26.2 18 24 18Z"
            fill="#FFFFFF"
          />
          <circle cx="18" cy="19" r="1.5" fill="#FFFFFF" />
          <circle cx="30" cy="19" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'mariadb':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="MariaDB"
        >
          {/* MariaDB sea lion inspired icon */}
          <circle cx="24" cy="24" r="22" fill="#E6EEF0" className="dark:fill-[#002B36]" />
          <path
            d="M13 32C15 28 17 24 19 22C21 20 23 17 23 14C23 12 24.5 11 26 12C27.5 13 28 15 27 18C28.5 18 30 19 32 21C34.5 23.5 36 27 36 32C33 30 29 29 25 29C21 29 17 30 13 32Z"
            fill="#003545"
          />
          <path
            d="M24 14C25 15 25.5 16.5 25 18C24.5 19.5 23 20 22 19C21 18 21.5 16 22.5 14.5C23 13.8 23.5 13.5 24 14Z"
            fill="#C59B27"
          />
          <circle cx="25.5" cy="15" r="1" fill="#FFFFFF" />
        </svg>
      );

    case 'sqlite':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="SQLite"
        >
          {/* SQLite feather/scroll inspired icon */}
          <circle cx="24" cy="24" r="22" fill="#E6F5FA" className="dark:fill-[#002A3D]" />
          <path
            d="M32 12C28 12 20 16 16 23C13 28 12 34 14 36C15 37 17 37 19 35C22 32 25 28 28 23C31 18 33 14 32 12Z"
            fill="#003B57"
          />
          <path
            d="M28 17C25 21 21 26 18 30C16 33 14 35 13 36C12.5 36.5 12 36.2 12 35.5C12 32 14 26 18 20C22 14 27 12 30 13C31 13.5 30 15 28 17Z"
            fill="#00ADEF"
          />
        </svg>
      );

    case 'sqlserver':
    case 'mssql':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="SQL Server"
        >
          {/* Microsoft SQL Server stacked cylinders */}
          <circle cx="24" cy="24" r="22" fill="#FAEAEB" className="dark:fill-[#3D1415]" />
          <path
            d="M14 16C14 13.8 18.5 12 24 12C29.5 12 34 13.8 34 16V22C34 24.2 29.5 26 24 26C18.5 26 14 24.2 14 22V16Z"
            fill="#CC292B"
          />
          <ellipse cx="24" cy="16" rx="10" ry="3.5" fill="#E84A4C" />
          <path
            d="M14 24C14 26.2 18.5 28 24 28C29.5 28 34 26.2 34 24V29C34 31.2 29.5 33 24 33C18.5 33 14 31.2 14 29V24Z"
            fill="#A61C1E"
          />
          <path
            d="M14 31C14 33.2 18.5 35 24 35C29.5 35 34 33.2 34 31V36C34 38.2 29.5 40 24 40C18.5 40 14 38.2 14 36V31Z"
            fill="#801012"
          />
        </svg>
      );

    case 'oracle':
      return (
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`.trim()}
          aria-label="Oracle DB"
        >
          {/* Oracle red database */}
          <circle cx="24" cy="24" r="22" fill="#FDEAEA" className="dark:fill-[#400B0B]" />
          <rect x="12" y="15" width="24" height="18" rx="9" fill="#F80000" />
          <rect x="15" y="18" width="18" height="12" rx="6" fill="#FFFFFF" />
          <rect x="18" y="21" width="12" height="6" rx="3" fill="#F80000" />
        </svg>
      );

    default:
      return <Database size={numSize} className={`text-primary shrink-0 ${className}`.trim()} />;
  }
};

export default DatabaseEngineIcon;
