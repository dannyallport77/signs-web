import { logActivity, getRequestInfo } from '@/lib/activity-log';

export type GoogleApiLogContext = {
  service: string;
  action?: string;
  endpoint?: string;
  requestId?: string;
  context?: string;
  source?: string;
  userId?: string;
  request?: Request;
  metadata?: Record<string, any>;
};

type GoogleApiFetchOptions = RequestInit & { timeoutMs?: number };

function sanitizeGoogleUrl(input: string | URL): string {
  try {
    const url = typeof input === 'string' ? new URL(input) : input;
    if (url.searchParams.has('key')) {
      url.searchParams.set('key', 'REDACTED');
    }
    if (url.searchParams.has('apiKey')) {
      url.searchParams.set('apiKey', 'REDACTED');
    }
    return url.toString();
  } catch {
    const raw = typeof input === 'string' ? input : input.toString();
    return raw.replace(/([?&]key=)[^&]+/gi, '$1REDACTED').replace(/([?&]apiKey=)[^&]+/gi, '$1REDACTED');
  }
}

function buildEndpoint(input: string | URL): string | undefined {
  try {
    const url = typeof input === 'string' ? new URL(input) : input;
    return url.pathname;
  } catch {
    return undefined;
  }
}

function resolveSeverity(status?: number, hadError?: boolean): 'info' | 'warning' | 'error' {
  if (hadError) return 'error';
  if (status && status >= 500) return 'error';
  if (status && status >= 400) return 'warning';
  return 'info';
}

function getMethod(options?: RequestInit): string {
  return (options?.method || 'GET').toUpperCase();
}

function createAbortSignal(
  options: GoogleApiFetchOptions
): { signal?: AbortSignal; clearTimeout?: () => void } {
  const { timeoutMs } = options;
  const existingSignal = options.signal;

  if (!timeoutMs) {
    return { signal: existingSignal || undefined };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (existingSignal) {
    if (existingSignal.aborted) {
      controller.abort();
    } else {
      existingSignal.addEventListener('abort', () => controller.abort());
    }
  }

  return {
    signal: controller.signal,
    clearTimeout: () => clearTimeout(timeoutId),
  };
}

export async function googleApiFetch(
  input: string | URL,
  options: GoogleApiFetchOptions = {},
  context: GoogleApiLogContext
): Promise<Response> {
  const start = Date.now();
  const method = getMethod(options);
  const url = sanitizeGoogleUrl(input);
  const endpoint = context.endpoint || buildEndpoint(input);
  const requestInfo = context.request ? getRequestInfo(context.request) : {};
  const { signal, clearTimeout } = createAbortSignal(options);
  const { timeoutMs, ...fetchOptions } = options;

  let response: Response | undefined;
  let error: unknown;

  try {
    response = await fetch(input, {
      ...fetchOptions,
      signal,
    });
    return response;
  } catch (err) {
    error = err;
    throw err;
  } finally {
    clearTimeout?.();
    const durationMs = Date.now() - start;
    const status = response?.status;
    const ok = response?.ok;
    const hadError = Boolean(error);

    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message }
      : error
        ? { message: String(error) }
        : undefined;

    const action = context.action || `Google API call: ${context.service}${status ? ` (${status})` : ''}`;

    await logActivity({
      type: 'google_api_call',
      action,
      userId: context.userId,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      severity: resolveSeverity(status, hadError),
      metadata: {
        provider: 'google',
        service: context.service,
        method,
        url,
        endpoint,
        status,
        ok,
        durationMs,
        requestId: context.requestId,
        context: context.context,
        source: context.source,
        timeoutMs,
        error: errorDetails,
        ...context.metadata,
      },
    });
  }
}
