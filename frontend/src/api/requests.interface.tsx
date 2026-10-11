import type { ConnectionStatus, Environment, ConnectionTarget } from '../store/useAppStore';

export type { ConnectionStatus, Environment, ConnectionTarget };

export interface SshMysqlConnectionInput {
  target?: ConnectionTarget;
  environment?: Environment;
  channelType?: string;
  engine: string;
  ssh: {
    host: string;
    port: number;
    user: string;
    password?: string | undefined;
    privateKeyPath?: string | undefined;
    insecureIgnoreHostKey?: boolean | undefined;
  };
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    schema?: string | undefined;
  };
}

export interface ActiveConnectionInfo {
  target: ConnectionTarget;
  status: ConnectionStatus;
  dbName: string;
  channelType: string;
  engine: string;
  username: string;
  environment: Environment;
  connection?: SshMysqlConnectionInput;
}

export interface TelemetryRequest {
  target?: ConnectionTarget;
}

export interface TelemetryResponse {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
}

export interface ColumnSchema {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface TableRelation {
  constraintName: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export interface DatabaseSchemaResponse {
  databaseName: string;
  schema: string;
  availableSchemas?: string[];
  tables: TableSchema[];
  relations: TableRelation[];
}

export interface ValidationStep {
  key: string;
  title: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
}

export interface JobValidationResult {
  valid: boolean;
  sourceServer?: string;
  targetServer?: string;
  sourceVersion?: string;
  targetVersion?: string;
  steps: ValidationStep[];
}

export interface StartReplicationRequest {
  sourceTarget?: ConnectionTarget;
  destTarget?: ConnectionTarget;
  sourceSchema?: string;
  destSchema?: string;
}
