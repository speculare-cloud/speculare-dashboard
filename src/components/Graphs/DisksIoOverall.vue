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
	name: 'Iostats',
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
			disksNumber: 0,
			unit: 'MiB/s',
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: 'Loading',
			chartSeries: [
				{},
				{
					label: 'read',
					value: (_, v) => v == null ? '-' : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					stroke: '#7EB26D',
					fill: '#7EB26D1A'
				},
				{
					label: 'write',
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
			chartDataObjRead: [],
			chartDataObjWrite: [],
			historyDataRead: [],
			historyDataWrite: [],
			bufferDataWs: [],
			obs: null
		}
	},

	watch: {
		graphRange: function (newVal, oldVal) {
			const vm = this
			console.log('[iostats] graphRange changed')
			vm.handleGraphRangeChange(newVal, oldVal, vm.cleaning, vm.fetching, function () { vm.initWS('iostats', vm) }, vm.connection === null)
		}
	},

	mounted: function () {
		const vm = this

		// Don't setup anything before everything is rendered
		nextTick(() => {
			// Setup the IntersectionObserver
			this.obs = vm.graphScrollObs(function () { vm.initWS('iostats', vm) }, vm.cleaning)
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
			await axios.get(vm.getBaseUrl('iostats_count', vm.uuid))
				.then(resp => (vm.disksNumber = resp.data))
				.catch(err => {
					console.log('[iostats] Failed to fetch number of disks', err)
				})

			// Compute the rangeParams in case of start & end or just scale
			let rangeParams
			if (vm.graphRange.start != null) {
				rangeParams = vm.getMinMaxString(vm.graphRange.start, vm.graphRange.end)
			} else {
				rangeParams = vm.getMinMaxNowString(vm.getScale(vm))
			}

			axios
				.get(vm.getBaseUrl('iostats', vm.uuid) + '&size=' + (vm.getScale(vm) * vm.disksNumber) + rangeParams)
				.then(resp => {
					const dataLenght = resp.data.length
					// Add data in reverse order (push_back) and uPlot use last as most recent
					// And skip disksNumber by disksNumber
					for (let i = dataLenght - 1; i >= 0; i -= vm.disksNumber) {
						if (vm.disksNumber > 1) {
							const currentData = []
							for (let y = 0; y < vm.disksNumber; y++) {
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
							console.log('[iostats] >>> Merging wsBuffer with already added data')
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								const currItem = vm.wsBuffer[i]
								const date = moment.utc(currItem[0][5]).unix()
								// If the current latest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									let total_read = 0
									let total_write = 0
									// Compute total read and write from all disks
									for (let y = 0; y < currItem.length; y++) {
										total_read += currItem[y][2]
										total_write += currItem[y][3]
									}
									const { read, write } = vm.getReadWriteFrom(total_read, total_write)
									console.log('[iostats] >>>> Adding value to the end of the buffer')
									// Add the new value to the Array
									vm.pushValue(date, read, write, total_read, total_write)
								}
							}
						}

						// Update onscreen values
						vm.updateGraph(vm, function () { vm.datacollection = [vm.chartLabels, vm.chartDataObjRead, vm.chartDataObjWrite] })
					}

					// Define the fetching as done
					vm.fetchingDone = true
					// Clear the wsBuffer
					vm.wsBuffer = []
				})
				.catch(error => {
					console.log('[iostats] Failed to fetch previous data', error)
				}).finally(() => {
					vm.loadingMessage = 'No Data'
				})
		},
		// Empty every arrays and close the websocket
		cleaning: function (ws = true) {
			this.fetchingDone = false
			this.chartLabels = []
			this.chartDataObjRead = []
			this.chartDataObjWrite = []
			this.historyDataRead = []
			this.historyDataWrite = []
			this.wsBuffer = []
			if (ws) {
				this.closeWS('iostats', this)
			}
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function (i) {
			this.chartDataObjRead[i] = null
			this.chartDataObjWrite[i] = null
			this.historyDataRead[i] = null
			this.historyDataWrite[i] = null
		},
		// Remove one index from each data arrays
		spliceData: function (start, nb) {
			this.chartLabels.splice(start, nb)
			this.chartDataObjRead.splice(start, nb)
			this.chartDataObjWrite.splice(start, nb)
			this.historyDataRead.splice(start, nb)
			this.historyDataWrite.splice(start, nb)
		},
		// Add values (Labels and data) to the arrays
		pushValue: function (date, read, write, histRead, histWrite) {
			this.chartLabels.push(date)
			// If scale != default, should divide the values by granularity (at least for the graph)
			if (this.getScale(this) !== this.defaultScale) {
				console.log('[iostats] Dividing value for the granularity [', this.graphRange.granularity, ']')
				read = read / this.graphRange.granularity
				write = write / this.graphRange.granularity
			}
			this.chartDataObjRead.push(read)
			this.chartDataObjWrite.push(write)
			this.historyDataRead.push(histRead)
			this.historyDataWrite.push(histWrite)
		},
		wsMessageHandle: function (event) {
			// Parse the data and extract newValue
			const json = JSON.parse(event.data)
			const newValues = json.columnvalues
			// Create a buffer of values due to WS sending one event by one event
			// - and as multiple disks as the same time...
			this.bufferDataWs.push(newValues)
			if (this.fetchingDone && this.bufferDataWs.length === this.disksNumber) {
				// Add the new data to the graph
				this.addNewData()
				// Clear the array
				this.bufferDataWs = []
				// If we're not yet done with the fetching, but done with filling the disks buffer
			} else if (!this.fetchingDone && this.bufferDataWs.length === this.disksNumber) {
				// Add the value to the wsBuffer
				console.log('[iostats] >> Adding values to the wsBuffer (WS opened but fetching not done yet)')
				this.wsBuffer.push(this.bufferDataWs)
				// Clear the array
				this.bufferDataWs = []
			}
		},
		getReadWriteFrom: function (total_read, total_write) {
			let read = null
			let write = null
			// If the previous does not exist, we can't compute the percent
			const prevIndex = this.chartLabels.length - 1
			if (!(this.historyDataRead[prevIndex] == null)) {
				// Get the previous values
				const prevRead = this.historyDataRead[prevIndex]
				const prevWrite = this.historyDataWrite[prevIndex]

				// TODO - Auto scale to kb/mb/gb depending on the values
				read = (total_read - prevRead) / BYTES_TO_MB
				write = -((total_write - prevWrite) / BYTES_TO_MB)
			}

			return { read, write }
		},
		fastAddNewData: function (elem) {
			let total_read = 0
			let total_write = 0
			// Compute total read and write from all disks
			for (let i = 0; i < this.disksNumber; i++) {
				total_read += elem[i].read_bytes
				total_write += elem[i].write_bytes
			}

			const { read, write } = this.getReadWriteFrom(total_read, total_write)

			// Add the new value to the Array
			this.pushValue(moment.utc(elem[0].created_at).unix(), read, write, total_read, total_write)
		},
		addNewData: function () {
			const vm = this
			let total_read = 0
			let total_write = 0
			// Compute total read and write from all disks
			for (let i = 0; i < vm.bufferDataWs.length; i++) {
				total_read += vm.bufferDataWs[i][3]
				total_write += vm.bufferDataWs[i][5]
			}

			const { read, write } = vm.getReadWriteFrom(total_read, total_write)

			// Add the new value to the Array
			vm.pushValue(moment.utc(vm.bufferDataWs[0][8]).unix(), read, write, total_read, total_write)

			// Update onscreen values
			vm.updateGraph(vm, function () { vm.datacollection = [vm.chartLabels, vm.chartDataObjRead, vm.chartDataObjWrite] })
		}
	}
}
</script>
