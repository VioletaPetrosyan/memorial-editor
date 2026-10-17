import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ValidationError } from '@/api/http';
import { createMemorial, deleteMemorial, fetchMemorial, updateMemorial } from '@/api/memorials';
import { toFormValues, toPayload } from '@/composables/useMemorialForm';
import { useMemorialStore } from '@/stores/memorial';
import type { Memorial } from '@/types/memorial';
import { deferred, makeMemorial } from '../helpers';

vi.mock('@/api/memorials');

describe('memorial store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('loads a memorial', async () => {
        const memorial = makeMemorial();
        vi.mocked(fetchMemorial).mockResolvedValue(memorial);
        const store = useMemorialStore();

        const loading = store.load(1);
        expect(store.loadStatus).toBe('loading');
        await loading;

        expect(fetchMemorial).toHaveBeenCalledWith(1);
        expect(store.memorial).toEqual(memorial);
        expect(store.loadStatus).toBe('loaded');
    });

    it('distinguishes "not found" from other load failures', async () => {
        const store = useMemorialStore();

        vi.mocked(fetchMemorial).mockRejectedValueOnce(new ApiError('Memorial not found.', 404));
        await store.load(9);
        expect(store.loadStatus).toBe('not-found');

        vi.mocked(fetchMemorial).mockRejectedValueOnce(new ApiError('Could not reach the server.', 0));
        await store.load(9);
        expect(store.loadStatus).toBe('error');
        expect(store.loadError).toBe('Could not reach the server.');
    });

    it('ignores a slow response that a newer load has superseded', async () => {
        const first = deferred<Memorial>();
        const second = deferred<Memorial>();
        vi.mocked(fetchMemorial).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        const store = useMemorialStore();

        const loadOne = store.load(1);
        const loadTwo = store.load(2);
        second.resolve(makeMemorial({ id: 2 }));
        await loadTwo;
        first.resolve(makeMemorial({ id: 1 }));
        await loadOne;

        expect(store.memorial?.id).toBe(2);
    });

    it('replaces the memorial with the saved version and tracks the saving state', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        const store = useMemorialStore();
        await store.load(1);

        const saved = makeMemorial({ first_name: 'Ellie' });
        const request = deferred<Memorial>();
        vi.mocked(updateMemorial).mockReturnValue(request.promise);
        const payload = toPayload(toFormValues(saved));

        const saving = store.save(1, payload);
        expect(store.isSaving).toBe(true);
        request.resolve(saved);
        await saving;

        expect(updateMemorial).toHaveBeenCalledWith(1, payload);
        expect(store.isSaving).toBe(false);
        expect(store.memorial).toEqual(saved);
    });

    it('keeps the confirmed memorial and rethrows when saving fails', async () => {
        const original = makeMemorial();
        vi.mocked(fetchMemorial).mockResolvedValue(original);
        const store = useMemorialStore();
        await store.load(1);

        const error = new ValidationError('Invalid', { first_name: ['Required.'] });
        vi.mocked(updateMemorial).mockRejectedValue(error);

        await expect(store.save(1, toPayload(toFormValues(original)))).rejects.toBe(error);
        expect(store.memorial).toEqual(original);
        expect(store.isSaving).toBe(false);
    });

    it('makes a created memorial the current one', async () => {
        const created = makeMemorial({ id: 5 });
        vi.mocked(createMemorial).mockResolvedValue(created);
        const store = useMemorialStore();

        await store.create(toPayload(toFormValues(created)));

        expect(store.memorial).toEqual(created);
        expect(store.loadStatus).toBe('loaded');
    });

    it('treats a memorial that is already gone (404) as deleted', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(deleteMemorial).mockRejectedValue(new ApiError('Memorial not found.', 404));
        const store = useMemorialStore();
        await store.load(1);

        await expect(store.remove(1)).resolves.toBeUndefined();

        expect(store.memorial).toBeNull();
    });

    it('keeps the memorial and rethrows when deleting fails for another reason', async () => {
        const memorial = makeMemorial();
        vi.mocked(fetchMemorial).mockResolvedValue(memorial);
        vi.mocked(deleteMemorial).mockRejectedValue(new ApiError('Server Error', 500));
        const store = useMemorialStore();
        await store.load(1);

        await expect(store.remove(1)).rejects.toMatchObject({ status: 500 });

        expect(store.memorial).toEqual(memorial);
        expect(store.isDeleting).toBe(false);
    });

    it('forgets a memorial once it is deleted', async () => {
        vi.mocked(fetchMemorial).mockResolvedValue(makeMemorial());
        vi.mocked(deleteMemorial).mockResolvedValue();
        const store = useMemorialStore();
        await store.load(1);

        await store.remove(1);

        expect(deleteMemorial).toHaveBeenCalledWith(1);
        expect(store.memorial).toBeNull();
        expect(store.isDeleting).toBe(false);
    });
});
