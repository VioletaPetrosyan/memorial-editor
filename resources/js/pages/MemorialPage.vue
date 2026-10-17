<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { errorMessage } from '@/api/http';
import MemorialDetails from '@/components/MemorialDetails.vue';
import MemorialEditor from '@/components/MemorialEditor.vue';
import { MOBILE_MEDIA_QUERY, useMediaQuery } from '@/composables/useMediaQuery';
import { useMemorialStore } from '@/stores/memorial';
import { fullName, lifeYears } from '@/utils/format';
import { consumeNotice } from '@/utils/notice';

const props = defineProps<{
    id: number;
}>();

const router = useRouter();
const store = useMemorialStore();
const { memorial, loadStatus, loadError, isDeleting } = storeToRefs(store);

// UI state. Only this page cares about it, so it stays local.
const isEditing = ref(false);
const notice = ref<string | null>(null);
const actionError = ref<string | null>(null);
const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
const editButton = useTemplateRef<HTMLButtonElement>('editButton');

const years = computed(() => memorial.value && lifeYears(memorial.value));

watch(
    () => props.id,
    (id) => {
        isEditing.value = false;
        actionError.value = null;
        notice.value = consumeNotice();

        // Every save in this app updates the store, so a memorial it already holds
        // (e.g. one that was just created) doesn't need to be fetched again.
        if (store.memorial?.id !== id) {
            void store.load(id);
        }
    },
    { immediate: true },
);

function startEditing(): void {
    notice.value = null;
    actionError.value = null;
    isEditing.value = true;
}

async function stopEditing(): Promise<void> {
    isEditing.value = false;
    // Inline, the Edit button was re-rendered, so focus has to be put back explicitly.
    await nextTick();
    editButton.value?.focus();
}

function onSaved(): void {
    notice.value = 'Changes saved.';
    void stopEditing();
}

async function onDelete(): Promise<void> {
    const current = memorial.value;
    if (!current || !window.confirm(`Delete the memorial for ${fullName(current)}?`)) return;

    actionError.value = null;
    notice.value = null;

    try {
        await store.remove(current.id);
        // Replace, so Back (or Cancel on the next page) doesn't return to the deleted memorial.
        await router.replace({ name: 'memorial.create', state: { notice: 'Memorial deleted.' } });
    } catch (error) {
        actionError.value = errorMessage(error);
    }
}
</script>

<template>
    <div class="page">
        <p v-if="notice" class="notice notice_success" role="status">{{ notice }}</p>
        <p v-if="actionError" class="notice notice_error" role="alert">{{ actionError }}</p>

        <template v-if="memorial">
            <header class="page__header">
                <div class="page__heading">
                    <h1 class="page__title">{{ fullName(memorial) }}</h1>
                    <p class="page__meta">
                        <span v-if="years">{{ years }}</span>
                        <span
                            class="status-badge"
                            :class="memorial.published ? 'status-badge_published' : 'status-badge_hidden'"
                        >
                            {{ memorial.published ? 'Published' : 'Not published' }}
                        </span>
                    </p>
                </div>

                <div v-if="!isEditing" class="page__actions">
                    <button
                        ref="editButton"
                        type="button"
                        class="button button_primary page__action"
                        @click="startEditing"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        class="button button_danger page__action"
                        :disabled="isDeleting"
                        @click="onDelete"
                    >
                        {{ isDeleting ? 'Deleting…' : 'Delete' }}
                    </button>
                </div>
            </header>

            <!-- Desktop: the form replaces the details. Mobile: details stay, the form opens in a dialog. -->
            <MemorialDetails v-if="!isEditing || isMobile" :memorial="memorial" />
            <MemorialEditor
                v-if="isEditing"
                :memorial="memorial"
                :presentation="isMobile ? 'dialog' : 'inline'"
                title="Edit memorial information"
                @saved="onSaved"
                @close="stopEditing"
            />
        </template>

        <div v-else-if="loadStatus === 'loading'" class="skeleton" aria-busy="true">
            <span class="visually-hidden" role="status">Loading memorial…</span>
            <div class="skeleton__line skeleton__line_title" />
            <div class="skeleton__line skeleton__line_short" />
            <div class="skeleton__card" />
        </div>

        <section v-else-if="loadStatus === 'not-found'" class="empty-state">
            <h1 class="empty-state__title">Memorial not found</h1>
            <p class="empty-state__text">It may have been deleted, or the link is wrong.</p>
            <RouterLink :to="{ name: 'memorial.create' }" class="button button_primary">Create a memorial</RouterLink>
        </section>

        <section v-else-if="loadStatus === 'error'" class="empty-state" role="alert">
            <h1 class="empty-state__title">The memorial couldn’t be loaded</h1>
            <p class="empty-state__text">{{ loadError }}</p>
            <button type="button" class="button button_primary" @click="store.load(id)">Try again</button>
        </section>
        <!-- "idle" (e.g. right after a delete, while leaving the page) shows nothing. -->
    </div>
</template>

<style lang="scss">
.status-badge {
    padding: 0.1rem var(--space-2);
    border-radius: 999px;
    font-size: var(--font-size-s);
    font-weight: 600;

    &_published {
        background: var(--color-success-surface);
        color: var(--color-success);
    }

    &_hidden {
        background: var(--color-surface-muted);
        color: var(--color-text-muted);
    }
}
</style>
