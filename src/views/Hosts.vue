<template>
	<div class="hosts">
		<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">Groups</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:xl:grid-cols-5 gap-4 mb-8">
			<div class="flex items-center text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200">
				<div class="flex justify-center items-center bg-red-400 rounded-full w-12 h-12">
					<span class="h-6 w-6 material-icons cursor-default">
						dns
					</span>
				</div>
				<div class="py-1 ml-4">
					<h3 class="font-medium">Proxy-servers</h3>
					<p class="text-sm text-gray-400">1 Hosts</p>
				</div>
			</div>
			<div class="flex items-center text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200">
				<div class="flex justify-center items-center bg-yellow-400 rounded-full w-12 h-12">
					<span class="h-6 w-6 material-icons cursor-default">
						games
					</span>
				</div>
				<div class="py-1 ml-4">
					<h3 class="font-medium">Game-servers</h3>
					<p class="text-sm text-gray-400">3 Hosts</p>
				</div>
			</div>
			<div class="flex items-center text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200">
				<div class="flex justify-center items-center bg-green-400 rounded-full w-12 h-12">
					<span class="h-6 w-6 material-icons cursor-default">
						leak_add
					</span>
				</div>
				<div class="py-1 ml-4">
					<h3 class="font-medium">Vpn-servers</h3>
					<p class="text-sm text-gray-400">1 Hosts</p>
				</div>
			</div>
			<div class="flex items-center text-gray-700 bg-white dark-mode:text-gray-200 dark-mode:bg-gray-800 relative shadow px-4 py-3 rounded-lg hover:shadow-lg dark-mode:hover:bg-gray-600 dark-mode:hover:text-gray-100 hover:text-gray-900 hover:bg-gray-200">
				<div class="flex justify-center items-center bg-blue-400 rounded-full w-12 h-12">
					<span class="h-6 w-6 material-icons cursor-default">
						extension
					</span>
				</div>
				<div class="py-1 ml-4">
					<h3 class="font-medium">App-servers</h3>
					<p class="text-sm text-gray-400">2 Hosts</p>
				</div>
			</div>
		</div>

		<h2 class="text-lg font-medium leading-normal mb-4 text-gray-200">Hosts</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:xl:grid-cols-5 gap-4 mb-8">
			<router-link v-for="item in this.$store.state.hosts_values" v-bind:key="item.uuid" :to="'/h/' + item.uuid" v-slot="{ href, navigate }" custom>
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
	connection: null,

	created: function() {		
		let vm = this;
		let store = vm.$store;
		
		if (vm.connection == null) {
			console.log("[HOSTS] Starting connection to WebSocket Server");
			vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=hosts");
		}

		vm.connection.onmessage = function(event) {
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			// Construct the newObj from the values (it's the hosts table)
			let newObj = {
				os: newValues[0],
				hostname: newValues[1],
				uptime: vm.secondsToDhms(newValues[2]),
				uuid: newValues[3],
				created_at: newValues[4],
			};
			// Find at which position the UUID is currently present
			let objIndex = store.state.hosts_values.findIndex((obj => obj.uuid == newObj.uuid));
			// If not found, we push it
			if (objIndex == -1) {
				store.commit({type: 'pushHosts', newdata: newObj});
			// Else we update the value
			} else {
				store.commit({type: 'updateHosts', index: objIndex, newdata: newObj});
			}
			if (store.state.hosts_loading) {
				store.state.hosts_loading = false;
			}
		}
	},

	methods: {
		// TODO - Rework
		secondsToDhms: function(s) {
			const d = Math.floor(s / (3600 * 24));
			s  -= d * 3600 * 24;
			const h = Math.floor(s / 3600);
			s  -= h * 3600;
			const m = Math.floor(s / 60);
			s  -= m * 60;
			const tmp = [];
			
			(d) && tmp.push(d + 'd');
			(d || h) && tmp.push(h + 'h');
			(d || h || m) && tmp.push(m + 'm');
			tmp.push(s + 's');
			return tmp.join(' ');
		}
	},

	beforeDestroy: function() {
		console.log("[HOSTS] Closing the WebSocket connection");
		this.connection.close();
		this.connection = null;
	}
}
</script>