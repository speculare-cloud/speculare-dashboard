<template>
	<div>
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 258px">
			<h3>{{ loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" :unit="unit" />
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

const BYTES_TO_MB = 1000000

export default {
	name: 'Ionets',
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
			defaultScale: 300,
			intNumber: 0,
			unit: 'MiB/s',
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: 'Loading',
			chartSeries: [
				{},
				{
					label: 'recv',
					value: (_, v) => v == null ? '-' : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					stroke: '#7EB26D',
					fill: '#7EB26D1A'
				},
				{
					label: 'sent',
					value: (_, v) => v == null ? '-' : Math.abs(v).toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					stroke: '#DA70D6',
					fill: '#DA70D61A'
				}
			],
			wsBuffer: [],
			chartLabels: [],
			chartDataObjRecv: [],
			chartDataObjSent: [],
			historyDataRecv: [],
			historyDataSent: [],
			bufferDataWs: [],
			obs: null
		}
	},

	watch: {
		graphRange: function (newVal, oldVal) {
			const vm = this
			console.log('[ionets] graphRange changed')
			vm.handleGraphRangeChange(newVal, oldVal, vm.cleaning, vm.fetching, function () { vm.initWS('ionets', vm) }, vm.connection === null)
		}
	},

	mounted: function () {
		const vm = this

		// Don't setup anything before everything is rendered
		nextTick(() => {
			// Setup the IntersectionObserver
			this.obs = vm.graphScrollObs(function () { vm.initWS('ionets', vm) }, vm.cleaning)
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
		fetching: async function () {
			const vm = this

			// Await the first call to iostats_count cause it's needed for the next
			await axios.get(vm.getBaseUrl('ionets_count', vm.uuid))
				.then(resp => (vm.intNumber = resp.data))
				.catch(err => {
					console.log('[ionets] Failed to fetch number of disks', err)
				})

			// Compute the rangeParams in case of start & end or just scale
			let rangeParams
			if (vm.graphRange.start != null) {
				rangeParams = vm.getMinMaxString(vm.graphRange.start, vm.graphRange.end)
			} else {
				rangeParams = vm.getMinMaxNowString(vm.getScale(vm))
			}

			axios
				.get(vm.getBaseUrl('ionets', vm.uuid) + '&size=' + (vm.getScale(vm) * vm.intNumber) + rangeParams)
				.then(resp => {
					const dataLenght = resp.data.length
					// Add data in reverse order (push_back) and uPlot use last as most recent
					// And skip intNumber by intNumber
					for (let i = dataLenght - 1; i >= 0; i -= vm.intNumber) {
						if (vm.intNumber > 1) {
							const currentData = []
							for (let y = 0; y < vm.intNumber; y++) {
								currentData.push(resp.data[i - y])
							}
							vm.fastAddNewData(currentData)
						} else {
							vm.fastAddNewData([resp.data[i]])
						}
					}

					if (dataLenght > 0) {
						// If there is data is wsBuffer we merge the data
						const wsBuffSize = vm.wsBuffer.length
						if (wsBuffSize > 0) {
							console.log('[ionets] >>> Merging wsBuffer with already added data')
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								const currItem = vm.wsBuffer[i]
								const date = moment.utc(currItem[0][11]).unix()
								// If the current latest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									let total_recv = 0
									let total_sent = 0
									// Compute total read and write from all disks
									for (let y = 0; y < currItem.length; y++) {
										total_recv += currItem[y][2]
										total_sent += currItem[y][6]
									}
									const { recv, sent } = vm.getReadWriteFrom(total_recv, total_sent)
									console.log('[ionets] >>>> Adding value to the end of the buffer')
									// Add the new value to the Array
									vm.pushValue(date, recv, sent, total_recv, total_sent)
								}
							}
						}

						// Update onscreen values
						vm.updateGraph(vm, function () { vm.datacollection = [vm.chartLabels, vm.chartDataObjRecv, vm.chartDataObjSent] })
					}

					// Define the fetching as done
					vm.fetchingDone = true
					// Clear the wsBuffer
					vm.wsBuffer = []
				})
				.catch(error => {
					console.log('[ionets] Failed to fetch previous data', error)
				}).finally(() => {
					vm.loadingMessage = 'No Data'
				})
		},
		// Empty every arrays and close the websocket
		cleaning: function (ws = true) {
			this.fetchingDone = false
			this.chartLabels = []
			this.chartDataObjRecv = []
			this.chartDataObjSent = []
			this.historyDataRecv = []
			this.historyDataSent = []
			this.wsBuffer = []
			if (ws) {
				this.closeWS('ionets', this)
			}
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function (i) {
			this.chartDataObjRecv[i] = null
			this.chartDataObjSent[i] = null
			this.historyDataRecv[i] = null
			this.historyDataSent[i] = null
		},
		// Remove one index from each data arrays
		spliceData: function (start, nb) {
			this.chartLabels.splice(start, nb)
			this.chartDataObjRecv.splice(start, nb)
			this.chartDataObjSent.splice(start, nb)
			this.historyDataRecv.splice(start, nb)
			this.historyDataSent.splice(start, nb)
		},
		// Add values (Labels and data) to the arrays
		pushValue: function (date, recv, sent, histrecv, histSent) {
			this.chartLabels.push(date)
			// If scale != default, should divide the values by granularity (at least for the graph)
			if (this.getScale(this) !== this.defaultScale) {
				console.log('[ionets] Dividing value for the granularity [', this.graphRange.granularity, ']')
				recv = recv / this.graphRange.granularity
				sent = sent / this.graphRange.granularity
			}
			this.chartDataObjRecv.push(recv)
			this.chartDataObjSent.push(sent)
			this.historyDataRecv.push(histrecv)
			this.historyDataSent.push(histSent)
		},
		wsMessageHandle: function (event) {
			// Parse the data and extract newValue
			const json = JSON.parse(event.data)
			const newValues = json.columnvalues
			// Create a buffer of values due to WS sending one event by one event
			// - and as multiple disks as the same time...
			this.bufferDataWs.push(newValues)
			if (this.fetchingDone && this.bufferDataWs.length === this.intNumber) {
				// Add the new data to the graph
				this.addNewData()
				// Clear the array
				this.bufferDataWs = []
				// If we're not yet done with the fetching, but done with filling the disks buffer
			} else if (!this.fetchingDone && this.bufferDataWs.length === this.intNumber) {
				// Add the value to the wsBuffer
				console.log('[ionets] >> Adding values to the wsBuffer (WS opened but fetching not done yet)')
				this.wsBuffer.push(this.bufferDataWs)
				// Clear the array
				this.bufferDataWs = []
			}
		},
		getReadWriteFrom: function (total_recv, total_sent) {
			let recv = null
			let sent = null
			// If the previous does not exist, we can't compute the percent
			const prevIndex = this.chartLabels.length - 1
			if (!(this.historyDataRecv[prevIndex] == null)) {
				// Get the previous values
				const prevRecv = this.historyDataRecv[prevIndex]
				const prevSent = this.historyDataSent[prevIndex]

				// TODO - Auto scale to kb/mb/gb depending on the values
				recv = (total_recv - prevRecv) / BYTES_TO_MB
				sent = -((total_sent - prevSent) / BYTES_TO_MB)
			}

			return { recv, sent }
		},
		fastAddNewData: function (elem) {
			let total_recv = 0
			let total_sent = 0
			// Compute total read and write from all disks
			for (let i = 0; i < this.intNumber; i++) {
				total_recv += elem[i].rx_bytes
				total_sent += elem[i].tx_bytes
			}

			const { recv, sent } = this.getReadWriteFrom(total_recv, total_sent)

			// Add the new value to the Array
			this.pushValue(moment.utc(elem[0].created_at).unix(), recv, sent, total_recv, total_sent)
		},
		addNewData: function () {
			const vm = this
			let total_recv = 0
			let total_sent = 0
			// Compute total read and write from all disks
			for (let i = 0; i < vm.bufferDataWs.length; i++) {
				total_recv += vm.bufferDataWs[i][2]
				total_sent += vm.bufferDataWs[i][6]
			}

			const { recv, sent } = vm.getReadWriteFrom(total_recv, total_sent)

			// Add the new value to the Array
			vm.pushValue(moment.utc(vm.bufferDataWs[0][11]).unix(), recv, sent, total_recv, total_sent)

			// Update onscreen values
			vm.updateGraph(vm, function () { vm.datacollection = [vm.chartLabels, vm.chartDataObjRecv, vm.chartDataObjSent] })
		}
	}
}
</script>
