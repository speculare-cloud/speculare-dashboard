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
import axios from 'axios';

export default {
	name: 'Hosts',

	data: function() {
		return {
			connection: null
		}
	},

	mounted: function() {		
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			// Get initial list of hosts (don't wait for websocket to add them at first)
			// If we wait for the websocket this would take a long time...
			axios
				.get('https://server.speculare.cloud:9640/api/hosts')
				.then(resp => {
					resp.data.forEach(elem => {
						// Construct newObj to add to the list
						let newObj = {
							os: elem.os,
							hostname: elem.hostname,
							uptime: vm.secondsToDhms(elem.uptime),
							uuid: elem.uuid,
							created_at: elem.created_at,
						};
						vm.addOrUpdateHost(newObj)
					});
				})
				.catch(error => {
					console.log("[HOSTS] Failed to fetch list of HOSTS", error);
				});
			
			// Init and listen to websocket
			vm.handleWebSocket();
		});
	},

	beforeDestroy: function() {
		let vm = this;
		
		// Close the webSocket connection
		console.log("[HOSTS] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		vm.connection.close();
		vm.connection = null;
	},

	methods: {
		secondsToDhms: function(seconds) {
			const d = Math.floor(seconds / (3600*24));
			const h = Math.floor(seconds % (3600*24) / 3600);
			const m = Math.floor(seconds % 3600 / 60);
			const s = Math.floor(seconds % 60);

			const dDisplay = d > 0 ? d + "d " : "";
			const hDisplay = h > 0 ? h + "h " : "";
			const mDisplay = m > 0 ? m + "m " : "";
			const sDisplay = s > 0 ? s + "s" : "";
			return dDisplay + hDisplay + mDisplay + sDisplay;
		},
		handleWebSocket: function() {
			let vm = this;

			// Init the websocket for changes in the hosts list
			console.log("[HOSTS] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[HOSTS] > Setting a new webSocket");
				vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=hosts");
			}
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			let vm = this;

			// Parse the data and extract newValue
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
			vm.addOrUpdateHost(newObj)
		},
		addOrUpdateHost: function(newObj) {
			let vm = this;
			let store = vm.$store;

			// Find at which position the UUID is currently present
			let objIndex = store.state.hosts_values.findIndex((obj => obj.uuid == newObj.uuid));
			// If not found, we push it
			if (objIndex == -1) {
				store.commit({type: 'pushHosts', newdata: newObj});
			// Else we update the value
			} else {
				store.commit({type: 'updateHosts', index: objIndex, newdata: newObj});
			}
		}
	}
}
</script>