<template>
	<div class="cpustats">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 229px">
			<h3>{{ this.loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import graphHelper from '@/mixins/graphHelper';
import axios from 'axios';
import moment from 'moment';

export default {
	name: 'cpustats',
	props: ['uuid'],
	mixins: [graphHelper],
	components: {
		LineChart
	},

	data () {
		return {
			scaleTime: 300,
			connection: null,
			datacollection: null,
			loadingMessage: "Loading",
			chartSeries: [
				{},
				Object.assign({
					label: "use",
					value: (_, v) => v == null ? "-" : v.toFixed(2) + "%",
					points: {
						show: false
					},
					width: 2 / devicePixelRatio,
					drawStyle: 2,
					lineInterpolation: null,
					paths: this.splineGraph,
				}, {
					drawStyle:         0,
					lineInterpolation: 1,
					stroke:            "#EAB839",
					fill:              "#EAB8391A",
				})
			],
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
			let min = moment().utc().subtract(vm.scaleTime, 'seconds').format("YYYY-MM-DDTHH:mm:ss.SSS");
			let max = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
			axios
				.get('https://server.speculare.cloud:9640/api/cpustats?uuid=' + vm.uuid + '&size=' + vm.scaleTime + '&min_date=' + min + '&max_date=' + max)
				.then(resp => {
					// Add data in reverse order (push_back) and uPlot use last as most recent
					for (let i = resp.data.length - 1; i >= 0; i--) {
						vm.fastAddNewData(resp.data[i], vm.scaleTime - 1 - i);
					}

					if (resp.data.length > 0) {
						// Be sure to handle correctly gaps in the graph, ...
						vm.sanitizeGraphData(
							vm.chartLabels.length,
							vm.scaleTime,
							vm.chartLabels,
							5,
							vm.spliceData,
							vm.nullData
						);

						// Update onscreen values
						vm.updateGraph();
					} else {
						vm.loadingMessage = "No Data"
					}
				})
				.catch(error => {
					console.log("[CPUSTATS] Failed to fetch previous data", error);
				});

			// Init and listen to websocket
			vm.handleWebSocket();
		});
	},

	beforeDestroy: function() {
		// Close the webSocket connection
		console.log("[CPUSTATS] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		if (this.connection != null) {
			this.connection.close();
			this.connection = null;
		}
	},

	methods: {
		nullData: function(i) {
			this.chartDataObj[i] = null;
			this.historyBusyDataObj[i] = null;
			this.historyIdleDataObj[i] = null;
		},
		spliceData: function(i) {
			this.chartLabels.splice(i, 1);
			this.chartDataObj.splice(i, 1);
			this.historyBusyDataObj.splice(i, 1);
			this.historyIdleDataObj.splice(i, 1);
		},
		updateGraph: function() {
			this.datacollection = [
				this.chartLabels,
				this.chartDataObj,
			];
		},
		pushValue: function(date, usage, busy, idle) {
			this.chartLabels.push(date);
			this.chartDataObj.push(usage);
			this.historyBusyDataObj.push(busy);
			this.historyIdleDataObj.push(idle);
		},
		handleWebSocket: function() {
			// Init the websocket for changes in the hosts list
			console.log("[CPUSTATS] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (this.connection == null) {
				console.log("[CPUSTATS] > Setting a new webSocket");
				this.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=cpustats&specific_filter=host_uuid.eq." + this.uuid);
			}
			this.connection.addEventListener('message', this.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];

			// Add the new data to the graph
			this.addNewData(newValues);
		},
		fastAddNewData: function(elem, index) {
			// Compute the busy time of the CPU from these params
			let busy = elem.cuser + elem.nice + elem.system + elem.irq + elem.softirq + elem.steal;
			// Compute the idling time of the CPU from these params
			let idle = elem.idle + elem.iowait;

			let usage = null;
			// If first item, we have nothing to compare it against, so null it
			// Or if the previous does not exist, we can't compute the percent
			if (!(index == 0 || this.historyBusyDataObj[index - 1] == null)) {
				// Get the previous entry
				let prevBusy = this.historyBusyDataObj[index - 1];
				let prevIdle = this.historyIdleDataObj[index - 1];
				// Compute the total of the previous and now
				let prevTotal = prevBusy + prevIdle;
				let total = busy + idle;
				// Compute the different between both
				let totald = total - prevTotal;
				let idled = idle - prevIdle;
				// Get the value as percent
				usage = (totald - idled)/totald*100;
			}

			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), usage, busy, idle);
		},
		addNewData: function(newValues) {
			// Compute the busy time of the CPU from these params
			let busy = newValues[1] + newValues[2] + newValues[3] + newValues[6] + newValues[7] + newValues[8];
			// Compute the idling time of the CPU from these params
			let idle = newValues[4] + newValues[5];
			
			let dataSize = this.chartLabels.length;
			let usage = null;
			// If the previous does not exist, we can't compute the percent
			if (!(this.historyBusyDataObj[dataSize - 1] == null)) {
				// Get the previous entry
				let prevBusy = this.historyBusyDataObj[dataSize - 1];
				let prevIdle = this.historyIdleDataObj[dataSize - 1];
				// Compute the total of the previous and now
				let prevTotal = prevBusy + prevIdle;
				let total = busy + idle;
				// Compute the different between both
				let totald = total - prevTotal;
				let idled = idle - prevIdle;
				// Get the value as percent
				usage = (totald - idled)/totald*100;
			}

			// Add the new value to the Array
			this.pushValue(moment.utc(newValues[12]).unix(), usage, busy, idle);

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

			// Update onscreen values
			this.updateGraph();
		}
	}
}
</script>