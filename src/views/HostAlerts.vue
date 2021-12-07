<template>
	<div class="details">
		<div role="section" class="mt-4 md:mt-8">
			<div class="w-100 text-gray-100">
				<div class="flex mt-4 w-100 space-x-4">
					<div v-for="item in alertsList" :key="item.id"
						class="w-full md:w-max bg-side rounded-lg shadow-lg p-4">
						<div class="flex justify-between">
							<h4 class="text-base self-center">
								{{ item.name }}
							</h4>
							<div class="flex space-x-3">
								<span class="bg-purple-600 py-1 px-2 text-xs rounded-full">{{ item.timing }}"</span>
								<!-- TODO: Improve the tooltip -->
								<div v-if="item.info" class="relative flex flex-col items-center group self-center">
									<span class="leading-none block">
										<span class="cursor-pointer bg-blue-500 py-1 px-2 text-xs rounded-full">?</span>
									</span>
									<div class="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
										<!-- TODO: Change the orientation if we're on mobile -->
										<span class="relative z-50 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg" style="margin-left: calc(100% + 6rem); margin-bottom: -10rem; max-width: 10rem; min-width: calc(100% + 4rem);">
											{{ item.info }}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div class="mt-4 space-y-2">
							<code class="w-full block px-2">$table = {{ item.table }}</code>
							<code class="w-full block px-2">$this = {{ item.lookup }}</code>
							<code class="w-full block px-2" v-if="item.where_clause">$where = {{ item.where_clause }}</code>
							<code class="w-full block p-2"><span class="bg-yellow-600 rounded-lg p-1">$warn</span> = {{ item.warn }}</code>
							<code class="w-full block p-2"><span class="bg-red-600 rounded-lg p-1">$crit</span> = {{ item.crit }}</code>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { nextTick } from '@vue/runtime-core'
import axios from 'axios'
import { reactive } from 'vue'

export default {
	name: 'DetailsO',

	data () {
		return {
			alertsList: reactive([]),
			fetchingDone: false,
			connection: null,
			wsBuffer: []
		}
	},

	mounted: function () {
		const vm = this

		nextTick(() => {
			if (vm.connection === null) {
				console.log('[alerts] > Setting a new websocket')
				vm.connection = new WebSocket(vm.$wsBaseUrl + '/ws?query=*:alerts:host_uuid.eq.' + vm.$route.params.uuid)
			}
			vm.connection.addEventListener('open', function () {
				console.log('[alerts] >> webSocket opened')
				axios.get(vm.$apiAlertsUrl + '/api/alerts?uuid=' + vm.$route.params.uuid)
					.then(resp => {
						const dataLength = resp.data.length
						for (let i = 0; i <= dataLength - 1; i++) {
							console.log(resp.data[i])
							vm.alertsList.push(resp.data[i])
						}

						const wsBuffSize = vm.wsBuffer.length
						if (wsBuffSize > 0) {
							console.log('[alerts] >>> Merging wsBuffer with already added data')
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								const currItem = vm.wsBuffer[i]
								const idx = vm.alertsList.findIndex((e) => e.id === currItem.id)
								// Basic check if we found an occur
								if (idx === -1) { vm.alertsList.push(currItem) } else { vm.alertsList[idx] = currItem }
							}
						}

						// Define the fetching as done
						vm.fetchingDone = true
						// Clear the wsBuffer
						this.wsBuffer = []
					})
			})
			// Setup onmessage listener
			vm.connection.addEventListener('message', function (event) {
				const json = JSON.parse(event.data)
				const val = json.columnvalues
				// Convert it to a easy usable object
				const newValues = {
					id: val[0],
					name: val[1],
					table: val[2],
					lookup: val[3],
					timing: val[4],
					warn: val[5],
					crit: val[6],
					info: val[7],
					host_uuid: val[8],
					hostname: val[9],
					where_clause: val[10]
				}

				console.log('[alerts] >> new message', newValues)
				if (vm.fetchingDone) {
					// Add normally (push) but check if we already have it
					const idx = vm.alertsList.findIndex((e) => e.id === newValues.id)
					// Basic check if we found an occur
					if (idx === -1) { vm.alertsList.push(newValues) } else { vm.alertsList[idx] = newValues }
				} else {
					// Add to WsBuffer and merge after the initial fetch
					console.log('[alerts] >> Adding value to the wsBuffer (WS opened but fetching not done yet)')
					vm.wsBuffer.push(newValues)
				}
			})
		})
	},

	beforeUnmount: function () {
		// Close the webSocket connection
		this.wsBuffer = []
		this.alertsList = []
		if (this.connection != null) {
			console.log('[alerts] > Closing the websocket')
			this.connection.close()
			this.connection = null
		}
	}
}
</script>
