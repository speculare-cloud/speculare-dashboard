<template>
	<div class="cpustats">
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
	name: 'cpustats',
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
					label: "use",
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
					stroke:            "#EAB839",
					fill:              "#EAB8391A",
				})
			],
			chartLabels: new Array(this.scaleTime),
			chartDataObj: new Array(this.scaleTime),
			historyBusyDataObj: new Array(this.scaleTime),
			historyIdleDataObj: new Array(this.scaleTime),
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			axios
				.get('https://server.speculare.cloud:9640/api/cpustats?uuid=' + vm.uuid + '&size=' + vm.scaleTime)
				.then(resp => {
					// Iter over each element in reverse order so that the last object in the
					// resp.data is in the first position for the graph (as it's the oldest)
					for (let i = resp.data.length - 1; i >= 0; i--) {
						vm.fastAddNewData(resp.data[i], vm.scaleTime - 1 - i);
					}

					// Update onscreen values
					vm.datacollection = [
						vm.chartLabels,
						vm.chartDataObj,
					];
				})
				.catch(error => {
					console.log("[CPUSTATS] Failed to fetch previous data", error);
				});

			// Init and listen to websocket
			vm.handleWebSocket();
		});
	},

	beforeDestroy: function() {
		let vm = this;

		// Close the webSocket connection
		console.log("[CPUSTATS] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		if (vm.connection != null) {
			vm.connection.close();
			vm.connection = null;
		}
	},

	methods: {
		splineGraph: function(u, seriesIdx, idx0, idx1, extendGap, buildClip) {
			// Function used to smooth out the line, better visual
			return _spline(u, seriesIdx, idx0, idx1, extendGap, buildClip);
		},
		handleWebSocket: function() {
			let vm = this;

			// Init the websocket for changes in the hosts list
			console.log("[CPUSTATS] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[CPUSTATS] > Setting a new webSocket");
				vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=cpustats&specific_filter=host_uuid.eq." + vm.uuid);
			}
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			let vm = this;

			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			// Prepare the variable, explicitly define them for clarity
			let date_obj = new Date(newValues[12]).valueOf() / 1000;

			// Add the new data to the graph
			vm.addNewData(date_obj, newValues);
		},
		fastAddNewData: function(elem, index) {
			let vm = this;

			// Compute the busy time of the CPU from these params
			let busy = elem.cuser + elem.nice + elem.system + elem.irq + elem.softirq + elem.steal;
			// Compute the idling time of the CPU from these params
			let idle = elem.idle + elem.iowait;

			// Add the values to the end of the history array
			vm.historyBusyDataObj[index] = busy;
			vm.historyIdleDataObj[index] = idle;

			// If first item, we have nothing to compare it against, so null it
			if (index == 0) {
				vm.chartDataObj[index] = null;
			} else  {
				// Get the previous entry
				let prevBusy = vm.historyBusyDataObj[index - 1];
				let prevIdle = vm.historyIdleDataObj[index - 1];
				// Compute the total of the previous and now
				let prevTotal = prevBusy + prevIdle;
				let total = busy + idle;
				// Compute the different between both
				let totald = total - prevTotal;
				let idled = idle - prevIdle;
				// Get the value as percent
				let percent = (totald - idled)/totald*100;
				vm.chartDataObj[index] = percent;
			}

			// End with adding the time label for the corrsponding value
			let date_obj = new Date(elem.created_at).valueOf() / 1000;
			vm.chartLabels[index] = date_obj;
		},
		addNewData: function(date_obj, values) {
			let vm = this;

			// Add the new value to the Array
			vm.chartLabels.push(date_obj);
			
			// Compute the busy time of the CPU from these params
			let busy = values[1] + values[2] + values[3] + values[6] + values[7] + values[8];
			// Compute the idling time of the CPU from these params
			let idle = values[4] + values[5];
			// Add the values to the end of the history array
			vm.historyBusyDataObj.push(busy);
			vm.historyIdleDataObj.push(idle);			
			// Get the previous entry
			let prevBusy = vm.historyBusyDataObj[vm.scaleTime - 1];
			let prevIdle = vm.historyIdleDataObj[vm.scaleTime - 1];
			// Compute the total of the previous and now
			let prevTotal = prevBusy + prevIdle;
			let total = busy + idle;
			// Compute the different between both
			let totald = total - prevTotal;
			let idled = idle - prevIdle;
			// Get the value as percent
			let percent = (totald - idled)/totald*100;
			vm.chartDataObj.push(percent);

			// 5 mins history
			if (vm.chartLabels.length > vm.scaleTime) {
				vm.chartLabels.shift();
				vm.chartDataObj.shift();
				vm.historyBusyDataObj.shift();
				vm.historyIdleDataObj.shift();
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