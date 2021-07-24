<template>
	<div id="main_app">
		<router-view />
	</div>
</template>

<script>
import { nextTick } from 'vue'
import axios from 'axios'

export default {
	name: 'App',

	data () {
		return {
			connection: null
		}
	},

	mounted: function () {
		const vm = this

		// Don't setup anything before everything is rendered
		nextTick(() => {
			// Get initial list of hosts (don't wait for websocket to add them at first)
			// If we wait for the websocket this would take a long time...
			axios
				.get(vm.$apiBaseUrl + '/api/hosts')
				.then(resp => {
					resp.data.forEach(elem => {
						// Construct newObj to add to the list
						const newObj = {
							system: elem.system,
							os_version: elem.os_version,
							hostname: elem.hostname,
							uptime: vm.secondsToDhms(elem.uptime),
							uuid: elem.uuid,
							created_at: elem.created_at
						}
						vm.addOrUpdateHost(newObj)
					})
				})
				.catch(error => {
					console.log('[HOSTS] Failed to fetch list of HOSTS', error)
				})

			// Init and listen to websocket
			vm.handleWebSocket()
		})
	},

	beforeUnmount: function () {
		const vm = this

		// Close the webSocket connection
		console.log('[HOSTS] %cClosing %cthe WebSocket connection', 'color:red;', 'color:white;')
		vm.connection.close()
		vm.connection = null
	},

	methods: {
		secondsToDhms: function (seconds) {
			const d = Math.floor(seconds / (3600 * 24))
			const h = Math.floor(seconds % (3600 * 24) / 3600)
			const m = Math.floor(seconds % 3600 / 60)
			const s = Math.floor(seconds % 60)

			const dDisplay = d > 0 ? d + 'd ' : ''
			const hDisplay = h > 0 ? h.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + 'h ' : '00h '
			const mDisplay = m > 0 ? m.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + 'm ' : '00m '
			const sDisplay = s > 0 ? s.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + 's' : '00s'
			return dDisplay + hDisplay + mDisplay + sDisplay
		},
		handleWebSocket: function () {
			const vm = this

			// Init the websocket for changes in the hosts list
			console.log('[HOSTS] %cStarting %cconnection to WebSocket Server', 'color:green;', 'color:white;')
			if (vm.connection == null) {
				console.log('[HOSTS] > Setting a new webSocket')
				vm.connection = new WebSocket(vm.$wsBaseUrl + '/ws?query=update:hosts')
			}
			vm.connection.addEventListener('message', vm.wsMessageHandle)
		},
		wsMessageHandle: function (event) {
			const vm = this

			// Parse the data and extract newValue
			const json = JSON.parse(event.data)
			const newValues = json.columnvalues
			// Construct the newObj from the values (it's the hosts table)
			const newObj = {
				system: newValues[0],
				os_version: newValues[1],
				hostname: newValues[2],
				uptime: vm.secondsToDhms(newValues[3]),
				uuid: newValues[4],
				created_at: newValues[5]
			}
			vm.addOrUpdateHost(newObj)
		},
		addOrUpdateHost: function (newObj) {
			const vm = this
			const store = vm.$store

			// Find at which position the UUID is currently present
			const objIndex = store.state.hosts_values.findIndex(obj => obj.uuid === newObj.uuid)
			// If not found, we push it
			if (objIndex === -1) {
				store.commit({ type: 'pushHosts', newdata: newObj })
				// Else we update the value
			} else {
				store.commit({ type: 'updateHosts', index: objIndex, newdata: newObj })
			}
		}
	}
}
</script>
