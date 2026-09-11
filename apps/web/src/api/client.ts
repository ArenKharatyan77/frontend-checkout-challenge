import type { ApiError, ApiResult } from '@checkout/contracts';
import { isAborted, RequestError } from './errors';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  token?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
};

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new RequestError({
      kind: 'parse',
      message: 'Не удалось разобрать ответ сервера.',
      status: response.status,
      cause,
    });
  }
}

async function execute(
  path: string,
  options: RequestOptions,
): Promise<{ data: unknown; response: Response }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    if (isAborted(cause)) throw cause;
    throw new RequestError({
      kind: 'network',
      message: 'Не удалось соединиться с сервером.',
      cause,
    });
  }

  const body = await readBody(response);

  if (!response.ok) {
    const payload = body as ApiError | undefined;
    throw new RequestError({
      kind: 'http',
      status: response.status,
      message: payload?.error.message ?? `Сервер ответил статусом ${response.status}.`,
      code: payload?.error.code,
      fields: payload?.error.fields,
      requestId: payload?.meta.requestId,
    });
  }

  return { data: (body as ApiResult<unknown> | undefined)?.data, response };
}

async function send<T>(path: string, options: RequestOptions): Promise<T> {
  const { data } = await execute(path, options);
  return data as T;
}

export type Envelope<T> = { data: T; retryAfterMs: number | null };

async function sendWithMeta<T>(path: string, options: RequestOptions): Promise<Envelope<T>> {
  const { data, response } = await execute(path, options);
  const retryAfter = response.headers.get('Retry-After');
  return { data: data as T, retryAfterMs: retryAfter ? Number(retryAfter) * 1000 : null };
}

export type ApiClient = {
  get: <T>(path: string, signal?: AbortSignal) => Promise<T>;
  post: <T>(
    path: string,
    body?: unknown,
    idempotencyKey?: string,
    signal?: AbortSignal,
  ) => Promise<T>;
  postWithMeta: <T>(path: string, body?: unknown, signal?: AbortSignal) => Promise<Envelope<T>>;
  put: <T>(path: string, body: unknown, signal?: AbortSignal) => Promise<T>;
  del: <T>(path: string, signal?: AbortSignal) => Promise<T>;
};

export function createApiClient(token?: string): ApiClient {
  return {
    get: (path, signal) => send(path, { method: 'GET', token, signal }),
    post: (path, body, idempotencyKey, signal) =>
      send(path, { method: 'POST', body: body ?? {}, token, idempotencyKey, signal }),
    postWithMeta: (path, body, signal) =>
      sendWithMeta(path, { method: 'POST', body: body ?? {}, token, signal }),
    put: (path, body, signal) => send(path, { method: 'PUT', body, token, signal }),
    del: (path, signal) => send(path, { method: 'DELETE', token, signal }),
  };
}

export const anonymousClient = createApiClient();
