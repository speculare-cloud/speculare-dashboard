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
        name: 'Home',
        component: Dashboard,
        children: [{
            path: '/',
            component: Home
        }, {
            path: '/h/:uuid',
            // route level code-splitting
            component: () =>
                import ('@/views/Details.vue')
        }]
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router