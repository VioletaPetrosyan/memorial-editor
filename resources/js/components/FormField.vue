<script setup lang="ts">
import { computed, useId } from 'vue';

const props = defineProps<{
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
    /** Checkbox layout: the control sits before its label. */
    checkbox?: boolean;
}>();

const id = useId();
const hintId = `${id}-hint`;
const errorId = `${id}-error`;

/** Spread onto the control (v-bind="attrs") to connect it with its label, hint and error. */
const controlAttrs = computed(() => ({
    id,
    required: props.required || undefined,
    'aria-invalid': props.error ? true : undefined,
    'aria-describedby': [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ') || undefined,
}));
</script>

<template>
    <div class="form-field" :class="{ 'form-field_invalid': error, 'form-field_checkbox': checkbox }">
        <label :for="id" class="form-field__label">
            {{ label }}<span v-if="required" class="form-field__required" aria-hidden="true">*</span>
        </label>
        <slot :attrs="controlAttrs" />
        <p v-if="hint" :id="hintId" class="form-field__hint">{{ hint }}</p>
        <p v-if="error" :id="errorId" class="form-field__error">{{ error }}</p>
    </div>
</template>

<style lang="scss">
.form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;

    &__label {
        font-weight: 600;
        font-size: var(--font-size-s);
    }

    &__required {
        margin-left: 0.15em;
        color: var(--color-danger);
    }

    &__control {
        width: 100%;
        min-height: 2.75rem;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-m);
        background: var(--color-surface);
        color: inherit;
        font: inherit;

        &:hover:not(:disabled) {
            border-color: var(--color-text-muted);
        }

        &:disabled {
            background: var(--color-surface-muted);
            cursor: not-allowed;
        }
    }

    &__hint {
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-s);
    }

    &__error {
        margin: 0;
        color: var(--color-danger);
        font-size: var(--font-size-s);
        font-weight: 500;
    }

    &_invalid &__control {
        border-color: var(--color-danger);
        box-shadow: 0 0 0 1px var(--color-danger);
    }

    &_checkbox {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-areas:
            'control label'
            '. hint'
            '. error';
        column-gap: var(--space-3);
        align-items: center;

        .form-field__label {
            grid-area: label;
            font-size: var(--font-size-m);
        }

        .form-field__control {
            grid-area: control;
            width: 1.25rem;
            min-height: 1.25rem;
            height: 1.25rem;
            margin: 0;
            accent-color: var(--color-primary);
        }

        .form-field__hint {
            grid-area: hint;
        }

        .form-field__error {
            grid-area: error;
        }
    }
}
</style>
