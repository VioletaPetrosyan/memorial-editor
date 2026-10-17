<script setup lang="ts">
import { computed, nextTick, onMounted, useId, useTemplateRef, watch } from 'vue';
import BaseDialog from '@/components/BaseDialog.vue';
import FormField from '@/components/FormField.vue';
import { useMemorialForm } from '@/composables/useMemorialForm';
import { confirmDiscardChanges, useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard';
import { useMemorialStore } from '@/stores/memorial';
import { GENDERS, type Memorial, type MemorialFormErrors, RELATIONSHIPS } from '@/types/memorial';
import { GENDER_LABELS, RELATIONSHIP_LABELS, todayIsoDate } from '@/utils/format';

const props = withDefaults(
    defineProps<{
        /** The memorial to edit, or null to create a new one. */
        memorial: Memorial | null;
        /** The same form either way: inline in the page, or inside a modal dialog. */
        presentation?: 'inline' | 'dialog';
        title: string;
        submitLabel?: string;
    }>(),
    { presentation: 'inline', submitLabel: 'Save changes' },
);

const emit = defineEmits<{
    saved: [memorial: Memorial];
    close: [];
}>();

const store = useMemorialStore();

// The draft is created once per editing session from the memorial as it was when editing
// started. It lives in this component rather than in the wrapper below, so switching
// between inline and dialog (e.g. rotating a phone) keeps what the user typed.
const { values, errors, formError, isDirty, reset, submit, setFieldErrors } = useMemorialForm(props.memorial);
useUnsavedChangesGuard(isDirty);

const isDialog = computed(() => props.presentation === 'dialog');
const titleId = useId();
const today = todayIsoDate();
const form = useTemplateRef<HTMLFormElement>('form');
const alert = useTemplateRef<HTMLElement>('alert');

const DATE_FIELDS = ['birth_date', 'passing_date'] as const;

// Only the container changes between presentations; the form markup below is shared.
const wrapper = computed(() =>
    isDialog.value
        ? { is: BaseDialog, attrs: { title: props.title, onRequestClose: requestClose } }
        : { is: 'section', attrs: { class: 'memorial-editor', 'aria-labelledby': titleId } },
);

onMounted(focusFirstField);
watch(isDialog, async () => {
    await nextTick();
    focusFirstField();
});

function focusFirstField(): void {
    form.value?.querySelector<HTMLElement>('input, select')?.focus();
}

/**
 * A date input that is only partly filled in (e.g. the year was deleted) reports an empty
 * value, which would save as "no date" and silently delete the stored one.
 */
function findIncompleteDates(): MemorialFormErrors {
    const incomplete: MemorialFormErrors = {};

    for (const field of DATE_FIELDS) {
        const input = form.value?.elements.namedItem(field);
        if (input instanceof HTMLInputElement && input.validity.badInput) {
            incomplete[field] = 'Enter the full date, or clear it.';
        }
    }

    return incomplete;
}

/** Moves focus to the first invalid field, or to the form's error message if no field is invalid. */
async function focusFirstError(): Promise<void> {
    await nextTick();
    (form.value?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? alert.value)?.focus();
}

async function onSubmit(): Promise<void> {
    const incompleteDates = findIncompleteDates();
    if (Object.keys(incompleteDates).length > 0) {
        setFieldErrors(incompleteDates);
        await focusFirstError();

        return;
    }

    const memorialId = props.memorial?.id;
    const saved = await submit((payload) =>
        memorialId === undefined ? store.create(payload) : store.save(memorialId, payload),
    );

    if (saved) {
        emit('saved', saved);
    } else {
        await focusFirstError();
    }
}

/** Cancel, Esc, the dialog's close button and backdrop clicks all end up here. */
function requestClose(): void {
    if (store.isSaving) return;
    if (isDirty.value && !confirmDiscardChanges()) return;

    // Discard now so the route guard doesn't ask again if the parent navigates away.
    reset();
    emit('close');
}
</script>

<template>
    <component :is="wrapper.is" v-bind="wrapper.attrs">
        <h2 v-if="!isDialog" :id="titleId" class="memorial-editor__title">{{ title }}</h2>

        <form
            ref="form"
            class="memorial-form"
            :class="{ 'memorial-form_sticky-actions': isDialog }"
            novalidate
            @submit.prevent="onSubmit"
        >
            <p class="memorial-form__note">Fields marked <span aria-hidden="true">*</span> are required.</p>
            <!-- Focusable so a failed save can move focus (and scroll) here. -->
            <p v-if="formError" ref="alert" class="memorial-form__alert" role="alert" tabindex="-1">
                {{ formError }}
            </p>

            <fieldset class="memorial-form__section" :disabled="store.isSaving">
                <legend class="memorial-form__legend">Name</legend>
                <div class="memorial-form__grid">
                    <FormField v-slot="{ attrs }" label="First name" :error="errors.first_name" required>
                        <input
                            v-model="values.first_name"
                            name="first_name"
                            v-bind="attrs"
                            class="form-field__control"
                            maxlength="100"
                        >
                    </FormField>
                    <FormField v-slot="{ attrs }" label="Middle name" :error="errors.middle_name">
                        <input
                            v-model="values.middle_name"
                            name="middle_name"
                            v-bind="attrs"
                            class="form-field__control"
                            maxlength="100"
                        >
                    </FormField>
                    <FormField v-slot="{ attrs }" label="Last name" :error="errors.last_name" required>
                        <input
                            v-model="values.last_name"
                            name="last_name"
                            v-bind="attrs"
                            class="form-field__control"
                            maxlength="100"
                        >
                    </FormField>
                </div>
            </fieldset>

            <fieldset class="memorial-form__section" :disabled="store.isSaving">
                <legend class="memorial-form__legend">About</legend>
                <div class="memorial-form__grid">
                    <FormField v-slot="{ attrs }" label="Gender" :error="errors.gender">
                        <select
                            v-model="values.gender"
                            name="gender"
                            v-bind="attrs"
                            class="form-field__control"
                        >
                            <option value="">Not specified</option>
                            <option v-for="gender in GENDERS" :key="gender" :value="gender">
                                {{ GENDER_LABELS[gender] }}
                            </option>
                        </select>
                    </FormField>
                    <FormField
                        v-slot="{ attrs }"
                        label="Relationship"
                        hint="What they were to you."
                        :error="errors.relationship"
                    >
                        <select
                            v-model="values.relationship"
                            name="relationship"
                            v-bind="attrs"
                            class="form-field__control"
                        >
                            <option value="">Not specified</option>
                            <option v-for="relationship in RELATIONSHIPS" :key="relationship" :value="relationship">
                                {{ RELATIONSHIP_LABELS[relationship] }}
                            </option>
                        </select>
                    </FormField>
                    <FormField
                        v-slot="{ attrs }"
                        label="Designation"
                        hint="For example “Beloved mother” or “Veteran”."
                        :error="errors.designation"
                    >
                        <input
                            v-model="values.designation"
                            name="designation"
                            v-bind="attrs"
                            class="form-field__control"
                            maxlength="100"
                        >
                    </FormField>
                    <FormField v-slot="{ attrs }" label="Country" :error="errors.country">
                        <input
                            v-model="values.country"
                            name="country"
                            v-bind="attrs"
                            class="form-field__control"
                            maxlength="100"
                            autocomplete="country-name"
                        >
                    </FormField>
                </div>
            </fieldset>

            <fieldset class="memorial-form__section" :disabled="store.isSaving">
                <legend class="memorial-form__legend">Dates</legend>
                <div class="memorial-form__grid">
                    <FormField v-slot="{ attrs }" label="Date of birth" :error="errors.birth_date">
                        <input
                            v-model="values.birth_date"
                            name="birth_date"
                            v-bind="attrs"
                            class="form-field__control"
                            type="date"
                            :max="today"
                        >
                    </FormField>
                    <FormField v-slot="{ attrs }" label="Date of passing" :error="errors.passing_date">
                        <input
                            v-model="values.passing_date"
                            name="passing_date"
                            v-bind="attrs"
                            class="form-field__control"
                            type="date"
                            :min="values.birth_date || undefined"
                            :max="today"
                        >
                    </FormField>
                </div>
            </fieldset>

            <fieldset class="memorial-form__section" :disabled="store.isSaving">
                <legend class="memorial-form__legend">Website and visibility</legend>
                <div class="memorial-form__grid">
                    <FormField
                        v-slot="{ attrs }"
                        label="Website"
                        hint="Full address, starting with https://"
                        :error="errors.website_url"
                    >
                        <input
                            v-model="values.website_url"
                            name="website_url"
                            v-bind="attrs"
                            class="form-field__control"
                            type="url"
                            inputmode="url"
                            maxlength="2048"
                            placeholder="https://"
                        >
                    </FormField>
                    <FormField
                        v-slot="{ attrs }"
                        label="Published"
                        hint="Show this information on the memorial page."
                        :error="errors.published"
                        checkbox
                    >
                        <input
                            v-model="values.published"
                            name="published"
                            v-bind="attrs"
                            class="form-field__control"
                            type="checkbox"
                        >
                    </FormField>
                </div>
            </fieldset>

            <div class="memorial-form__actions">
                <button
                    type="button"
                    class="button button_secondary memorial-form__action"
                    :disabled="store.isSaving"
                    @click="requestClose"
                >
                    Cancel
                </button>
                <button type="submit" class="button button_primary memorial-form__action" :disabled="store.isSaving">
                    {{ store.isSaving ? 'Saving…' : submitLabel }}
                </button>
            </div>
        </form>
    </component>
</template>

<style lang="scss">
@use '@/styles/breakpoints' as *;

.memorial-editor {
    padding: var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);

    @include mobile {
        padding: var(--space-4);
    }

    &__title {
        margin: 0 0 var(--space-2);
        font-size: var(--font-size-l);
    }
}

.memorial-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);

    &__note {
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-s);
    }

    &__alert {
        margin: 0;
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--color-danger);
        border-radius: var(--radius-m);
        background: var(--color-danger-surface);
        color: var(--color-danger);
        font-weight: 500;
    }

    &__section {
        min-width: 0;
        margin: 0;
        padding: 0;
        border: none;
    }

    &__legend {
        margin-bottom: var(--space-3);
        padding: 0;
        font-size: var(--font-size-m);
        font-weight: 700;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: var(--space-4);
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-border);

    }

    &__action {
        @include mobile {
            flex: 1;
        }
    }

    // In the dialog the actions stay visible at the bottom while the fields scroll.
    &_sticky-actions &__actions {
        position: sticky;
        bottom: calc(-1 * var(--space-4));
        margin: 0 calc(-1 * var(--space-4)) calc(-1 * var(--space-4));
        padding: var(--space-3) var(--space-4);
        background: var(--color-surface);
    }
}
</style>
