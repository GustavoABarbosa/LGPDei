export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3334/api";

export type RateLimitScope = "messages" | "uploads" | "sessions";

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) ? seconds : undefined;
}

export async function readApiError(response: Response): Promise<ApiError> {
  const retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"));
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;
  const message =
    body?.message ?? body?.error ?? `Request failed (${response.status})`;

  return new ApiError(response.status, message, retryAfterSeconds);
}

export async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw await readApiError(response);
  }
}

export function isRateLimitError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 429;
}

export function formatRateLimitMessage(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds) {
    return "Limite de requisições atingido. Tente novamente mais tarde.";
  }
  if (retryAfterSeconds < 60) {
    return `Limite atingido. Tente novamente em ${retryAfterSeconds} segundos.`;
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Limite atingido. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await readApiError(response);
  }

  return response.json() as Promise<T>;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;

  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message) return fallback;

    const quotedMessage = message.match(/'message': '([^']+)'/);
    if (quotedMessage?.[1]) return quotedMessage[1];

    return message;
  }

  if (typeof error === "string" && error.trim()) return error.trim();

  return fallback;
}
