<script setup lang="ts">
import { computed } from 'vue';
import type { Memorial } from '@/types/memorial';
import { ageAtPassing, formatDate, GENDER_LABELS, RELATIONSHIP_LABELS } from '@/utils/format';

const props = defineProps<{
    memorial: Memorial;
}>();

interface DetailItem {
    label: string;
    value: string | null;
    href?: string;
}

const items = computed<DetailItem[]>(() => {
    const memorial = props.memorial;
    const age = ageAtPassing(memorial);

    return [
        { label: 'Born', value: memorial.birth_date && formatDate(memorial.birth_date) },
        {
            label: 'Passed away',
            value: memorial.passing_date && formatDate(memorial.passing_date) + (age === null ? '' : ` (aged ${age})`),
        },
        { label: 'Gender', value: memorial.gender && GENDER_LABELS[memorial.gender] },
        { label: 'Relationship', value: memorial.relationship && RELATIONSHIP_LABELS[memorial.relationship] },
        { label: 'Designation', value: memorial.designation },
        { label: 'Country', value: memorial.country },
        { label: 'Website', value: memorial.website_url, href: memorial.website_url ?? undefined },
    ];
});
</script>

<template>
    <section class="memorial-details" aria-label="Memorial information">
        <dl class="memorial-details__list">
            <div v-for="item in items" :key="item.label" class="memorial-details__item">
                <dt class="memorial-details__term">{{ item.label }}</dt>
                <dd class="memorial-details__value" :class="{ 'memorial-details__value_empty': !item.value }">
                    <a
                        v-if="item.href"
                        :href="item.href"
                        class="memorial-details__link"
                        target="_blank"
                        rel="noopener noreferrer"
                    >{{ item.value }}</a>
                    <template v-else>{{ item.value || 'Not specified' }}</template>
                </dd>
            </div>
        </dl>
    </section>
</template>

<style lang="scss">
@use '@/styles/breakpoints' as *;

.memorial-details {
    padding: var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);

    @include mobile {
        padding: var(--space-4);
    }

    &__list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        gap: var(--space-4) var(--space-5);
        margin: 0;
    }

    &__item {
        min-width: 0;
    }

    &__term {
        color: var(--color-text-muted);
        font-size: var(--font-size-s);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    &__value {
        margin: var(--space-1) 0 0;
        overflow-wrap: anywhere;

        &_empty {
            color: var(--color-text-muted);
            font-style: italic;
        }
    }

    &__link {
        color: var(--color-link);
    }
}
</style>
