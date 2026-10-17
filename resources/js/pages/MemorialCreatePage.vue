<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MemorialEditor from '@/components/MemorialEditor.vue';
import type { Memorial } from '@/types/memorial';
import { consumeNotice } from '@/utils/notice';

const router = useRouter();
const notice = ref(consumeNotice());

function onSaved(memorial: Memorial): void {
    // Replace, so Back from the new memorial doesn't return to an empty create form.
    void router.replace({
        name: 'memorial.show',
        params: { id: memorial.id },
        state: { notice: 'Memorial created.' },
    });
}

function onClose(): void {
    // Go back where the user came from; on a direct visit there is no in-app history.
    if (router.options.history.state.back) {
        router.back();
    } else {
        void router.push({ name: 'home' });
    }
}
</script>

<template>
    <div class="page">
        <p v-if="notice" class="notice notice_success" role="status">{{ notice }}</p>

        <header class="page__header">
            <h1 class="page__title">New memorial</h1>
        </header>

        <MemorialEditor
            :memorial="null"
            title="Memorial information"
            submit-label="Create memorial"
            @saved="onSaved"
            @close="onClose"
        />
    </div>
</template>
