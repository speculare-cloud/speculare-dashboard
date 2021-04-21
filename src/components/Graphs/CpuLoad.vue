<template>
	<div class="cpuload">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 229px">
			<h3>{{ this.loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart';
import graphHelper from '@/mixins/graphHelper';
import axios from 'axios';
import moment from 'moment';

export default {
	name: 'cpuload',
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
					label: "load1",
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
					stroke:            "#7EB26D",
					fill:              "#7EB26D1A",
				}),
				Object.assign({
					label: "load5",
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
					stroke:            "#008080",
					fill:              "#0080801A",
				}),
				Object.assign({
					label: "load15",
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
					stroke:            "#DA70D6",
					fill:              "#DA70D61A",
				})
			],
			chartLabels: [],
			chartDataObjOne: [],
			chartDataObjFive: [],
			chartDataObjFitheen: [],
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			let min = moment().utc().subtract(vm.scaleTime, 'seconds').format("YYYY-MM-DDTHH:mm:ss.SSS");
			let max = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
			axios
				.get('https://server.speculare.cloud:9640/api/loadavg?uuid=' + vm.uuid + '&size=' + vm.scaleTime + '&min_date=' + min + '&max_date=' + max)
				.then(resp => {
					// Add data in reverse order (push_back) and uPlot use last as most recent
					for (let i = resp.data.length - 1; i >= 0; i--) {
						vm.fastAddNewData(resp.data[i]);
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
					console.log("[CPULOAD] Failed to fetch previous data", error);
				});

			// Init and listen to websocket
			vm.handleWebSocket();
		});
	},

	beforeDestroy: function() {
		// Close the webSocket connection
		console.log("[CPULOAD] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		if (this.connection != null) {
			this.connection.close();
			this.connection = null;
		}
	},

	methods: {
		nullData: function(i) {
			this.chartDataObjOne[i] = null;
			this.chartDataObjFive[i] = null;
			this.chartDataObjFitheen[i] = null;
		},
		spliceData: function(i) {
			this.chartLabels.splice(i, 1);
			this.chartDataObjOne.splice(i, 1);
			this.chartDataObjFive.splice(i, 1);
			this.chartDataObjFitheen.splice(i, 1);
		},
		updateGraph: function() {
			this.datacollection = [
				this.chartLabels, 
				this.chartDataObjOne, 
				this.chartDataObjFive, 
				this.chartDataObjFitheen
			];
		},
		pushValue: function(date, one, five, fith) {
			this.chartLabels.push(date);
			this.chartDataObjOne.push(one);
			this.chartDataObjFive.push(five);
			this.chartDataObjFitheen.push(fith);
		},
		handleWebSocket: function() {
			// Init the websocket for changes in the hosts list
			console.log("[CPULOAD] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (this.connection == null) {
				console.log("[CPULOAD] > Setting a new webSocket");
				this.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=load_avg&specific_filter=host_uuid.eq." + this.uuid);
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
		fastAddNewData: function(elem) {
			// Add the new value to the Array
			this.pushValue(moment.utc(elem.created_at).unix(), elem.one, elem.five, elem.fifteen);
		},
		addNewData: function(newValues) {
			// Add the new value to the Array
			this.pushValue(moment.utc(newValues[5]).unix(), newValues[1], newValues[2], newValues[3]);

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