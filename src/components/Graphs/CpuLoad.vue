<template>
	<div class="cpuload">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 229px">
			<h3>Loading</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import axios from 'axios';
import uPlot from 'uplot';

const _spline = uPlot.paths.spline();

export default {
	name: 'cpuload',
	props: ['uuid'],
	components: {
		LineChart
	},

	data () {
		return {
			scaleTime: 300,
			connection: null,
			datacollection: null,
			chartSeries: [
				{},
				Object.assign({
					label: "load1",
					value: (_, v) => v == null ? "-" : v.toFixed(2) + "%",
					points: {
						show: false
					},
					width: 1 / devicePixelRatio,
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
					width: 1 / devicePixelRatio,
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
					width: 1 / devicePixelRatio,
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
			chartLabels: new Array(this.scaleTime),
			chartDataObjOne: new Array(this.scaleTime),
			chartDataObjFive: new Array(this.scaleTime),
			chartDataObjFitheen: new Array(this.scaleTime),
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			axios
				.get('https://server.speculare.cloud:9640/api/loadavg?uuid=' + vm.uuid + '&size=' + vm.scaleTime)
				.then(resp => {
					resp.data.forEach((elem, index) => {
						vm.fastAddNewData(elem, index);
					});

					// Update onscreen values
					vm.datacollection = [
						vm.chartLabels,
						vm.chartDataObjOne,
						vm.chartDataObjFive,
						vm.chartDataObjFitheen,
					];
				})
				.catch(error => {
					console.log("[CPULOAD] Failed to fetch previous data", error);
				});

			// Init and listen to websocket
			vm.handleWebSocket();
		});
	},

	beforeDestroy: function() {
		let vm = this;

		// Close the webSocket connection
		console.log("[CPULOAD] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		if (vm.connection != null) {
			vm.connection.close();
			vm.connection = null;
		}
	},

	methods: {
		splineGraph: function(u, seriesIdx, idx0, idx1, extendGap, buildClip) {
			return _spline(u, seriesIdx, idx0, idx1, extendGap, buildClip);
		},
		handleWebSocket: function() {
			let vm = this;

			// Init the websocket for changes in the hosts list
			console.log("[CPULOAD] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[CPULOAD] > Setting a new webSocket");
				vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=load_avg&specific_filter=host_uuid.eq." + vm.uuid);
			}
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			let vm = this;

			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			// Prepare the variable, explicitly define them for clarity
			let date_obj = new Date(newValues[5]).valueOf() / 1000;
			let valueOne = newValues[1];
			let valueFive = newValues[2];
			let valueFitheen = newValues[3];

			// Add the new data to the graph
			vm.addNewData(date_obj, valueOne, valueFive, valueFitheen);
		},
		fastAddNewData: function(elem, index) {
			let vm = this;
			
			let date_obj = new Date(elem.created_at).valueOf() / 1000;
			// Add the new value to the Array
			// starting by the end -> start
			vm.chartLabels[vm.scaleTime - 1 - index] = date_obj;
			vm.chartDataObjOne[vm.scaleTime - 1 - index] = elem.one;
			vm.chartDataObjFive[vm.scaleTime - 1 - index] = elem.five;
			vm.chartDataObjFitheen[vm.scaleTime - 1 - index] = elem.fifteen;
		},
		addNewData: function(date_obj, valueOne, valueFive, valueFitheen) {
			let vm = this;

			// Add the new value to the Array
			vm.chartLabels.push(date_obj);
			vm.chartDataObjOne.push(valueOne);
			vm.chartDataObjFive.push(valueFive);
			vm.chartDataObjFitheen.push(valueFitheen);

			// 5 mins history
			if (vm.chartDataObjOne.length > (60 * 5)) {
				vm.chartLabels.shift();
				vm.chartDataObjOne.shift();
				vm.chartDataObjFive.shift();
				vm.chartDataObjFitheen.shift();
			}

			// Update onscreen values
			vm.datacollection = [
				vm.chartLabels,
				vm.chartDataObjOne,
				vm.chartDataObjFive,
				vm.chartDataObjFitheen,
			];
		}
	}
}
</script>