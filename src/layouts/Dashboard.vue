<template>
	<div id="dashvue" class="antialiased bg-gray-100 dark-mode:bg-gray-900">
		<div class="md:flex flex-col md:flex-row md:min-h-screen w-full">
			<div class="flex flex-col w-full md:w-48 text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 flex-shrink-0">
				<div class="flex-shrink-0 px-8 md:px-0 py-4 flex flex-row items-center justify-between md:justify-center">
					<a href="#" class="text-lg font-semibold tracking-widest text-gray-900 uppercase rounded-lg dark-mode:text-white focus:outline-none focus:shadow-outline">
						Speculare
					</a>
					<button class="rounded-lg md:hidden focus:outline-none focus:shadow-outline" @click="open = !open">
						<svg fill="currentColor" viewBox="0 0 20 20" class="w-6 h-6">
							<path v-if="!open" fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clip-rule="evenodd"></path>
							<path v-if="open" fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
						</svg>
					</button>
				</div>
				<nav :class="{'block': open, 'hidden': !open}" class="flex-grow md:block pl-4 pr-4 md:pr-0 pb-4 md:pb-0 md:overflow-y-auto">
					<router-link to="/" v-slot="{ href, navigate, isExactActive }" custom>
						<a :href="href" @click="navigate" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold text-gray-900 rounded-l-lg rounded-r-lg md:rounded-r-none dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200" :class="[isExactActive ? 'dark-mode:bg-gray-600 dark-mode:text-gray-100' : 'dark-mode:text-gray-400']">
							<span class="h-6 w-6 mr-3 material-icons" :class="[isExactActive ? 'text-green-300' : '']">
								home
							</span>
							<div>Home</div>
						</a>
					</router-link>
					<router-link to="/hosts" v-slot="{ href, navigate, isExactActive }" custom>
						<a :href="href" @click="navigate" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold text-gray-900 rounded-l-lg rounded-r-lg md:rounded-r-none dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200" :class="[isExactActive ? 'dark-mode:bg-gray-600 dark-mode:text-gray-100' : 'dark-mode:text-gray-400']">
							<span class="h-6 w-6 mr-3 material-icons" :class="[isExactActive ? 'text-green-300' : '']">
								format_list_bulleted
							</span>
							<div>Hosts list</div>
						</a>
					</router-link>
					<router-link to="/alerts" v-slot="{ href, navigate, isExactActive }" custom>
						<a :href="href" @click="navigate" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold text-gray-900 rounded-l-lg rounded-r-lg md:rounded-r-none dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200" :class="[isExactActive ? 'dark-mode:bg-gray-600 dark-mode:text-gray-100' : 'dark-mode:text-gray-400']">
							<span class="h-6 w-6 mr-3 material-icons" :class="[isExactActive ? 'text-green-300' : '']">
								notifications
							</span>
							<div>Alerts</div>
						</a>
					</router-link>
					<router-link to="/settings" v-slot="{ href, navigate, isExactActive }" custom>
						<a :href="href" @click="navigate" class="flex items-center pl-2 pr-2 md:pr-0 py-2 mt-2 text-sm font-semibold text-gray-900 rounded-l-lg rounded-r-lg md:rounded-r-none dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200" :class="[isExactActive ? 'dark-mode:bg-gray-600 dark-mode:text-gray-100' : 'dark-mode:text-gray-400']">
							<span class="h-6 w-6 mr-3 material-icons" :class="[isExactActive ? 'text-green-300' : '']">
								settings
							</span>
							<div>Settings</div>
						</a>
					</router-link>
				</nav>
			</div>

			<div class="w-full px-4 pt-4 md:px-12 md:pt-12">
				<router-view/>
			</div>
        </div>
	</div>
</template>

<script>
export default {
	name: 'Dashvue',
	
	data() {
		return {
			open: false
		};
	},
}
</script>