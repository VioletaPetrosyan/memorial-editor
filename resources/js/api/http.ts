/** Laravel wraps API resources in { data }. */
export interface ResourceResponse<T> {
    data: T;
}

/** Laravel's validation error body (HTTP 422). */
export interface ValidationErrorBody {
    message: string;
    errors: Record<string, string[]>;
}

export class ApiError extends Error {
    constructor(
        message: string,
        /** HTTP status, or 0 when the request never got a response. */
        readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class ValidationError extends ApiError {
    constructor(
        message: string,
        readonly errors: Record<string, string[]>,
    ) {
        super(message, 422);
        this.name = 'ValidationError';
    }
}

/** A message that is safe to show to the user for any thrown value. */
export function errorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Thin fetch wrapper for the JSON API. Resolves with the parsed body and turns
 * every non-2xx response into an ApiError (ValidationError for 422).
 */
export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`/api${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                ...(body !== undefined && { 'Content-Type': 'application/json' }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const data: unknown = await response.json().catch(() => null);

    if (response.status === 422 && isValidationErrorBody(data)) {
        throw new ValidationError(data.message, data.errors);
    }

    if (!response.ok) {
        throw new ApiError(messageOf(data) ?? `Request failed with status ${response.status}.`, response.status);
    }

    return data as T;
}

function isValidationErrorBody(data: unknown): data is ValidationErrorBody {
    return typeof data === 'object' && data !== null && 'errors' in data && typeof data.errors === 'object';
}

function messageOf(data: unknown): string | null {
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
        return data.message;
    }

    return null;
}
