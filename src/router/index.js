import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '@/layouts/Dashboard.vue'
import Workspaces from '@/views/Workspaces.vue'

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
			import('@/views/WorkspaceOverview.vue')
	},
	{
		path: 'h/:hostname/:uuid',
		name: 'hosts_details',
		component: () =>
			import('@/views/Host.vue'),
		redirect: ({ name: 'hosts_details_o' }),
		children: [{
			path: 'o',
			name: 'hosts_details_o',
			component: () =>
				import('@/views/HostOverview.vue')
		},
		{
			path: 'd',
			name: 'hosts_details_d',
			component: () =>
				import('@/views/HostDetails.vue')
		},
		{
			path: 'a',
			name: 'hosts_details_a',
			component: () =>
				import('@/views/HostAlerts.vue')
		},
		{
			path: 'i',
			name: 'hosts_details_i',
			component: () =>
				import('@/views/HostIncidents.vue')
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
