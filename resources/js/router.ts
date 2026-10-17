import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router';
import HomePage from '@/pages/HomePage.vue';
import MemorialCreatePage from '@/pages/MemorialCreatePage.vue';
import MemorialPage from '@/pages/MemorialPage.vue';

const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: HomePage },
    { path: '/memorials/new', name: 'memorial.create', component: MemorialCreatePage },
    {
        path: '/memorials/:id(\\d+)',
        name: 'memorial.show',
        component: MemorialPage,
        props: (route) => ({ id: Number(route.params.id) }),
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
];

export function createAppRouter(history: RouterHistory = createWebHistory()) {
    return createRouter({ history, routes });
}
