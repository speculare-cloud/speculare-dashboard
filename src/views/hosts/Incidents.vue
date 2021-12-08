<template>
	<div class="details">
		<div role="section" class="mt-4 md:mt-8">
			<div class="shadow overflow-hidden border-gray-200 rounded-lg mb-8">
				<div class="overflow-x-auto overflow-y-hidden">
					<table class="w-full divide-y divide-gray-700">
						<thead class="bg-side">
							<tr>
								<th scope="col" class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
									Incident
								</th>
								<th scope="col" class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
									Started
								</th>
								<th scope="col" class="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
									Length
								</th>
							</tr>
						</thead>
						<tbody class="bg-side divide-y divide-gray-700">
							<tr v-for="item in incidentsList" :key="item.id">
								<td class="px-4 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="relative flex flex-col items-center group mr-4">
											<span class="leading-none block">
												<div class="status-indicator status-indicator--sm" :class="item.resolved_at ? 'status-indicator--success' : item.severity == 0 ? 'status-indicator--warning' : 'status-indicator--danger'">
													<div class="circle circle--animated circle-main" />
													<div class="circle circle--animated circle-secondary" />
													<div class="circle circle--animated circle-tertiary" />
												</div>
											</span>
											<div class="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
												<span class="relative z-50 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg" style="margin-left: calc(100% + 1.5rem); margin-bottom: -15px;">
													{{ item.resolved_at ? 'Resolved' : item.severity == 0 ? 'Warning' : 'Critical' }}
												</span>
											</div>
										</div>
										<div class="text-sm">
											<div class="font-medium text-gray-300">
												#{{ item.id }} - {{ item.alerts_name }}
											</div>
											<div class="text-gray-400 mt-1">
												{{ item.alerts_lookup }}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-400">
										{{ formatDate(item.started_at) }}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-400">
										{{ lasted(item.started_at, item.resolved_at) }}
									</div>
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
	name: 'Incidents',

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
						const dataLength = resp.data.length
						for (let i = 0; i <= dataLength - 1; i++) {
							vm.incidentsList.push(resp.data[i])
						}

						const wsBuffSize = vm.wsBuffer.length
						if (wsBuffSize > 0) {
							console.log('[incidents] >>> Merging wsBuffer with already added data')
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
					// Add to WsBuffer and merge after the initial fetch
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
			const howMany = moment.duration(moment().diff(prev)).asHours()
			if (howMany < 24) {
				return prev.fromNow()
			}
			return prev.format('D MMM [at] hh:mma')
		},
		formatFloat: function (floating) {
			return parseFloat(floating).toFixed(2)
		},
		lasted: function (started, resolved) {
			if (resolved) {
				return moment(resolved).from(started, true)
			}
			return 'Ongoing'
		}
	}
}
</script>
