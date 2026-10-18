import type { ConnectionStatus, Environment, ConnectionTarget } from '../store/useAppStore';

export type { ConnectionStatus, Environment, ConnectionTarget };

export interface SshMysqlConnectionInput {
  target?: ConnectionTarget;
  environment?: Environment;
  channelType?: string;
  engine: string;
  serverVersion?: string;
  availableSchemas?: string[];
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
  serverVersion?: string;
  availableSchemas?: string[];
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

export interface CommonSchemasResponse {
  schemas: string[];
  sourceSchemas: string[];
  targetSchemas: string[];
  sourceActive: boolean;
  targetActive: boolean;
}

export interface TableSchemaValidationItem {
  tableName: string;
  existsInSource: boolean;
  existsInTarget: boolean;
  compatible: boolean;
  status: 'compatible' | 'column_mismatch' | 'missing_in_target' | 'missing_in_source';
  sourceColumnCount: number;
  targetColumnCount: number;
  commonColumns: string[];
  missingInTarget: string[];
  missingInSource: string[];
  typeMismatches: string[];
}

export interface SchemaValidationResponse {
  sourceSchema: string;
  targetSchema: string;
  available: boolean;
  status: 'valid' | 'warning' | 'invalid';
  summary: string;
  totalTables: number;
  commonTables: number;
  compatibleTables: number;
  columnMismatchTables: number;
  missingInTargetCount: number;
  missingInSourceCount: number;
  tables: TableSchemaValidationItem[];
}

export interface TableOverviewItem {
  tableName: string;
  sourceCount: number;
  targetCount: number;
  existsInSource: boolean;
  existsInTarget: boolean;
  primaryKeys: string[];
  columns: string[];
}

export interface TableComparisonOverviewResponse {
  schema: string;
  sourceSchema: string;
  targetSchema: string;
  tables: TableOverviewItem[];
}

export type ComparisonFilter = 'differences' | 'only_target' | 'only_source';

export interface ComparisonDataRequest {
  schema?: string;
  sourceSchema: string;
  targetSchema: string;
  table: string;
  uniqueKeys: string[];
  filter: ComparisonFilter;
  limit?: number;
  offset?: number;
}

export interface ComparisonStats {
  sourceTotal: number;
  targetTotal: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  differentCount: number;
  identicalCount: number;
}

export interface ComparisonRow {
  keyValues: Record<string, unknown>;
  status: 'only_source' | 'only_target' | 'different';
  differingColumns: string[];
  sourceData: Record<string, unknown> | null;
  targetData: Record<string, unknown> | null;
}

export interface ComparisonDataResponse {
  schema: string;
  sourceSchema: string;
  targetSchema: string;
  table: string;
  columns: string[];
  uniqueKeys: string[];
  filter: string;
  offset: number;
  limit: number;
  totalMatches: number;
  hasMore: boolean;
  stats: ComparisonStats;
  rows: ComparisonRow[];
}
