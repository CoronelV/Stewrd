import type {
  SshMysqlConnectionInput,
  ActiveConnectionInfo,
  ConnectionTarget,
  TelemetryRequest,
  TelemetryResponse,
  DatabaseSchemaResponse,
} from './requests.interface';

export type {
  SshMysqlConnectionInput,
  ActiveConnectionInfo,
  ConnectionTarget,
  TelemetryRequest,
  TelemetryResponse,
  ColumnSchema,
  TableRelation,
  TableSchema,
  DatabaseSchemaResponse,
} from './requests.interface';

export interface ConnectionTestResult {
  serverVersion: string;
  latencyMs: number;
}

interface ApiResponse<T> {
  status: boolean;
  code: number;
  data: T | null;
  error: { summary: string; detailed: string } | null;
}

export class ApiRequestError extends Error {
  readonly detailed: string;

  constructor(summary: string, detailed: string) {
    super(summary);
    this.detailed = detailed;
  }
}

// Same-origin: served by the Go backend in production, proxied by Vite in dev.
const API_BASE = '/api';

async function post<TBody, TData>(path: string, body: TBody): Promise<TData> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiRequestError('Cannot reach the Stewrd backend', String(error));
  }

  let envelope: ApiResponse<TData> | null = null;
  try {
    envelope = (await response.json()) as ApiResponse<TData>;
  } catch {
    // Non-JSON body (e.g. proxy error page); handled below.
  }

  if (!response.ok || !envelope?.status || envelope.data === null) {
    throw new ApiRequestError(
      envelope?.error?.summary ?? `Request failed (HTTP ${response.status})`,
      envelope?.error?.detailed ?? response.statusText,
    );
  }
  return envelope.data;
}

export const testConnection = (input: SshMysqlConnectionInput) =>
  post<SshMysqlConnectionInput, ConnectionTestResult>('/connections/test', input);


export async function saveConnection(
  req: SshMysqlConnectionInput,
  target: ConnectionTarget = 'source',
): Promise<void> {
  const res = await fetch(`/api/connections/save?target=${encodeURIComponent(target)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new ApiRequestError('Failed to save connection', String(res.status));
  }
}

export async function getActiveConnection(
  target: ConnectionTarget,
): Promise<ActiveConnectionInfo | null> {
  const res = await fetch(`/api/connections/active?target=${encodeURIComponent(target)}`);
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get active connection',
      json?.error?.detailed ?? String(res.status),
    );
  }
  return json.data;
}


export async function getTelemetry(req?: TelemetryRequest): Promise<TelemetryResponse> {
  const query = req?.target ? `?target=${encodeURIComponent(req.target)}` : '';
  const res = await fetch(`/api/connections/telemetry${query}`);
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new ApiRequestError('Failed to get telemetry', String(res.status));
  }
  return json.data;
}

export async function getSchema(
  target: ConnectionTarget = 'source',
  schema?: string,
): Promise<DatabaseSchemaResponse> {
  const query = schema
    ? `?target=${encodeURIComponent(target)}&schema=${encodeURIComponent(schema)}`
    : `?target=${encodeURIComponent(target)}`;
  const res = await fetch(`/api/connections/schema${query}`);
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get schema',
      json?.error?.detailed ?? String(res.status),
    );
  }
  return json.data;
}


