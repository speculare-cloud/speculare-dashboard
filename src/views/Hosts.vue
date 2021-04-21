<template>
	<div class="hosts">
		<h2 v-if="this.$store.state.category.length" class="text-lg font-medium leading-normal mb-4 text-gray-200">Groups</h2>
		<div v-if="this.$store.state.category.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:xl:grid-cols-5 gap-4 mb-8">
			<div v-for="item in this.$store.state.category" v-bind:key="item.id" class="flex items-center text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200">
				<div class="flex justify-center items-center rounded-full w-12 h-12" v-bind:style="{ backgroundColor: item.color }">
					<span class="h-6 w-6 material-icons cursor-default">
						{{ item.icon }}
					</span>
				</div>
				<div class="py-1 ml-4">
					<h3 class="font-medium">{{ item.name }}</h3>
					<p class="text-sm text-gray-400">{{ item.nhosts }} {{ 'Host' | pluralize(item.nhosts) }}</p>
				</div>
			</div>
		</div>

		<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">Hosts</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:xl:grid-cols-5 gap-4 mb-8">
			<!-- Dummy item while the real data is loading -->
			<div v-if="!this.$store.state.hosts_values.length" class="shimming flex items-center overflow-hidden bg-white dark-mode:bg-gray-800 relative shadow py-3 rounded-lg">
				<div class="ml-4 bg-gray-700 rounded-full w-12 h-12">
				</div>
				<div class="py-1 ml-4">
					<div class="w-28 h-5 rounded-sm bg-gray-700"></div>
					<div class="w-16 h-4 rounded-sm bg-gray-700 mt-2"></div>
				</div>
			</div>
			<!-- Real data, will take the lead once loaded -->
			<router-link v-for="item in this.$store.state.hosts_values" v-bind:key="item.uuid" :to="{ name: 'hosts_details', params: { hostname: item.hostname, uuid: item.uuid} }" v-slot="{ href, navigate }" custom>
				<a :href="href" @click="navigate">
					<div class="flex items-center text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200">
						<div class="flex justify-center items-center bg-green-400 rounded-full w-12 h-12">
							<img src="../assets/imgs/os/ubuntu.svg" class="w-10 h-10" />
						</div>
						<div class="py-1 ml-4">
							<h3 class="font-medium">{{ item.hostname }}</h3>
							<p class="text-sm text-gray-400">{{ item.uptime }}</p>
						</div>
					</div>
				</a>
			</router-link>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Hosts',
}
</script>