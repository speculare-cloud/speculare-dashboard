<template>
	<div>
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 258px">
			<h3>{{ loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" :unit="unit" :yscale="[0, 100]" />
	</div>
</template>

<script>
import { nextTick } from 'vue'
import LineChart from '@/components/Graphs/Utils/LineChart'
import graphHelper from '@/mixins/graphHelper'
import graphScrollObs from '@/mixins/graphScrollObs'
import graphWebSocket from '@/mixins/graphWebSocket'
import axios from 'axios'
import moment from 'moment'

export default {
	name: 'Cputimes',
	components: {
		LineChart
	},
	mixins: [graphHelper, graphScrollObs, graphWebSocket],
	props: {
		uuid: {
			type: String,
			required: true
		},
		graphRange: {
			type: Object,
			default: null
		}
	},

	data () {
		return {
			unit: 'percentage',
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: 'Loading',
			chartSeries: [
				{},
				{
					label: 'user & system',
					value: (_, v) => v == null ? '-' : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					stroke: '#EAB839',
					fill: '#EAB8391A'
				}
			],
			wsBuffer: [],
			chartLabels: [],
			chartDataObj: [],
			historyBusyDataObj: [],
			historyIdleDataObj: [],
			obs: null
		}
	},

	watch: {
		graphRange: function (newVal, oldVal) {
			const vm = this
			console.log('[cputimes] graphRange changed')
			vm.handleGraphRangeChange(newVal, oldVal, vm.cleaning, vm.fetching, function () { vm.initWS('cputimes', vm) }, vm.connection === null)
		}
	},

	mounted: function () {
		const vm = this

		// Don't setup anything before everything is rendered
		nextTick(() => {
			// Setup the IntersectionObserver
			vm.obs = vm.graphScrollObs(function () { vm.initWS('cputimes', vm) }, vm.cleaning)
			// Observe the element
			vm.obs.observe(vm.$el)
		})
	},

	beforeUnmount: function () {
		// Stop the Observation of the element
		this.obs.unobserve(this.$el)
		// Close the webSocket connection
		this.cleaning()
	},

	methods: {
		// Function responsible to init the fetching data and the websocket connection
		fetching: function () {
			const vm = this

			// Compute the rangeParams in case of start & end or just scale
			let rangeParams
			if (vm.graphRange.start != null) {
				rangeParams = vm.getMinMaxString(vm.graphRange.start, vm.graphRange.end)
			} else {
				rangeParams = vm.getMinMaxNowString(vm.graphRange.scale)
			}

			// Fetching old data with the API
			axios
				.get(vm.getBaseUrl('cputimes', vm.uuid) + rangeParams)
				.then(resp => {
					const dataLenght = resp.data.length
					// Add data in reverse order (push_back) and uPlot use last as most recent
					for (let i = dataLenght - 1; i >= 0; i--) {
						vm.fastAddNewData(resp.data[i])
					}

					if (dataLenght > 0) {
						// If there is data in wsBuffer we merge the data
						const wsBuffSize = vm.wsBuffer.length
						if (wsBuffSize > 0) {
							console.log('[cputimes] >>> Merging wsBuffer with already added data')
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								const currItem = vm.wsBuffer[i]
								const date = moment.utc(currItem[12]).unix()
								// If the current latest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									// Compute the busy time of the CPU from these params
									const busy = currItem[1] + currItem[2] + currItem[3] + currItem[6] + currItem[7] + currItem[8]
									// Compute the idling time of the CPU from these params
									const idle = currItem[4] + currItem[5]
									// Get the usage in % computed from busy and idle + prev values
									const usage = this.getUsageFrom(busy, idle)
									console.log('[cputimes] >>>> Adding value to the end of the buffer')
									// Add the new value to the Array
									vm.pushValue(date, usage, busy, idle)
								}
							}
						}
						// Update onscreen values
						vm.updateGraph(vm, function () { vm.datacollection = [vm.chartLabels, vm.chartDataObj] })
					}

					// Define the fetching as done
					vm.fetchingDone = true
					// Clear the wsBuffer
					vm.wsBuffer = []
				})
				.catch(error => {
					console.log('[cputimes] Failed to fetch previous data', error)
				}).finally(() => {
					vm.loadingMessage = 'No Data'
				})
		},
		// Empty every arrays and close the websocket
		cleaning: function (ws = true) {
			this.fetchingDone = false
			this.chartLabels = []
			this.chartDataObj = []
			this.historyBusyDataObj = []
			this.historyIdleDataObj = []
			this.wsBuffer = []
			if (ws) {
				this.closeWS('cputimes', this)
			}
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function (i) {
			this.chartDataObj[i] = null
			this.historyBusyDataObj[i] = null
			this.historyIdleDataObj[i] = null
		},
		// Remove nb index from each data arrays starting from start
		spliceData: function (start, nb) {
			this.chartLabels.splice(start, nb)
			this.chartDataObj.splice(start, nb)
			this.historyBusyDataObj.splice(start, nb)
			this.historyIdleDataObj.splice(start, nb)
		},
		// Add values (Labels and data) to the arrays
		pushValue: function (date, usage, busy, idle) {
			this.chartLabels.push(date)
			this.chartDataObj.push(usage)
			this.historyBusyDataObj.push(busy)
			this.historyIdleDataObj.push(idle)
		},
		wsMessageHandle: function (event) {
			// Parse the data and extract newValue
			const json = JSON.parse(event.data)
			const newValues = json.columnvalues

			if (this.fetchingDone) {
				// Add the new data to the graph
				this.addNewData(newValues)
			} else {
				// Add the value to the wsBuffer
				console.log('[cputimes] >> Adding value to the wsBuffer (WS opened but fetching not done yet)')
				this.wsBuffer.push(newValues)
			}
		},
		getUsageFrom: function (busy, idle) {
			let usage = null
			// If the previous does not exist, we can't compute the percent
			const prevIndex = this.chartLabels.length - 1
			if (!(this.historyBusyDataObj[prevIndex] == null)) {
				// Get the previous entry
				const prevBusy = this.historyBusyDataObj[prevIndex]
				const prevIdle = this.historyIdleDataObj[prevIndex]
				// Compute the total of the previous and now
				const prevTotal = prevBusy + prevIdle
				const total = busy + idle
				// Compute the different between both
				const totald = total - prevTotal
				const idled = idle - prevIdle
				// Get the value as percent
				usage = (totald - idled) / totald * 100
			}

			return usage
		},
		fastAddNewData: function (elem) {
			// Compute the busy time of the CPU from these params
			const busy = elem.cuser + elem.nice + elem.system + elem.irq + elem.softirq + elem.steal
			// Compute the idling time of the CPU from these params
			const idle = elem.idle + elem.iowait
			// Get the usage in % computed from busy and idle + prev values
			const usage = this.getUsageFrom(busy, idle)

			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), usage, busy, idle)
		},
		addNewData: function (newValues) {
			const vm = this
			// Compute the busy time of the CPU from these params
			const busy = newValues[1] + newValues[2] + newValues[3] + newValues[6] + newValues[7] + newValues[8]
			// Compute the idling time of the CPU from these params
			const idle = newValues[4] + newValues[5]
			// Get the usage in % computed from busy and idle + prev values
			const usage = vm.getUsageFrom(busy, idle)

			// Add the new value to the Array
			vm.pushValue(moment.utc(newValues[12]).unix(), usage, busy, idle)

			// Update onscreen values
			vm.updateGraph(vm, function () { vm.datacollection = [vm.chartLabels, vm.chartDataObj] })
		}
	}
}
</script>
