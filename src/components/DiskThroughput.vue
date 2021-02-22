<template>
	<div class="diskreads">
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/LineChart'

export default {
	name: 'diskreads',
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
					label: "Read",
					stroke: "red",
					points: {
						show: false
					},
				},
				{
					label: "Write",
					stroke: "green",
					points: {
						show: false
					},
				}
			],
			chartLabels: [],
			chartDataObjRead: [],
			chartDataObjWrite: [],
			dataHistoryRead: [],
			dataHistoryWrite: [],
			// Workaround until I handle multiple disks
			which: null
		}
	},

	created: function() {		
		let vm = this;
		
		if (vm.connection == null) {
			console.log("[CPU] Starting connection to WebSocket Server");
			vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=iostats&specific_filter=host_uuid.eq." + vm.uuid);
		}

		this.connection.onmessage = function(event) {
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			
			// Workaround for only one disk at the moment
			if (this.which == null) {
				this.which = newValues[1];
			} else if (newValues[1] != this.which) {
				return;
			}

			// If no previous data, define starting as 0
			if (vm.chartLabels.length == 0) {
				vm.chartDataObjRead.push(0);
				vm.chartDataObjWrite.push(0);
			} else {
				// Previous for read
				let previousR = vm.dataHistoryRead[vm.dataHistoryRead.length - 1];
				let diffR = newValues[2] - previousR;
				vm.chartDataObjRead.push(diffR / 1000000);
				// Previous for write
				let previousW = vm.dataHistoryWrite[vm.dataHistoryWrite.length - 1];
				let diffW = newValues[3] - previousW;
				vm.chartDataObjWrite.push(diffW / 1000000);
			}

			// Push the label
			let date_obj = new Date(newValues[5]).valueOf() / 1000;
			vm.chartLabels.push(date_obj);

			// Push the newValues to the history
			vm.dataHistoryRead.push(newValues[2]);
			vm.dataHistoryWrite.push(newValues[3]);

			// 5 mins history
			if (vm.chartLabels.length > (60 * 5)) {
				// If too many items, shift the first one
				vm.chartLabels.shift();
				vm.chartDataObjRead.shift();
				vm.chartDataObjWrite.shift();
			}

			vm.datacollection = [
				vm.chartLabels,
				vm.chartDataObjRead,
				vm.chartDataObjWrite,
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