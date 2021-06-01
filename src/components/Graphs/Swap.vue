<template>
	<div class="swap">
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
	name: 'swap',
	props: ['uuid', 'graphRange'],
	mixins: [graphHelper, constructObs],
	components: {
		Stacked
	},

	data () {
		return {
			defaultScale: 300,
			unit: "MiB",
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: "Loading",
			chartSeries: [
				{},
				Object.assign({
					label: "free",
					value: (_u, v, _si, i) => this.intValueOrTilde(this.chartDataObjFree[i], 1),
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
					value: (_u, v, _si, i) => this.intValueOrTilde(this.chartDataObjUsed[i], 1),
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
				})
			],
			wsBuffer: [],
			chartLabels: [],
			chartDataObjFree: [],
			chartDataObjUsed: [],
			obs: null,
		}
	},

	watch: {
		graphRange: function(newVal, oldVal) {
			console.log("[SWAP] graphRange changed");
			this.handleGraphRangeChange(newVal, oldVal, this.cleaning, this.fetching, this.handleWebSocket, this.connection);
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
		getScale: function() {
			return this.graphRange.scale != null ? this.graphRange.scale : this.defaultScale
		},
		// Function responsible to init the fetching data and the websocket connection
		fetching: function() {
			let vm = this;

			// Compute the rangeParams in case of start & end or just scale
			let rangeParams;
			if (vm.graphRange.start != null) {
				rangeParams = vm.getMinMaxString(vm.graphRange.start, vm.graphRange.end);
			} else {
				rangeParams = vm.getMinMaxNowString(vm.getScale());
			}

			// Fetching old data with the API
			axios
				.get(vm.getBaseUrl('swap', vm.uuid) + '&size=' + vm.getScale() + rangeParams)
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
							console.log("[SWAP] >>> Merging wsBuffer with already added data");
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								let currItem = vm.wsBuffer[i];
								let date = moment.utc(currItem[5]).unix();
								// If the current lastest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									console.log("[SWAP] >>>> Adding value to the end of the buffer");
									// Add the new value to the Array
									vm.pushValue(date, currItem[2], currItem[3]);
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
					console.log("[SWAP] Failed to fetch previous data", error);
				}).finally(() => {
					vm.loadingMessage = "No Data"
				});
		},
		// Empty every arrays and close the websocket
		cleaning: function(ws=true) {
			this.fetchingDone = false;
			this.chartLabels = [];
			this.chartDataObjFree = [];
			this.chartDataObjUsed = [];
			this.wsBuffer = [];
			if (ws) {
				this.closeWebSocket();
			}
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function(i) {
			this.chartDataObjFree[i] = null;
			this.chartDataObjUsed[i] = null;
		},
		// Remove one index from each data arrays
		spliceData: function(start, nb) {
			this.chartLabels.splice(start, nb);
			this.chartDataObjFree.splice(start, nb);
			this.chartDataObjUsed.splice(start, nb);
		},
		// Update the graph by setting datacollection to the new arrays
		updateGraph: function() {
			// Sanitize the Data in case of gap
			// but also remove too old element
			this.sanitizeGraphData(
				this.chartLabels.length,
				this.getScale(),
				this.chartLabels,
				this.getScale()/60 + 5,
				this.spliceData,
				this.nullData
			);
			// Update the datacollection so that uPlot update the chart
			this.datacollection = [
				this.chartLabels, 
				this.chartDataObjFree, 
				this.chartDataObjUsed
			];
		},
		// Add values (Labels and data) to the arrays
		pushValue: function(date, free, used) {
			this.chartLabels.push(date);
			this.chartDataObjFree.push(free / KB_TO_MB);
			this.chartDataObjUsed.push(used / KB_TO_MB);
		},
		// Pretty explicit, but close the websocket and set null for the connection
		closeWebSocket: function() {
			console.log("[SWAP] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
			if (this.connection != null) {
				console.log("[SWAP] > Closing the webSocket");
				this.connection.close();
				this.connection = null;
			}
		},
		// Init the websocket for changes in the hosts list
		handleWebSocket: function() {
			let vm = this;

			if (vm.getScale() == 300) {
				console.log("[SWAP] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
				if (vm.connection == null) {
					console.log("[SWAP] > Setting a new webSocket");
					vm.connection = new WebSocket(vm.$wsBaseUrl + "/ws?query=insert:swap:host_uuid.eq." + vm.uuid);
				}
				// only add the open (at least for the vm.fetching) if we're in realtime
				vm.connection.addEventListener('open', function() {
					console.log("[SWAP] >> webSocket opened");
					vm.fetching();
				});
				// Setup onmessage listener
				vm.connection.addEventListener('message', vm.wsMessageHandle);
			}
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
				console.log("[SWAP] >> Adding value to the wsBuffer (WS opened but fetching not done yet)")
				this.wsBuffer.push(newValues);
			}
		},
		fastAddNewData: function(elem) {
			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), elem.free, elem.used);
		},
		addNewData: function(newValues) {
			// Add the new value to the Array
			this.pushValue(moment.utc(newValues[5]).unix(), newValues[2], newValues[3]);

			// Update onscreen values
			this.updateGraph();
		}
	}
}
</script>