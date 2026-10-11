import type {
  JobValidationResult,
  StartReplicationRequest,
} from './requests.interface';
import type { RunningJobInfo } from '../store/useAppStore';
import { ApiRequestError } from './connectionsApi';

interface ApiResponse<T> {
  status: boolean;
  code: number;
  data: T | null;
  error: { summary: string; detailed: string } | null;
}

const API_BASE = '/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (error) {
    throw new ApiRequestError('Cannot reach the Stewrd backend', String(error));
  }

  let envelope: ApiResponse<T> | null = null;
  try {
    envelope = (await response.json()) as ApiResponse<T>;
  } catch {
    // Non-JSON response
  }

  if (!response.ok || !envelope?.status || envelope.data === null) {
    throw new ApiRequestError(
      envelope?.error?.summary ?? `Request failed (HTTP ${response.status})`,
      envelope?.error?.detailed ?? response.statusText,
    );
  }

  return envelope.data;
}

export async function validateReplication(
  req: StartReplicationRequest = { sourceTarget: 'source', destTarget: 'target' },
): Promise<JobValidationResult> {
  return fetchJson<JobValidationResult>('/jobs/replicate-local/validate', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function startReplication(
  req: StartReplicationRequest = { sourceTarget: 'source', destTarget: 'target' },
): Promise<RunningJobInfo> {
  return fetchJson<RunningJobInfo>('/jobs/replicate-local/start', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getActiveJob(): Promise<RunningJobInfo | null> {
  return fetchJson<RunningJobInfo | null>('/jobs/active', {
    method: 'GET',
  });
}

export async function cancelActiveJob(): Promise<void> {
  await fetchJson<{ status: string }>('/jobs/active/cancel', {
    method: 'POST',
  });
}
