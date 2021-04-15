import Vue from 'vue'
import VueRouter from 'vue-router'
import Dashboard from '@/layouts/Dashboard.vue'
import Home from '@/views/Home.vue'

Vue.use(VueRouter)

const routes = [{
        path: '*',
        component: () =>
            import ('@/views/NotFound.vue')
    },
    {
        path: '/',
        component: Dashboard,
        children: [{
            path: '/',
            component: Home
        }, {
            path: '/hosts',
            component: () =>
                import ('@/views/Hosts.vue'),
        }, {
            path: '/alerts',
            component: () =>
                import ('@/views/Alerts.vue')
        }, {
            path: '/settings',
            component: () =>
                import ('@/views/Settings.vue')
        }, {
            path: '/h/:uuid',
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

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router