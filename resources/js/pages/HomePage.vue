<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { errorMessage } from '@/api/http';
import { fetchFirstMemorialId } from '@/api/memorials';

const router = useRouter();
const error = ref<string | null>(null);

/** Opens the oldest memorial, or the create page when there are none. */
async function openFirstMemorial(): Promise<void> {
    error.value = null;

    try {
        const id = await fetchFirstMemorialId();
        await router.replace(id === null ? { name: 'memorial.create' } : { name: 'memorial.show', params: { id } });
    } catch (caught) {
        error.value = errorMessage(caught);
    }
}

void openFirstMemorial();
</script>

<template>
    <div class="page">
        <section v-if="error" class="empty-state" role="alert">
            <h1 class="empty-state__title">Memorials couldn’t be loaded</h1>
            <p class="empty-state__text">{{ error }}</p>
            <button type="button" class="button button_primary" @click="openFirstMemorial">Try again</button>
        </section>

        <div v-else class="skeleton" aria-busy="true">
            <span class="visually-hidden" role="status">Loading…</span>
            <div class="skeleton__line skeleton__line_title" />
            <div class="skeleton__line skeleton__line_short" />
            <div class="skeleton__card" />
        </div>
    </div>
</template>
