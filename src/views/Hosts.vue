<template>
	<h2 v-if="$store.state.category.length" class="text-lg font-medium leading-normal mb-4 text-gray-200">
		Groups
	</h2>
	<div v-if="$store.state.category.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:xl:grid-cols-5 gap-4 mb-8">
		<div v-for="item in $store.state.category" :key="item.id" class="flex items-center text-gray-200 bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg hover:bg-gray-600 hover:text-gray-100">
			<div class="flex justify-center items-center rounded-full w-12 h-12" style="background-color: #004878">
				<img :src="require('@/assets/imgs/server.svg')"
					:alt="item.system"
					class="w-6 h-8"
					width="2rem"
					height="2rem">
			</div>
			<div class="py-1 ml-4">
				<h3 class="font-medium">
					{{ item.name }}
				</h3>
				<p class="text-sm text-gray-400">
					{{ item.nhosts }} {{ $filters.pluralize('Host', item.nhosts) }}
				</p>
			</div>
		</div>
	</div>

	<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">
		Hosts
	</h2>
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:xl:grid-cols-5 gap-4 mb-8">
		<!-- Dummy item while the real data is loading -->
		<div v-if="!$store.state.hosts_values.length" class="shimming flex items-center overflow-hidden bg-gray-800 relative shadow py-3 rounded-lg">
			<div class="ml-4 bg-gray-700 rounded-full w-12 h-12" />
			<div class="py-1 ml-4">
				<div class="w-28 h-5 rounded-sm bg-gray-700" />
				<div class="w-16 h-4 rounded-sm bg-gray-700 mt-2" />
			</div>
		</div>
		<!-- Real data, will take the lead once loaded -->
		<router-link v-for="item in $store.state.hosts_values" :key="item.uuid" :to="{ name: 'hosts_details', params: { hostname: item.hostname, uuid: item.uuid} }">
			<div class="flex items-center text-gray-200 bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg hover:bg-gray-600 hover:text-gray-100">
				<div class="flex justify-center items-center rounded-full w-12 h-12" style="background-color: #004878">
					<img :src="require('@/assets/imgs/server.svg')"
						:alt="item.system"
						class="w-6 h-8"
						width="2rem"
						height="2rem">
				</div>
				<div class="py-1 ml-4">
					<h3 class="font-medium">
						{{ item.hostname }}
					</h3>
					<p class="text-sm text-gray-400">
						{{ item.uptime }}
					</p>
				</div>
			</div>
		</router-link>
	</div>
</template>

<script>
export default {
	name: 'Hosts'
}
</script>
