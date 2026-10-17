import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ApiError, errorMessage } from '@/api/http';
import { createMemorial, deleteMemorial, fetchMemorial, updateMemorial } from '@/api/memorials';
import type { Memorial, MemorialPayload } from '@/types/memorial';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'not-found' | 'error';

/**
 * Server state: the memorial as last confirmed by the API, plus the status of the
 * requests about it. Unsaved form edits are not kept here (see useMemorialForm).
 */
export const useMemorialStore = defineStore('memorial', () => {
    const memorial = ref<Memorial | null>(null);
    const loadStatus = ref<LoadStatus>('idle');
    const loadError = ref<string | null>(null);
    const isSaving = ref(false);
    const isDeleting = ref(false);

    // Bumped on every load() so a slow, outdated response can't overwrite a newer one.
    let latestLoad = 0;

    async function load(id: number): Promise<void> {
        const thisLoad = ++latestLoad;

        loadStatus.value = 'loading';
        loadError.value = null;

        // Keep showing the memorial while refreshing it, but never show a different one.
        if (memorial.value?.id !== id) {
            memorial.value = null;
        }

        try {
            const loaded = await fetchMemorial(id);
            if (thisLoad !== latestLoad) return;

            memorial.value = loaded;
            loadStatus.value = 'loaded';
        } catch (error) {
            if (thisLoad !== latestLoad) return;

            memorial.value = null;
            loadStatus.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error';
            loadError.value = errorMessage(error);
        }
    }

    /**
     * The API response becomes the new server state, so nothing has to be refetched.
     * Errors, including ValidationError, are rethrown for the form to display.
     */
    async function save(id: number, payload: MemorialPayload): Promise<Memorial> {
        isSaving.value = true;

        try {
            const saved = await updateMemorial(id, payload);
            if (memorial.value?.id === saved.id) {
                memorial.value = saved;
            }

            return saved;
        } finally {
            isSaving.value = false;
        }
    }

    async function create(payload: MemorialPayload): Promise<Memorial> {
        isSaving.value = true;

        try {
            const created = await createMemorial(payload);
            memorial.value = created;
            loadStatus.value = 'loaded';

            return created;
        } finally {
            isSaving.value = false;
        }
    }

    async function remove(id: number): Promise<void> {
        isDeleting.value = true;

        try {
            try {
                await deleteMemorial(id);
            } catch (error) {
                // Already deleted (e.g. in another tab): that's the outcome the user asked for.
                if (!(error instanceof ApiError && error.status === 404)) {
                    throw error;
                }
            }

            if (memorial.value?.id === id) {
                memorial.value = null;
                loadStatus.value = 'idle';
            }
        } finally {
            isDeleting.value = false;
        }
    }

    return { memorial, loadStatus, loadError, isSaving, isDeleting, load, save, create, remove };
});
