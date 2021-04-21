<template>
	<div class="disksiooverall">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 229px">
			<h3>Loading</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import nowUtc from '@/mixins/nowUtc'
import axios from 'axios';
import uPlot from 'uplot';

const _spline = uPlot.paths.spline();

export default {
	name: 'disksiooverall',
	props: ['uuid'],
	mixins: [nowUtc],
	components: {
		LineChart
	},

	data () {
		return {
			scaleTime: 300,
			disksNumber: 0,
			connection: null,
			datacollection: null,
			chartSeries: [
				{},
				Object.assign({
					label: "read",
					value: (_, v) => v == null ? "-" : v.toFixed(2) + "mb/s",
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
					label: "write",
					value: (_, v) => v == null ? "-" : v.toFixed(2) + "mb/s",
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
			chartDataObjRead: new Array(this.scaleTime),
			chartDataObjWrite: new Array(this.scaleTime),
			historyDataRead: new Array(this.scaleTime),
			historyDataWrite: new Array(this.scaleTime),
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
					axios
						.get('https://server.speculare.cloud:9640/api/iostats?uuid=' + vm.uuid + '&size=' + (vm.scaleTime * vm.disksNumber))
						.then(resp => {
							// Add data in reverse order (push_back) and uPlot use last as most recent
							// And skip disksNumber by disksNumber
							for (let i = resp.data.length - 1; i >= 0; i-=vm.disksNumber) {
								let currentData = [];
								for (let y = 0; y < vm.disksNumber; y++) {
									currentData.push(resp.data[i - y]);
								}
							 	vm.fastAddNewData(currentData, vm.scaleTime - 1 - Math.floor(i/vm.disksNumber));
							}

							vm.sanitizeData();

							// Update onscreen values
							vm.datacollection = [
								vm.chartLabels,
								vm.chartDataObjRead,
								vm.chartDataObjWrite,
							];
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
		let vm = this;

		// Close the webSocket connection
		console.log("[DISKSIOOVERALL] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
		if (vm.connection != null) {
			vm.connection.close();
			vm.connection = null;
		}
	},

	methods: {
		splineGraph: function(u, seriesIdx, idx0, idx1, extendGap, buildClip) {
			return _spline(u, seriesIdx, idx0, idx1, extendGap, buildClip);
		},
		nullingDataIndex: function(index) {
			let vm = this;

			vm.chartDataObjRead[index] = null;
			vm.chartDataObjWrite[index] = null;
			vm.historyDataRead[index] = null;
			vm.historyDataWrite[index] = null;
		},
		// TODO - Convert it to a mixins
		sanitizeData: function() {
			let vm = this;

			// Be sure the date are following in order (by 1s for now)
			const now = vm.nowUtc();
			for (let i = vm.scaleTime - 1; i >= 0; i--) {
				// Iterate in the reverse order, and find if any missing data from the lastest we have
				// Also compare start against current time, if over 5s, might be some missing data
				
				// Plus or minus 5 are for throttleshot
				if (i == vm.scaleTime - 1) {
					// Check against now to see if we're missing starting data
					if (!(now - 5 <= vm.chartLabels[i] && vm.chartLabels[i] <= now + 5)) {
						vm.chartLabels[i] = now;
						vm.nullingDataIndex(i);
					}
				} else {
					if (vm.chartLabels[i + 1] > vm.chartLabels[i] + 5) {
						// Don't need to change the Labels, uPlot already handle this
						vm.nullingDataIndex(i);
					}
				}
			}
		},
		handleWebSocket: function() {
			let vm = this;

			// Init the websocket for changes in the hosts list
			console.log("[CPULOAD] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[CPULOAD] > Setting a new webSocket");
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
				// Prepare the variable, explicitly define them for clarity
				let date_obj = new Date(newValues[5]).valueOf() / 1000;
				vm.addNewData(date_obj);
				// Clear the array
				vm.bufferDataWs = [];
			}
		},
		fastAddNewData: function(elem, index) {
			let vm = this;
			
			let total_read = 0;
			let total_write = 0;
			// Compute total read and write from all disks
			for (let i = 0; i < vm.disksNumber; i++) {
				total_read += elem[i].bytes_read;
				total_write += elem[i].bytes_wrtn;
			}
			
			// Add values to history
			vm.historyDataRead[index] = total_read;
			vm.historyDataWrite[index] = total_write;

			if (index == 0 || vm.historyDataRead[index - 1] == null) {
				vm.chartDataObjRead[index] = null;
				vm.chartDataObjWrite[index] = null;
			} else {
				// Get the previous values
				let prevRead = vm.historyDataRead[index - 1];
				let prevWrite = vm.historyDataWrite[index - 1];

				// Dividing by 1000000 to get mb
				let diffRead = (total_read - prevRead) / 1000000;
				let diffWrite = (total_write - prevWrite) / 1000000;
				vm.chartDataObjRead[index] = diffRead;
				vm.chartDataObjWrite[index] = -diffWrite;
			}

			// End with adding the time label for the corrsponding value
			let date_obj = new Date(elem[0].created_at).valueOf() / 1000;
			vm.chartLabels[index] = date_obj;
		},
		addNewData: function(date_obj) {
			let vm = this;

			let total_read = 0;
			let total_write = 0;
			// Compute total read and write from all disks
			for (let i = 0; i < vm.bufferDataWs.length; i++) {
				total_read += vm.bufferDataWs[i][2];
				total_write += vm.bufferDataWs[i][3];
			}
			
			// Add current values to history
			vm.historyDataRead.push(total_read);
			vm.historyDataWrite.push(total_write);

			if (vm.historyDataRead[vm.scaleTime - 1] == null) {
				vm.chartDataObjRead.push(null);
				vm.chartDataObjWrite.push(null);
			} else {
				// Get the previous values
				let prevRead = vm.historyDataRead[vm.scaleTime - 1];
				let prevWrite = vm.historyDataWrite[vm.scaleTime - 1];

				// Dividing by 1000000 to get mb
				let diffRead = (total_read - prevRead) / 1000000;
				let diffWrite = (total_write - prevWrite) / 1000000;
				vm.chartDataObjRead.push(diffRead);
				vm.chartDataObjWrite.push(-diffWrite);
			}
			// Add the date_obj to the labels
			vm.chartLabels.push(date_obj);

			// (scaleTime / 60) units of time history
			if (vm.chartLabels.length > vm.scaleTime) {
				vm.chartLabels.shift();
				vm.chartDataObjRead.shift();
				vm.chartDataObjWrite.shift();
				vm.historyDataRead.shift();
				vm.historyDataWrite.shift();
			}

			// TODO - Might be worth checking if last has been sent less than 5s ago
			vm.sanitizeData();

			// Update onscreen values
			vm.datacollection = [
				vm.chartLabels,
				vm.chartDataObjRead,
				vm.chartDataObjWrite,
			];
		}
	}
}
</script>