<template>
	<div class="cpuload">
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'

export default {
	name: 'cpuload',
	props: ['uuid'],
	connection: null,
	components: {
		LineChart
	},

	data () {
		return {
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
			chartLabels: [],
			chartDataObjOne: [],
			chartDataObjFive: [],
			chartDataObjFitheen: [],
		}
	},

	created: function() {		
		let vm = this;
		
		if (vm.connection == null) {
			console.log("[CPU] Starting connection to WebSocket Server");
			vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=load_avg&specific_filter=host_uuid.eq." + vm.uuid);
		}

		this.connection.onmessage = function(event) {
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];

			let date_obj = new Date(newValues[5]).valueOf() / 1000;
			
			vm.chartLabels.push(date_obj);
			vm.chartDataObjOne.push(newValues[1]);
			vm.chartDataObjFive.push(newValues[2]);
			vm.chartDataObjFitheen.push(newValues[3]);

			// 5 mins history
			if (vm.chartDataObjOne.length > (60 * 5)) {
				vm.chartLabels.shift();
				vm.chartDataObjOne.shift();
				vm.chartDataObjFive.shift();
				vm.chartDataObjFitheen.shift();
			}

			vm.datacollection = [
				vm.chartLabels,
				vm.chartDataObjOne,
				vm.chartDataObjFive,
				vm.chartDataObjFitheen,
			];
		}
	},

	beforeDestroy: function() {
		console.log("[CPU] Closing the WebSocket connection");
		this.connection.close();
		this.connection = null;
	}
}
</script>