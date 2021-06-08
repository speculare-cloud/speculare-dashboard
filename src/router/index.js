import VueRouter from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/layouts/Dashboard.vue'

const routes = [{
        path: '/:pathMatch(.*)*',
        component: () =>
            import ('@/views/NotFound.vue')
    },
    {
        path: '/',
        component: Dashboard,
        children: [{
            path: '/',
            redirect: '/hosts'
        }, {
            path: '/hosts',
            component: () =>
                import ('@/views/Hosts.vue'),
        }, {
            path: '/alarms',
            component: () =>
                import ('@/views/Alarms.vue')
        }, {
            path: '/settings',
            component: () =>
                import ('@/views/Settings.vue')
        }, {
            path: '/h/:hostname/:uuid',
            name: 'hosts_details',
            component: () =>
                import ('@/views/Details.vue'),
            meta: {
                breadcrumb: [
                    { name: 'Hosts', link: 'hosts' }
                ]
            }
        }]
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})