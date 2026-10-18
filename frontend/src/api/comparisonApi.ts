import type {
  CommonSchemasResponse,
  SchemaValidationResponse,
  TableComparisonOverviewResponse,
  ComparisonDataRequest,
  ComparisonDataResponse,
} from './requests.interface';
import { ApiRequestError } from './connectionsApi';

interface ApiResponse<T> {
  status: boolean;
  code: number;
  data: T | null;
  error: { summary: string; detailed: string } | null;
}

export async function getCommonSchemas(): Promise<CommonSchemasResponse> {
  const res = await fetch('/api/comparison/schemas');
  let json: ApiResponse<CommonSchemasResponse> | null = null;
  try {
    json = (await res.json()) as ApiResponse<CommonSchemasResponse>;
  } catch {}
  if (!res.ok || !json?.status || json.data === null) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get schemas',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}

export async function validateComparisonSchemas(
  sourceSchema: string,
  targetSchema: string,
): Promise<SchemaValidationResponse> {
  const params = new URLSearchParams({
    sourceSchema,
    targetSchema,
  });
  const res = await fetch(`/api/comparison/schemas/validate?${params.toString()}`);
  let json: ApiResponse<SchemaValidationResponse> | null = null;
  try {
    json = (await res.json()) as ApiResponse<SchemaValidationResponse>;
  } catch {}
  if (!res.ok || !json?.status || json.data === null) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to validate schemas',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}

export async function getComparisonTables(
  sourceSchema: string,
  targetSchema: string,
): Promise<TableComparisonOverviewResponse> {
  const params = new URLSearchParams({
    sourceSchema,
    targetSchema,
  });
  const res = await fetch(`/api/comparison/tables?${params.toString()}`);
  let json: ApiResponse<TableComparisonOverviewResponse> | null = null;
  try {
    json = (await res.json()) as ApiResponse<TableComparisonOverviewResponse>;
  } catch {}
  if (!res.ok || !json?.status || json.data === null) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get comparison tables',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}

export async function getComparisonData(
  req: ComparisonDataRequest,
): Promise<ComparisonDataResponse> {
  const res = await fetch('/api/comparison/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  let json: ApiResponse<ComparisonDataResponse> | null = null;
  try {
    json = (await res.json()) as ApiResponse<ComparisonDataResponse>;
  } catch {}
  if (!res.ok || !json?.status || json.data === null) {
    throw new ApiRequestError(
      json?.error?.summary ?? 'Failed to get comparison data',
      json?.error?.detailed ?? String(res.status),
      json?.code ?? res.status,
    );
  }
  return json.data;
}
