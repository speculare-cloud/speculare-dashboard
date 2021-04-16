<template>
	<div class="cpufreq">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 229px">
			<h3>Loading</h3>
		</div>
		<LineChart v-if="datacollection != null" :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import axios from 'axios';

export default {
	name: 'cpufreq',
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
					label: "GHz",
					stroke: "red",
					points: {
						show: false
					},
				}
			],
			chartLabels: new Array(this.scaleTime),
			chartDataObj: new Array(this.scaleTime),
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			axios
				.get('https://server.speculare.cloud:9640/api/cpu_info?uuid=' + vm.uuid + '&size=' + vm.scaleTime)
				.then(resp => {
					resp.data.forEach((elem, index) => {
						let date_obj = new Date(elem.created_at).valueOf() / 1000;
						let value = elem.cpu_freq;
						vm.fastAddNewData(date_obj, value, index);
					});

					// Update onscreen values
					vm.datacollection = [
						vm.chartLabels,
						vm.chartDataObj,
					];
				})
				.catch(error => {
					console.log("[CPUFREQ] Failed to fetch previous data", error);
				});

			// Init and listen to websocket
			vm.handleWebSocket();
		});
	},

	beforeDestroy: function() {
		let vm = this;

		// Close the webSocket connection
		console.log("[CPUFREQ] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		vm.connection.close();
		vm.connection = null;
	},

	methods: {
		handleWebSocket: function() {
			let vm = this;

			// Init the websocket for changes in the hosts list
			console.log("[CPUFREQ] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[CPUFREQ] > Setting a new webSocket");
				vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=cpu_info&specific_filter=host_uuid.eq." + vm.uuid);
			}
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			let vm = this;

			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			// Prepare the variable, explicitly define them for clarity
			let date_obj = new Date(newValues[3]).valueOf() / 1000;
			let value = newValues[1];

			// Add the new data to the graph
			vm.addNewData(date_obj, value);
		},
		fastAddNewData: function(date_obj, value, index) {
			let vm = this;
			
			// Add the new value to the Array
			// starting by the end -> start
			vm.chartLabels[vm.scaleTime - 1 - index] = date_obj;
			vm.chartDataObj[vm.scaleTime - 1 - index] = value;
		},
		addNewData: function(date_obj, value) {
			let vm = this;

			// Add the new value to the Array
			vm.chartLabels.push(date_obj);
			vm.chartDataObj.push(value);

			// 5 mins history
			if (vm.chartDataObj.length > vm.scaleTime) {
				vm.chartLabels.shift();
				vm.chartDataObj.shift();
			}

			// Update onscreen values
			vm.datacollection = [
				vm.chartLabels,
				vm.chartDataObj,
			];
		}
	}
}
</script>