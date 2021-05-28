<template>
	<div class="ram">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 258px">
			<h3>{{ this.loadingMessage }}</h3>
		</div>
		<Stacked :chartdata="datacollection" :chartseries="chartSeries" :unit="unit" />
	</div>
</template>

<script>
import Stacked from '@/components/Graphs/Utils/Stacked';
import graphHelper from '@/mixins/graphHelper';
import constructObs from '@/mixins/constructObs';
import axios from 'axios';
import moment from 'moment';

const KB_TO_MB = 1000;

export default {
	name: 'ram',
	props: ['uuid'],
	mixins: [graphHelper, constructObs],
	components: {
		Stacked
	},

	data () {
		return {
			scaleTime: 300,
			unit: "MiB",
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: "Loading",
			chartSeries: [
				{},
				Object.assign({
					label: "free",
					value: (_u, v, _si, i) => v == null ? "-" : this.chartDataObjFree[i].toFixed(1),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph,
				}, {
					drawStyle:         0,
					lineInterpolation: 1,
					stroke:            "#7EB26D",
					fill:              "#7EB26D",
				}),
				Object.assign({
					label: "used",
					value: (_u, v, _si, i) => v == null ? "-" : this.chartDataObjUsed[i].toFixed(1),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph,
				}, {
					drawStyle:         0,
					lineInterpolation: 1,
					stroke:            "#ff5722",
					fill:              "#ff5722",
				}),
				Object.assign({
					label: "cached",
					value: (_u, v, _si, i) => v == null ? "-" : this.chartDataObjCached[i].toFixed(1),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph,
				}, {
					drawStyle:         0,
					lineInterpolation: 1,
					stroke:            "#DA70D6",
					fill:              "#DA70D6",
				}),
				Object.assign({
					label: "buffers",
					value: (_u, v, _si, i) => v == null ? "-" : this.chartDataObjBuffers[i].toFixed(1),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph,
				}, {
					drawStyle:         0,
					lineInterpolation: 1,
					stroke:            "#EAB839",
					fill:              "#EAB839",
				})
			],
			wsBuffer: [],
			chartLabels: [],
			chartDataObjFree: [],
			chartDataObjUsed: [],
			chartDataObjCached: [],
			chartDataObjBuffers: [],
			obs: null,
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			// Setup the IntersectionObserver
			// call to the vm.handleWebSocket if we're in realtime,
			// otherwise just call vm.fetching
			this.obs = vm.constructObs(vm.handleWebSocket, vm.cleaning);
			// Observe the element
			this.obs.observe(vm.$el);
		});
	},

	beforeDestroy: function() {
		// Stop the Observation of the element
		this.obs.unobserve(this.$el);
		// Close the webSocket connection
		this.cleaning();
	},

	methods: {
		// Function responsible to init the fetching data and the websocket connection
		fetching: function() {
			let vm = this;

			// Fetching old data with the API
			axios
				.get(vm.getBaseUrl('memory', vm.uuid) + '&size=' + vm.scaleTime + vm.getMinMaxNowString(vm.scaleTime))
				.then(resp => {
					let dataLenght = resp.data.length;
					// Add data in reverse order (push_back) and uPlot use last as most recent
					for (let i = dataLenght - 1; i >= 0; i--) {
						vm.fastAddNewData(resp.data[i]);
					}

					if (dataLenght > 0) {
						// If there is data is wsBuffer we merge the data
						let wsBuffSize = vm.wsBuffer.length;
						if (wsBuffSize > 0) {
							console.log("[MEMORY] >>> Merging wsBuffer with already added data");
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								let currItem = vm.wsBuffer[i];
								let date = moment.utc(currItem[8]).unix();
								// If the current lastest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									console.log("[MEMORY] >>>> Adding value to the end of the buffer");
									// Add the new value to the Array
									vm.pushValue(date, currItem[2], currItem[3], currItem[6], currItem[5]);
								}
							}
						}

						// Update onscreen values
						vm.updateGraph();
					}

					// Define the fetching as done
					vm.fetchingDone = true;
					// Clear the wsBuffer
					vm.wsBuffer = [];
				})
				.catch(error => {
					console.log("[MEMORY] Failed to fetch previous data", error);
				}).finally(() => {
					vm.loadingMessage = "No Data"
				});
		},
		// Empty every arrays and close the websocket
		cleaning: function() {
			this.fetchingDone = false;
			this.chartLabels = [];
			this.chartDataObjFree = [];
			this.chartDataObjUsed = [];
			this.chartDataObjCached = [];
			this.chartDataObjBuffers = [];
			this.wsBuffer = [];
			this.closeWebSocket();
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function(i) {
			this.chartDataObjFree[i] = null;
			this.chartDataObjUsed[i] = null;
			this.chartDataObjCached[i] = null;
			this.chartDataObjBuffers[i] = null;
		},
		// Remove one index from each data arrays
		spliceData: function(i) {
			this.chartLabels.splice(i, 1);
			this.chartDataObjFree.splice(i, 1);
			this.chartDataObjUsed.splice(i, 1);
			this.chartDataObjCached.splice(i, 1);
			this.chartDataObjBuffers.splice(i, 1);
		},
		// Update the graph by setting datacollection to the new arrays
		updateGraph: function() {
			// Sanitize the Data in case of gap
			// but also remove too old element
			this.sanitizeGraphData(
				this.chartLabels.length,
				this.scaleTime,
				this.chartLabels,
				10,
				this.spliceData,
				this.nullData
			);
			// Update the datacollection so that uPlot update the chart
			this.datacollection = [
				this.chartLabels, 
				this.chartDataObjFree,
				this.chartDataObjUsed,
				this.chartDataObjCached,
				this.chartDataObjBuffers
			];
		},
		// Add values (Labels and data) to the arrays
		pushValue: function(date, free, used, cached, buffers) {
			this.chartLabels.push(date);
			this.chartDataObjFree.push(free / KB_TO_MB);
			this.chartDataObjUsed.push(used / KB_TO_MB);
			this.chartDataObjCached.push(cached / KB_TO_MB);
			this.chartDataObjBuffers.push(buffers / KB_TO_MB);
		},
		// Pretty explicit, but close the websocket and set null for the connection
		closeWebSocket: function() {
			console.log("[MEMORY] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
			if (this.connection != null) {
				console.log("[MEMORY] > Closing the webSocket");
				this.connection.close();
				this.connection = null;
			}
		},
		// Init the websocket for changes in the hosts list
		handleWebSocket: function() {
			let vm = this;

			console.log("[MEMORY] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[MEMORY] > Setting a new webSocket");
				vm.connection = new WebSocket(vm.$wsBaseUrl + "/ws?query=insert:memory:host_uuid.eq." + vm.uuid);
			}
			// only add the open (at least for the vm.fetching) if we're in realtime
			vm.connection.addEventListener('open', function() {
				console.log("[MEMORY] >> webSocket opened");
				vm.fetching();
			});
			// Setup onmessage listener
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];

			if (this.fetchingDone) {
				// Add the new data to the graph
				this.addNewData(newValues);
			} else {
				// Add the value to the wsBuffer
				console.log("[MEMORY] >> Adding value to the wsBuffer (WS opened but fetching not done yet)")
				this.wsBuffer.push(newValues);
			}
		},
		fastAddNewData: function(elem) {
			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), elem.free, elem.used, elem.cached, elem.buffers);
		},
		addNewData: function(newValues) {
			// Add the new value to the Array
			this.pushValue(moment.utc(newValues[8]).unix(), newValues[2], newValues[3], newValues[6], newValues[5]);

			// Update onscreen values
			this.updateGraph();
		}
	}
}
</script>