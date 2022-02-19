import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '@/layouts/Dashboard.vue'
import Workspaces from '@/views/workspaces/Workspaces.vue'

const routes = [{
	path: '/:pathMatch(.*)*',
	component: () =>
		import('@/views/NotFound.vue')
},
{
	path: '/',
	component: Workspaces
},
{
	path: '/w/:slug',
	name: 'workspace',
	component: Dashboard,
	redirect: ({
		name: 'workspace_overview'
	}),
	children: [{
		path: 'home',
		name: 'workspace_overview',
		component: () =>
			import('@/views/workspaces/Overview.vue')
	},
	{
		path: 'h/:hostname/:uuid',
		name: 'hosts_details',
		component: () =>
			import('@/views/hosts/Base.vue'),
		redirect: ({ name: 'hd_details' }),
		children: [{
			path: 'details',
			name: 'hd_details',
			component: () =>
				import('@/views/hosts/Details.vue')
		},
		{
			path: 'alerts',
			name: 'hd_alerts',
			component: () =>
				import('@/views/hosts/Alerts.vue')
		},
		{
			path: 'incidents',
			name: 'hd_incidents',
			component: () =>
				import('@/views/hosts/Incidents.vue')
		}
		]
	}
	]
}
]

export const router = createRouter({
	history: createWebHistory(),
	routes
})
