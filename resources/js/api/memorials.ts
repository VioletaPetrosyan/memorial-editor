import { request, type ResourceResponse } from '@/api/http';
import type { Memorial, MemorialPayload } from '@/types/memorial';

/** Id of the oldest memorial, or null when there are none. */
export async function fetchFirstMemorialId(): Promise<number | null> {
    const response = await request<ResourceResponse<Memorial[]>>('GET', '/memorials?per_page=1');

    return response.data[0]?.id ?? null;
}

export async function fetchMemorial(id: number): Promise<Memorial> {
    const response = await request<ResourceResponse<Memorial>>('GET', `/memorials/${id}`);

    return response.data;
}

export async function createMemorial(payload: MemorialPayload): Promise<Memorial> {
    const response = await request<ResourceResponse<Memorial>>('POST', '/memorials', payload);

    return response.data;
}

export async function updateMemorial(id: number, payload: MemorialPayload): Promise<Memorial> {
    const response = await request<ResourceResponse<Memorial>>('PUT', `/memorials/${id}`, payload);

    return response.data;
}

export async function deleteMemorial(id: number): Promise<void> {
    await request<void>('DELETE', `/memorials/${id}`);
}
