<template>
	<div id="dashvue" class="antialiased bg-gray-900">
		<div class="md:flex flex-col md:flex-row md:min-h-screen w-full">
			<div class="flex flex-col md:fixed md:h-screen w-full md:w-48 text-gray-200 bg-gray-800 flex-shrink-0">
				<div class="flex-shrink-0 px-8 md:px-3 py-3 flex flex-row items-center justify-between">
					<router-link to="/" class="text-lg font-semibold tracking-widest uppercase rounded-lg text-white focus:outline-none focus:shadow-outline">
						Speculare
					</router-link>
					<button class="rounded-lg md:hidden focus:outline-none focus:shadow-outline" aria-label="menu" @click="open = !open">
						<svg fill="currentColor" viewBox="0 0 20 20" class="w-6 h-6">
							<path v-if="!open" fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clip-rule="evenodd" />
							<path v-if="open" fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
					</button>
				</div>
				<nav :class="{'block': open, 'hidden': !open}" class="flex-grow md:block pl-4 pr-4 md:pr-0 pb-4 md:pb-0 md:overflow-y-auto">
					<router-link v-slot="{ href, navigate, isExactActive }" to="/hosts" custom>
						<a :href="href" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold rounded-l-lg rounded-r-lg md:rounded-r-none hover:bg-gray-600 hover:text-gray-100"
							:class="[isExactActive ? 'bg-gray-600 text-gray-100' : 'text-gray-400']" @click="navigate">
							<svg class="h-6 w-6 mr-3" :class="[isExactActive ? 'text-green-300' : '']">
								<use xlink:href="@/assets/imgs/list.svg#list" />
							</svg>
							<div>Hosts list</div>
						</a>
					</router-link>
					<router-link v-slot="{ href, navigate, isExactActive }" to="/alarms" custom>
						<a :href="href" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold rounded-l-lg rounded-r-lg md:rounded-r-none hover:bg-gray-600 hover:text-gray-100"
							:class="[isExactActive ? 'bg-gray-600 text-gray-100' : 'text-gray-400']" @click="navigate">
							<svg class="h-6 w-6 mr-3" :class="[isExactActive ? 'text-green-300' : '']">
								<use xlink:href="@/assets/imgs/notifications.svg#notifications" />
							</svg>
							<div>Alarms</div>
						</a>
					</router-link>
					<router-link v-slot="{ href, navigate, isExactActive }" to="/incidents" custom>
						<a :href="href" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold rounded-l-lg rounded-r-lg md:rounded-r-none hover:bg-gray-600 hover:text-gray-100"
							:class="[isExactActive ? 'bg-gray-600 text-gray-100' : 'text-gray-400']" @click="navigate">
							<svg class="h-6 w-6 mr-3" :class="[isExactActive ? 'text-green-300' : '']">
								<use xlink:href="@/assets/imgs/incidents.svg#incidents" />
							</svg>
							<div>Incidents</div>
						</a>
					</router-link>
					<router-link v-slot="{ href, navigate, isExactActive }" to="/settings" custom>
						<a :href="href" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold rounded-l-lg rounded-r-lg md:rounded-r-none hover:bg-gray-600 hover:text-gray-100"
							:class="[isExactActive ? 'bg-gray-600 text-gray-100' : 'text-gray-400']" @click="navigate">
							<svg class="h-6 w-6 mr-3" :class="[isExactActive ? 'text-green-300' : '']">
								<use xlink:href="@/assets/imgs/settings.svg#settings" />
							</svg>
							<div>Settings</div>
						</a>
					</router-link>
				</nav>
			</div>

			<div class="w-full md:ml-48 px-4 pt-4 md:px-12 md:pt-12 overflow-x-auto">
				<router-view />
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Dashvue',

	data () {
		return {
			open: false
		}
	}
}
</script>
