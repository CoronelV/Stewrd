import type { DatabaseSchemaResponse, TableSchema, TableRelation, ColumnSchema } from '../../api/connectionsApi';
import type { Environment, ConnectionTarget } from '../../store/useAppStore';

export interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ConnectionTarget;
  dbName: string;
  environment: Environment;
  schemaName?: string;
}

export interface TablePosition {
  x: number;
  y: number;
}

export type { DatabaseSchemaResponse, TableSchema, TableRelation, ColumnSchema };
