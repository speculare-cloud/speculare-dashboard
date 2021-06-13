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

export default {
	name: 'Loadavg',
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
			unit: 'load',
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: 'Loading',
			chartSeries: [
				{},
				Object.assign({
					label: 'load1',
					value: (_, v) => v == null ? '-' : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph
				}, {
					drawStyle: 0,
					lineInterpolation: 1,
					stroke: '#7EB26D',
					fill: '#7EB26D1A'
				}),
				Object.assign({
					label: 'load5',
					value: (_, v) => v == null ? '-' : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph
				}, {
					drawStyle: 0,
					lineInterpolation: 1,
					stroke: '#008080',
					fill: '#0080801A'
				}),
				Object.assign({
					label: 'load15',
					value: (_, v) => v == null ? '-' : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph
				}, {
					drawStyle: 0,
					lineInterpolation: 1,
					stroke: '#DA70D6',
					fill: '#DA70D61A'
				})
			],
			wsBuffer: [],
			chartLabels: [],
			chartDataObjOne: [],
			chartDataObjFive: [],
			chartDataObjFitheen: [],
			obs: null
		}
	},

	watch: {
		graphRange: function (newVal, oldVal) {
			const vm = this
			console.log('[loadavg] graphRange changed')
			vm.handleGraphRangeChange(newVal, oldVal, vm.cleaning, vm.fetching, function () { vm.initWS('loadavg', vm) }, vm.connection === null)
		}
	},

	mounted: function () {
		const vm = this

		// Don't setup anything before everything is rendered
		nextTick(() => {
			// Setup the IntersectionObserver
			vm.obs = vm.graphScrollObs(function () { vm.initWS('loadavg', vm) }, vm.cleaning)
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
				rangeParams = vm.getMinMaxNowString(vm.getScale(vm))
			}

			// Fetching old data with the API
			axios
				.get(vm.getBaseUrl('loadavg', vm.uuid) + '&size=' + vm.getScale(vm) + rangeParams)
				.then(resp => {
					const dataLenght = resp.data.length
					// Add data in reverse order (push_back) and uPlot use last as most recent
					for (let i = dataLenght - 1; i >= 0; i--) {
						vm.fastAddNewData(resp.data[i])
					}

					if (dataLenght > 0) {
						// If there is data is wsBuffer we merge the data
						const wsBuffSize = vm.wsBuffer.length
						if (wsBuffSize > 0) {
							console.log('[loadavg] >>> Merging wsBuffer with already added data')
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								const currItem = vm.wsBuffer[i]
								const date = moment.utc(currItem[5]).unix()
								// If the current latest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									console.log('[loadavg] >>>> Adding value to the end of the buffer')
									// Add the new value to the Array
									vm.pushValue(date, currItem[1], currItem[2], currItem[3])
								}
							}
						}

						// Update onscreen values
						vm.updateGraph(vm, function () {
							vm.datacollection = [
								vm.chartLabels,
								vm.chartDataObjOne,
								vm.chartDataObjFive,
								vm.chartDataObjFitheen
							]
						})
					}

					// Define the fetching as done
					vm.fetchingDone = true
					// Clear the wsBuffer
					vm.wsBuffer = []
				})
				.catch(error => {
					console.log('[loadavg] Failed to fetch previous data', error)
				}).finally(() => {
					vm.loadingMessage = 'No Data'
				})
		},
		// Empty every arrays and close the websocket
		cleaning: function (ws = true) {
			this.fetchingDone = false
			this.chartLabels = []
			this.chartDataObjOne = []
			this.chartDataObjFive = []
			this.chartDataObjFitheen = []
			this.wsBuffer = []
			if (ws) {
				this.closeWS('loadavg', this)
			}
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function (i) {
			this.chartDataObjOne[i] = null
			this.chartDataObjFive[i] = null
			this.chartDataObjFitheen[i] = null
		},
		// Remove nb index from each data arrays starting from start
		spliceData: function (start, nb) {
			this.chartLabels.splice(start, nb)
			this.chartDataObjOne.splice(start, nb)
			this.chartDataObjFive.splice(start, nb)
			this.chartDataObjFitheen.splice(start, nb)
		},
		// Add values (Labels and data) to the arrays
		pushValue: function (date, one, five, fith) {
			this.chartLabels.push(date)
			this.chartDataObjOne.push(Math.round(one * 100) / 100)
			this.chartDataObjFive.push(Math.round(five * 100) / 100)
			this.chartDataObjFitheen.push(Math.round(fith * 100) / 100)
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
				console.log('[loadavg] >> Adding value to the wsBuffer (WS opened but fetching not done yet)')
				this.wsBuffer.push(newValues)
			}
		},
		fastAddNewData: function (elem) {
			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), elem.one, elem.five, elem.fifteen)
		},
		addNewData: function (newValues) {
			const vm = this
			// Add the new value to the Array
			vm.pushValue(moment.utc(newValues[5]).unix(), newValues[1], newValues[2], newValues[3])

			// Update onscreen values
			vm.updateGraph(vm, function () {
				vm.datacollection = [
					vm.chartLabels,
					vm.chartDataObjOne,
					vm.chartDataObjFive,
					vm.chartDataObjFitheen
				]
			})
		}
	}
}
</script>
