<template>
	<div id="dashvue" class="antialiased bg-core">
		<div class="md:flex flex-col md:flex-row md:min-h-screen w-full">
			<div class="flex flex-col md:fixed md:h-screen w-full md:w-56 text-gray-200 bg-side flex-shrink-0">
				<div class="flex-shrink-0 px-8 md:px-4 py-4 flex flex-row items-center justify-between">
					<router-link to="/" class="text-xl font-normal tracking-widest rounded-lg text-white focus:outline-none focus:shadow-outline">
						S<span class="text-green-400">p</span>
					</router-link>
					<button class="rounded-lg md:hidden focus:outline-none focus:shadow-outline" aria-label="menu" @click="open = !open">
						<svg fill="currentColor" viewBox="0 0 20 20" class="w-6 h-6">
							<path v-if="!open" fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clip-rule="evenodd" />
							<path v-if="open" fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
					</button>
				</div>
				<div class="px-8 md:px-4 pt-3 pb-7 flex flex-row justify-start align-middle">
					<img src="https://eu.ui-avatars.com/api/?name=W+O&size=24&background=random">
					<router-link :key="this.$route.params.slug" :to="{ name: 'workspace', params: { slug: this.$route.params.slug } }">
						<div class="ml-2 text-sm" style="line-height:24px">
							Workspace {{ this.$route.params.slug }}
						</div>
					</router-link>
				</div>
				<nav id="main-sidenav" :class="{'block': open, 'hidden': !open}" class="flex-grow md:block pl-4 pr-4 md:pr-0 pb-4 md:pb-0 md:overflow-y-auto">
					<p class="text-green-400 text-sm font-medium mb-4">
						SERVERS <span class="ml-1 text-green-200 font-normal">{{ $store.state.hosts_values.length }}</span>
					</p>

					<router-link class="text-gray-400 flex items-center pr-2 py-1 mt-2 font-medium text-xsm uppercase hover:text-gray-100"
						v-for="item in $store.state.hosts_values" :key="item.uuid" :to="{ name: 'hosts_details', params: { hostname: item.hostname, uuid: item.uuid} }">
						<div>{{ item.hostname }}</div>
					</router-link>
				</nav>
			</div>

			<div class="w-full md:ml-52 px-4 md:px-12 md:pr-6 pt-8 md:pt-18 overflow-x-auto">
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
