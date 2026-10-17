import { describe, expect, it, vi } from 'vitest';
import { ApiError, request, ValidationError } from '@/api/http';

function respondWith(status: number, body?: unknown): void {
    const text = body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(text, { status })));
}

describe('request', () => {
    it('sends JSON and resolves with the parsed body', async () => {
        respondWith(200, { data: { id: 1 } });

        await expect(request('PUT', '/memorials/1', { first_name: 'Ada' })).resolves.toEqual({ data: { id: 1 } });

        expect(fetch).toHaveBeenCalledWith('/api/memorials/1', {
            method: 'PUT',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: '{"first_name":"Ada"}',
        });
    });

    it('turns a 422 into a ValidationError with the field errors', async () => {
        respondWith(422, { message: 'The first name field is required.', errors: { first_name: ['Required.'] } });

        const error = await request('POST', '/memorials', {}).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchObject({ status: 422, errors: { first_name: ['Required.'] } });
    });

    it('turns other error statuses into an ApiError with the server message', async () => {
        respondWith(404, { message: 'Memorial not found.' });

        const error = await request('GET', '/memorials/9').catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).not.toBeInstanceOf(ValidationError);
        expect(error).toMatchObject({ status: 404, message: 'Memorial not found.' });
    });

    it('falls back to a generic message when the error body is not JSON', async () => {
        respondWith(502, '<html>Bad gateway</html>');

        await expect(request('GET', '/memorials/1')).rejects.toMatchObject({
            status: 502,
            message: 'Request failed with status 502.',
        });
    });

    it('resolves with undefined for 204 No Content', async () => {
        respondWith(204);

        await expect(request('DELETE', '/memorials/1')).resolves.toBeUndefined();
    });

    it('reports network failures as an ApiError with status 0', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        await expect(request('GET', '/memorials/1')).rejects.toMatchObject({ name: 'ApiError', status: 0 });
    });
});
