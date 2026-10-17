<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <div class="app">
        <header class="app-header">
            <div class="app-header__inner">
                <RouterLink to="/" class="app-header__brand">Memorial editor</RouterLink>
                <nav class="app-header__nav" aria-label="Main">
                    <RouterLink
                        :to="{ name: 'memorial.create' }"
                        class="app-header__link"
                        exact-active-class="app-header__link_active"
                    >
                        New memorial
                    </RouterLink>
                </nav>
            </div>
        </header>

        <main class="app__main">
            <RouterView />
        </main>
    </div>
</template>

<style lang="scss">
@use '@/styles/breakpoints' as *;

.app {
    min-height: 100dvh;

    &__main {
        width: min(100% - 2 * var(--space-5), var(--content-width));
        margin: var(--space-6) auto;

        @include mobile {
            width: calc(100% - 2 * var(--space-4));
            margin-block: var(--space-5);
        }
    }
}

.app-header {
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);

    &__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
        width: min(100% - 2 * var(--space-5), var(--content-width));
        min-height: 3.5rem;
        margin: 0 auto;

        @include mobile {
            width: calc(100% - 2 * var(--space-4));
        }
    }

    &__brand {
        color: var(--color-text);
        font-family: var(--font-serif);
        font-size: var(--font-size-l);
        font-weight: 600;
        text-decoration: none;
    }

    &__link {
        color: var(--color-link);
        font-weight: 500;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }

        &_active {
            color: var(--color-text);
        }
    }
}
</style>
