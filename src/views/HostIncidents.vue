<template>
	<div class="details">
		<div role="section" class="mt-4 md:mt-8">
			<h3 class="text-2xl text-gray-100 mb-4">
				Incidents
			</h3>
			<div class="shadow overflow-hidden border-gray-200 rounded-lg mb-8">
				<div class="overflow-x-auto">
					<table class="w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Alert ID - Name
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Query - Result - Trigger
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Severity
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							<tr v-for="item in incidentsList" :key="item.id">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div>
											<div class="text-sm font-medium text-gray-900">
												#{{ item.id }} - {{ item.alerts_name }}
											</div>
											<div class="text-sm text-gray-500">
												{{ item.alerts_info || item.alerts_lookup }}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{{ item.alerts_lookup }}
									</div>
									<div class="text-sm text-gray-500">
										The query returned:
										<span v-if="item.severity == 0" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
											{{ formatFloat(item.result) }}
										</span>
										<span v-if="item.severity == 1" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
											{{ formatFloat(item.result) }}
										</span>
										with trigger points of <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{{ item.alerts_warn }}</span> and <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{{ item.alerts_crit }}</span>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span v-if="item.severity == 0" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
										Warning
									</span>
									<span v-if="item.severity == 1" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
										Critical
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									<span v-if="item.resolved_at" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
										Resolved
									</span>
									<span v-if="!item.resolved_at" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
										Ongoing
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { nextTick } from '@vue/runtime-core'
import axios from 'axios'
import moment from 'moment'
import { reactive } from 'vue'

export default {
	name: 'DetailsI',

	data () {
		return {
			incidentsList: reactive([]),
			fetchingDone: false,
			connection: null,
			wsBuffer: []
		}
	},

	mounted: function () {
		const vm = this

		nextTick(() => {
			if (vm.connection === null) {
				console.log('[incidents] > Setting a new websocket')
				vm.connection = new WebSocket(vm.$wsBaseUrl + '/ws?query=*:incidents:host_uuid.eq.' + vm.$route.params.uuid)
			}
			vm.connection.addEventListener('open', function () {
				console.log('[incidents] >> webSocket opened')
				axios.get(vm.$apiAlertsUrl + '/api/incidents?uuid=' + vm.$route.params.uuid)
					.then(resp => {
						const dataLenght = resp.data.length
						for (let i = 0; i <= dataLenght - 1; i++) {
							console.log(resp.data[i])
							vm.incidentsList.push(resp.data[i])
						}

						const wsBuffSize = vm.wsBuffer.length
						if (wsBuffSize > 0) {
							console.log('[cputimes] >>> Merging wsBuffer with already added data')
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								const currItem = vm.wsBuffer[i]
								const idx = vm.incidentsList.findIndex((e) => e.id === currItem.id)
								// Basic check if we found an occur
								if (idx === -1) { vm.incidentsList.push(currItem) } else { vm.incidentsList[idx] = currItem }
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
					result: val[1],
					started_at: val[2],
					updated_at: val[3],
					resolved_at: val[4],
					host_uuid: val[5],
					hostname: val[6],
					status: val[7],
					severity: val[8],
					alerts_id: val[9],
					alerts_name: val[10],
					alerts_table: val[11],
					alerts_lookup: val[12],
					alerts_warn: val[13],
					alerts_crit: val[14],
					alerts_info: val[15],
					alerts_where_clause: val[16]
				}

				console.log('[incidents] >> new message', newValues)
				if (vm.fetchingDone) {
					// Add normally (push) but check if we already have it
					const idx = vm.incidentsList.findIndex((e) => e.id === newValues.id)
					// Basic check if we found an occur
					if (idx === -1) { vm.incidentsList.push(newValues) } else { vm.incidentsList[idx] = newValues }
				} else {
					// Add to WsBuffer and merge after the inital fetch
					console.log('[incidents] >> Adding value to the wsBuffer (WS opened but fetching not done yet)')
					vm.wsBuffer.push(newValues)
				}
			})
		})
	},

	beforeUnmount: function () {
		// Close the webSocket connection
		this.wsBuffer = []
		this.incidentsList = []
		if (this.connection != null) {
			console.log('[incidents] > Closing the websocket')
			this.connection.close()
			this.connection = null
		}
	},

	methods: {
		formatDate: function (date) {
			const prev = moment(date)

			return prev.fromNow()
		},
		formatFloat: function (floating) {
			return parseFloat(floating).toFixed(2)
		}
	}
}
</script>
