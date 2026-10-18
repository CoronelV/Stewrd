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
  availableSchemas?: string[];
}

interface ApiResponse<T> {
  status: boolean;
  code: number;
  data: T | null;
  error: { summary: string; detailed: string } | null;
}

export class ApiRequestError extends Error {
  readonly detailed: string;
  readonly code: number;

  constructor(summary: string, detailed: string, code: number = 500) {
    super(summary);
    this.name = 'ApiRequestError';
    this.detailed = detailed;
    this.code = code;
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
    throw new ApiRequestError('Cannot reach the Stewrd backend', String(error), 503);
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
      envelope?.code ?? response.status,
    );
  }
  return envelope.data;
}

export const testConnection = (input: SshMysqlConnectionInput) =>
  post<SshMysqlConnectionInput, ConnectionTestResult>('/connections/test', input);


export async function saveConnection(
  req: SshMysqlConnectionInput,
  target: ConnectionTarget = 'source',
): Promise<ActiveConnectionInfo> {
  const res = await fetch(`/api/connections/save?target=${encodeURIComponent(target)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  let json: ApiResponse<ActiveConnectionInfo> | null = null;
  try {
    json = (await res.json()) as ApiResponse<ActiveConnectionInfo>;
  } catch {}
  if (!res.ok || !json?.status) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to save connection',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return (
    json.data ?? {
      target,
      status: 'active',
      dbName: req.mysql.schema?.trim() || '-',
      channelType: req.channelType || 'Direct (Local)',
      engine: req.engine,
      username: req.mysql.user,
      environment: req.environment || 'DEV',
      availableSchemas: req.availableSchemas || [],
      connection: req,
    }
  );
}

export async function getActiveConnection(
  target: ConnectionTarget,
): Promise<ActiveConnectionInfo | null> {
  const res = await fetch(`/api/connections/active?target=${encodeURIComponent(target)}`);
  let json: ApiResponse<ActiveConnectionInfo> | null = null;
  try {
    json = (await res.json()) as ApiResponse<ActiveConnectionInfo>;
  } catch {}
  if (!res.ok || !json?.status) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get active connection',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}

export async function removeActiveConnection(target: ConnectionTarget = 'source'): Promise<void> {
  const res = await fetch(`/api/connections/active?target=${encodeURIComponent(target)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    let json: any = null;
    try {
      json = await res.json();
    } catch {}
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to remove active connection',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
}

export async function getTelemetry(req?: TelemetryRequest): Promise<TelemetryResponse> {
  const query = req?.target ? `?target=${encodeURIComponent(req.target)}` : '';
  const res = await fetch(`/api/connections/telemetry${query}`);
  let json: ApiResponse<TelemetryResponse> | null = null;
  try {
    json = (await res.json()) as ApiResponse<TelemetryResponse>;
  } catch {}
  if (!res.ok || !json?.status || json.data === null) {
    const summary = json?.error?.summary ?? `Failed to get telemetry (HTTP ${res.status})`;
    const detailed = json?.error?.detailed ?? String(res.status);
    const code = json?.code ?? res.status;
    throw new ApiRequestError(summary, detailed, code);
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
  let json: ApiResponse<DatabaseSchemaResponse> | null = null;
  try {
    json = (await res.json()) as ApiResponse<DatabaseSchemaResponse>;
  } catch {}
  if (!res.ok || !json?.status || json.data === null) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get schema',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}

export async function getConnectionSchemas(target: ConnectionTarget = 'source'): Promise<string[]> {
  const res = await fetch(`/api/connections/schemas?target=${encodeURIComponent(target)}`);
  let json: ApiResponse<{ schemas: string[] }> | null = null;
  try {
    json = (await res.json()) as ApiResponse<{ schemas: string[] }>;
  } catch {}
  if (!res.ok || !json?.status || !json.data) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get connection schemas',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data.schemas || [];
}

export async function updatePreferredSchema(
  target: ConnectionTarget,
  schema: string,
): Promise<ActiveConnectionInfo> {
  const res = await fetch(`/api/connections/active/schema?target=${encodeURIComponent(target)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, schema }),
  });
  let json: ApiResponse<ActiveConnectionInfo> | null = null;
  try {
    json = (await res.json()) as ApiResponse<ActiveConnectionInfo>;
  } catch {}
  if (!res.ok || !json?.status || !json.data) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to update preferred schema',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}



