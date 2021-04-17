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
				{
					label: "load1",
					stroke: "red",
					points: {
						show: false
					},
				},
				{
					label: "load5",
					stroke: "green",
					points: {
						show: false
					},
				},
				{
					label: "load15",
					stroke: "blue",
					points: {
						show: false
					},
				}
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
						let date_obj = new Date(elem.created_at).valueOf() / 1000;
						vm.fastAddNewData(date_obj, elem.one, elem.five, elem.fifteen, index);
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
		vm.connection.close();
		vm.connection = null;
	},

	methods: {
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
		fastAddNewData: function(date_obj, valueOne, valueFive, valueFitheen, index) {
			let vm = this;
			
			// Add the new value to the Array
			// starting by the end -> start
			vm.chartLabels[vm.scaleTime - 1 - index] = date_obj;
			vm.chartDataObjOne[vm.scaleTime - 1 - index] = valueOne;
			vm.chartDataObjFive[vm.scaleTime - 1 - index] = valueFive;
			vm.chartDataObjFitheen[vm.scaleTime - 1 - index] = valueFitheen;
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