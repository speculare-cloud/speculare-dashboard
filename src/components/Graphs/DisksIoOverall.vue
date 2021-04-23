<template>
	<div class="disksiooverall">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 229px">
			<h3>{{ this.loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" :unit="unit" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import graphHelper from '@/mixins/graphHelper';
import axios from 'axios';
import moment from 'moment';

export default {
	name: 'disksiooverall',
	props: ['uuid'],
	mixins: [graphHelper],
	components: {
		LineChart
	},

	data () {
		return {
			scaleTime: 300,
			disksNumber: 0,
			unit: "percentage",
			connection: null,
			datacollection: null,
			loadingMessage: "Loading",
			chartSeries: [
				{},
				Object.assign({
					label: "read",
					value: (_, v) => v == null ? "-" : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
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
					label: "write",
					value: (_, v) => v == null ? "-" : v.toFixed(2),
					points: {
						show: false
					},
					width: Math.min(Math.max(2 / devicePixelRatio, 1.25), 2),
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
			chartDataObjRead: [],
			chartDataObjWrite: [],
			historyDataRead: [],
			historyDataWrite: [],
			bufferDataWs: null,
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			axios
				.get('https://server.speculare.cloud:9640/api/iostats_count?uuid=' + vm.uuid + '&size=' + vm.scaleTime)
				.then(resp => {
					vm.disksNumber = resp.data;
					vm.bufferDataWs = [];

					// Fetch previous data
					let min = moment().utc().subtract(vm.scaleTime, 'seconds').format("YYYY-MM-DDTHH:mm:ss.SSS");
					let max = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
					axios
						.get('https://server.speculare.cloud:9640/api/iostats?uuid=' + vm.uuid + '&size=' + (vm.scaleTime * vm.disksNumber) + '&min_date=' + min + '&max_date=' + max)
						.then(resp => {
							// Add data in reverse order (push_back) and uPlot use last as most recent
							// And skip disksNumber by disksNumber
							for (let i = resp.data.length - 1; i >= 0; i-=vm.disksNumber) {
								if (vm.disksNumber > 1) {
									let currentData = [];
									for (let y = 0; y < vm.disksNumber; y++) {
										currentData.push(resp.data[i - y]);
									}
									vm.fastAddNewData(currentData);
								} else {
									vm.fastAddNewData([resp.data[i]]);
								}
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
							console.log("[DISKSIOOVERALL] Failed to fetch previous data", error);
						});
					
					// Init and listen to websocket
					vm.handleWebSocket();
				})
				.catch(error => {
					console.log("[DISKSIOOVERALL] Failed to fetch number of disks", error);
					return;
				});
		});
	},

	beforeDestroy: function() {
		// Close the webSocket connection
		console.log("[DISKSIOOVERALL] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		if (this.connection != null) {
			this.connection.close();
			this.connection = null;
		}
	},

	methods: {
		nullData: function(i) {
			this.chartDataObjRead[i] = null;
			this.chartDataObjWrite[i] = null;
			this.historyDataRead[i] = null;
			this.historyDataWrite[i] = null;
		},
		spliceData: function(i) {
			this.chartLabels.splice(i, 1);
			this.chartDataObjRead.splice(i, 1);
			this.chartDataObjWrite.splice(i, 1);
			this.historyDataRead.splice(i, 1);
			this.historyDataWrite.splice(i, 1);
		},
		updateGraph: function() {
			this.datacollection = [
				this.chartLabels,
				this.chartDataObjRead,
				this.chartDataObjWrite,
			];
		},
		pushValue: function(date, read, write, histRead, histWrite) {
			this.chartLabels.push(date);
			this.chartDataObjRead.push(read);
			this.chartDataObjWrite.push(write);
			this.historyDataRead.push(histRead);
			this.historyDataWrite.push(histWrite);
		},
		handleWebSocket: function() {
			let vm = this;

			// Init the websocket for changes in the hosts list
			console.log("[DISKSIOOVERALL] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[DISKSIOOVERALL] > Setting a new webSocket");
				vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?change_table=iostats&specific_filter=host_uuid.eq." + vm.uuid);
			}
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			let vm = this;

			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			// Create a buffer of values due to WS sending one event by one event
			// - and as multiple disks as the same time...
			if (vm.bufferDataWs.length != vm.disksNumber - 1) {
				vm.bufferDataWs.push(newValues);
			} else {
				// Add current to the buffer for easier loop in the addNewData
				vm.bufferDataWs.push(newValues);
				// Add the new data to the graph
				vm.addNewData(moment.utc(newValues[5]).unix());
				// Clear the array
				vm.bufferDataWs = [];
			}
		},
		fastAddNewData: function(elem) {			
			let total_read = 0;
			let total_write = 0;
			// Compute total read and write from all disks
			for (let i = 0; i < this.disksNumber; i++) {
				total_read += elem[i].bytes_read;
				total_write += elem[i].bytes_wrtn;
			}

			let read = null;
			let write = null;
			// If first item, we have nothing to compare it against, so null it
			// Or if the previous does not exist, we can't compute the percent
			let prevIndex = this.historyDataRead.length - 1;
			if (!(prevIndex == -1 || this.historyDataRead[prevIndex - 1] == null)) {
				// Get the previous values
				let prevRead = this.historyDataRead[prevIndex - 1];
				let prevWrite = this.historyDataWrite[prevIndex - 1];

				// Dividing by 1000000 to get mb
				read = (total_read - prevRead) / 1000000;
				write = -((total_write - prevWrite) / 1000000);
			}

			// Add the new value to the Array
			this.pushValue(moment.utc(elem[0].created_at).unix(), read, write, total_read, total_write);
		},
		addNewData: function(date_obj) {
			let total_read = 0;
			let total_write = 0;
			// Compute total read and write from all disks
			for (let i = 0; i < this.bufferDataWs.length; i++) {
				total_read += this.bufferDataWs[i][2];
				total_write += this.bufferDataWs[i][3];
			}

			let dataSize = this.chartLabels.length;
			let read = null;
			let write = null;
			if (!(this.historyDataRead[dataSize - 1] == null)) {
				// Get the previous values
				let prevRead = this.historyDataRead[dataSize - 1];
				let prevWrite = this.historyDataWrite[dataSize - 1];

				// Dividing by 1000000 to get mb
				read = (total_read - prevRead) / 1000000;
				write = -((total_write - prevWrite) / 1000000);
			}

			// Add the new value to the Array
			this.pushValue(date_obj, read, write, total_read, total_write);

			// Be sure to handle correctly gaps in the graph, ...
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