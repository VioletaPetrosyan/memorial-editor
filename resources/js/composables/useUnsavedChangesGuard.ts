import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

export function confirmDiscardChanges(): boolean {
    return window.confirm('You have unsaved changes. Discard them?');
}

/**
 * Asks before unsaved changes are lost by navigating away: to another route or another
 * memorial within the app, or by reloading/closing the tab (browser's own prompt).
 */
export function useUnsavedChangesGuard(isDirty: Readonly<Ref<boolean>>): void {
    const allowNavigation = (): boolean => !isDirty.value || confirmDiscardChanges();

    onBeforeRouteLeave(allowNavigation);
    onBeforeRouteUpdate(allowNavigation);

    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
        if (isDirty.value) {
            event.preventDefault();
        }
    };

    onMounted(() => window.addEventListener('beforeunload', onBeforeUnload));
    onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload));
}
