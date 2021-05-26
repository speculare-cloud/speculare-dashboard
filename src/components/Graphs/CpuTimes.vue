<template>
	<div class="cputimes">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 258px">
			<h3>{{ this.loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" :unit="unit" :yscale="[0, 100]" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import graphHelper from '@/mixins/graphHelper';
import constructObs from '@/mixins/constructObs';
import axios from 'axios';
import moment from 'moment';

export default {
	name: 'cputimes',
	props: ['uuid'],
	mixins: [graphHelper, constructObs],
	components: {
		LineChart
	},

	data () {
		return {
			scaleTime: 300,
			unit: "percentage",
			connection: null,
			fetchingDone: false,
			datacollection: null,
			loadingMessage: "Loading",
			chartSeries: [
				{},
				{
					label: "user & system",
					value: (_, v) => v == null ? "-" : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
					stroke: "#EAB839",
					fill: "#EAB8391A",
				}
			],
			wsBuffer: [],
			chartLabels: [],
			chartDataObj: [],
			historyBusyDataObj: [],
			historyIdleDataObj: [],
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			// Setup the IntersectionObserver
			// call to the vm.handleWebSocket if we're in realtime,
			// otherwise just call vm.fetching
			vm.constructObs(vm.handleWebSocket, vm.cleaning).observe(vm.$el);
		});
	},

	beforeDestroy: function() {
		// Close the webSocket connection
		this.closeWebSocket();
	},

	methods: {
		// Function responsible to init the fetching data and the websocket connection
		fetching: function() {
			let vm = this;
			
			// Fetching old data with the API
			axios
				.get(vm.getBaseUrl('cputimes', vm.uuid) + '&size=' + vm.scaleTime + vm.getMinMaxNowString(vm.scaleTime))
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
							console.log("[CPUTIMES] >>> Merging wsBuffer with already added data");
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								let currItem = vm.wsBuffer[i];
								let date = moment.utc(currItem[12]).unix();
								// If the current lastest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									// Compute the busy time of the CPU from these params
									let busy = currItem[1] + currItem[2] + currItem[3] + currItem[6] + currItem[7] + currItem[8];
									// Compute the idling time of the CPU from these params
									let idle = currItem[4] + currItem[5];
									// Get the usage in % computed from busy and idle + prev values
									let usage = this.getUsageFrom(busy, idle);
									console.log("[CPUTIMES] >>>> Adding value to the end of the buffer");
									// Add the new value to the Array
									vm.pushValue(date, usage, busy, idle);
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
					console.log("[CPUTIMES] Failed to fetch previous data", error);
				}).finally(() => {
					vm.loadingMessage = "No Data"
				});
		},
		// Empty every arrays and close the websocket
		cleaning: function() {
			this.fetchingDone = false;
			this.chartLabels = [];
			this.chartDataObj = [];
			this.historyBusyDataObj = [];
			this.historyIdleDataObj = [];
			this.wsBuffer = [];
			this.closeWebSocket();
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function(i) {
			this.chartDataObj[i] = null;
			this.historyBusyDataObj[i] = null;
			this.historyIdleDataObj[i] = null;
		},
		// Remove one index from each data arrays
		spliceData: function(i) {
			this.chartLabels.splice(i, 1);
			this.chartDataObj.splice(i, 1);
			this.historyBusyDataObj.splice(i, 1);
			this.historyIdleDataObj.splice(i, 1);
		},
		// Update the graph by setting datacollection to the new arrays
		updateGraph: function() {
			// Sanitize the Data in case of gap
			// but also remove too old element
			this.sanitizeGraphData(
				this.chartLabels.length,
				this.scaleTime,
				this.chartLabels,
				5,
				this.spliceData,
				this.nullData
			);
			// Update the datacollection so that uPlot update the chart
			this.datacollection = [
				this.chartLabels,
				this.chartDataObj,
			];
		},
		// Add values (Labels and data) to the arrays
		pushValue: function(date, usage, busy, idle) {
			this.chartLabels.push(date);
			this.chartDataObj.push(usage);
			this.historyBusyDataObj.push(busy);
			this.historyIdleDataObj.push(idle);
		},
		// Pretty explicit, but close the websocket and set null for the connection
		closeWebSocket: function() {
			console.log("[CPUTIMES] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
			if (this.connection != null) {
				console.log("[CPUTIMES] > Closing the webSocket");
				this.connection.close();
				this.connection = null;
			}
		},
		// Init the websocket for changes in the hosts list
		handleWebSocket: function() {
			let vm = this;

			console.log("[CPUTIMES] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[CPUTIMES] > Setting a new webSocket");
				vm.connection = new WebSocket(vm.$wsBaseUrl + "/ws?query=insert:cputimes:host_uuid.eq." + vm.uuid);
			}
			// only add the open (at least for the vm.fetching) if we're in realtime
			vm.connection.addEventListener('open', function() {
				console.log("[CPUTIMES] >> webSocket opened");
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
				console.log("[CPUTIMES] >> Adding value to the wsBuffer (WS opened but fetching not done yet)")
				this.wsBuffer.push(newValues);
			}
		},
		getUsageFrom: function(busy, idle) {
			let usage = null;
			// If the previous does not exist, we can't compute the percent
			let prevIndex = this.chartLabels.length - 1;
			if (!(this.historyBusyDataObj[prevIndex] == null)) {
				// Get the previous entry
				let prevBusy = this.historyBusyDataObj[prevIndex];
				let prevIdle = this.historyIdleDataObj[prevIndex];
				// Compute the total of the previous and now
				let prevTotal = prevBusy + prevIdle;
				let total = busy + idle;
				// Compute the different between both
				let totald = total - prevTotal;
				let idled = idle - prevIdle;
				// Get the value as percent
				usage = (totald - idled)/totald*100;
			}

			return usage;
		},
		fastAddNewData: function(elem) {
			// Compute the busy time of the CPU from these params
			let busy = elem.cuser + elem.nice + elem.system + elem.irq + elem.softirq + elem.steal;
			// Compute the idling time of the CPU from these params
			let idle = elem.idle + elem.iowait;
			// Get the usage in % computed from busy and idle + prev values
			let usage = this.getUsageFrom(busy, idle);

			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), usage, busy, idle);
		},
		addNewData: function(newValues) {
			// Compute the busy time of the CPU from these params
			let busy = newValues[1] + newValues[2] + newValues[3] + newValues[6] + newValues[7] + newValues[8];
			// Compute the idling time of the CPU from these params
			let idle = newValues[4] + newValues[5];
			// Get the usage in % computed from busy and idle + prev values
			let usage = this.getUsageFrom(busy, idle);

			// Add the new value to the Array
			this.pushValue(moment.utc(newValues[12]).unix(), usage, busy, idle);

			// Update onscreen values
			this.updateGraph();
		}
	}
}
</script>