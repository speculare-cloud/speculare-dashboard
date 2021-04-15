<template>
	<div class="cpufreq">
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'

export default {
	name: 'cpufreq',
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
					label: "Y",
					stroke: "red",
					points: {
						show: false
					},
				}
			],
			chartLabels: [],
			chartDataObj: [],
		}
	},

	created: function() {		
		let vm = this;
		
		if (vm.connection == null) {
			console.log("[CPUFREQ] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=cpu_info&specific_filter=host_uuid.eq." + vm.uuid);
		}

		this.connection.onmessage = function(event) {
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];

			let date_obj = new Date(newValues[3]).valueOf() / 1000;
			vm.chartLabels.push(date_obj);
			vm.chartDataObj.push(newValues[1]);

			// 5 mins history
			if (vm.chartDataObj.length > (60 * 5)) {
				vm.chartLabels.shift();
				vm.chartDataObj.shift();
			}

			vm.datacollection = [
				vm.chartLabels,
				vm.chartDataObj,
			];
		}
	},

	beforeDestroy: function() {
		console.log("[CPUFREQ] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		this.connection.close();
		this.connection = null;
	}
}
</script>