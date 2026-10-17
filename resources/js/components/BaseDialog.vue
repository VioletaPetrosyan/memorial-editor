<script setup lang="ts">
import { onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue';

defineProps<{
    title: string;
}>();

const emit = defineEmits<{
    /** Esc, the close button or a backdrop click. The parent decides whether to close. */
    requestClose: [];
}>();

/*
 * A native <dialog> opened with showModal(): the browser makes the rest of the page inert,
 * keeps focus inside and returns focus to the opener on close().
 * Mounted means open; the parent controls it with v-if.
 */
const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const titleId = useId();

let isUnmounting = false;
let pressStartedOnBackdrop = false;

onMounted(() => dialog.value?.showModal());

onBeforeUnmount(() => {
    isUnmounting = true;
    // Closing (not just removing) the element is what lets the browser restore focus.
    dialog.value?.close();
});

function onPointerDown(event: PointerEvent): void {
    pressStartedOnBackdrop = event.target === dialog.value;
}

function onClick(event: MouseEvent): void {
    // Backdrop clicks target the <dialog> itself (the panel covers its content box).
    // Requiring the press to start there ignores text selections dragged out of an input.
    if (event.target === dialog.value && pressStartedOnBackdrop) {
        emit('requestClose');
    }
    pressStartedOnBackdrop = false;
}

function onEscape(event: KeyboardEvent): void {
    if (event.isComposing) return;

    // Handled on keydown rather than through the native "cancel" event: Chrome makes a
    // repeated Esc (no user interaction in between) uncancellable and closes the dialog
    // even when the user chose to keep editing. Preventing keydown stops that entirely.
    event.preventDefault();
    emit('requestClose');
}

function onCancel(event: Event): void {
    // Other close requests, e.g. the Android back gesture.
    event.preventDefault();
    emit('requestClose');

    // When cancelling isn't allowed the browser closes the dialog right after this event.
    // Reopen it if the parent decided to keep it (otherwise it is unmounting by then).
    if (!event.cancelable) {
        setTimeout(() => {
            if (!isUnmounting && dialog.value && !dialog.value.open) {
                dialog.value.showModal();
            }
        });
    }
}
</script>

<template>
    <dialog
        ref="dialog"
        class="dialog"
        :aria-labelledby="titleId"
        @keydown.esc="onEscape"
        @cancel="onCancel"
        @pointerdown="onPointerDown"
        @click="onClick"
    >
        <div class="dialog__panel">
            <header class="dialog__header">
                <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
                <button type="button" class="dialog__close" aria-label="Close" @click="emit('requestClose')">
                    <span aria-hidden="true">&times;</span>
                </button>
            </header>
            <div class="dialog__body">
                <slot />
            </div>
        </div>
    </dialog>
</template>

<style lang="scss">
@use '@/styles/breakpoints' as *;

.dialog {
    width: min(100% - 2 * var(--space-4), 40rem);
    max-width: none;
    max-height: calc(100dvh - 2 * var(--space-4));
    padding: 0;
    border: none;
    border-radius: var(--radius-l);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-overlay);

    // Custom properties aren't reliably inherited by ::backdrop, so the colour is literal.
    &::backdrop {
        background: rgb(15 23 42 / 0.55);
    }

    @include mobile {
        // A full-screen sheet leaves the most room for the form on a phone.
        width: 100%;
        height: 100dvh;
        max-height: none;
        margin: 0;
        border-radius: 0;
    }

    &__panel {
        display: flex;
        flex-direction: column;
        max-height: inherit;
        height: 100%;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border);
    }

    &__title {
        margin: 0;
        font-size: var(--font-size-l);
    }

    &__close {
        display: inline-grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border: none;
        border-radius: var(--radius-m);
        background: transparent;
        color: var(--color-text-muted);
        font-size: 1.75rem;
        line-height: 1;
        cursor: pointer;

        &:hover {
            background: var(--color-surface-muted);
            color: var(--color-text);
        }
    }

    &__body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-4);
    }
}

html:has(.dialog:modal) {
    // Stop the page behind the dialog from scrolling.
    overflow: hidden;
}
</style>
