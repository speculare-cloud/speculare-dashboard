<template>
	<div class="disksiooverall">
		<div v-if="datacollection == null" class="w-100 flex items-center justify-center text-xl text-gray-400" style="height: 258px">
			<h3>{{ this.loadingMessage }}</h3>
		</div>
		<LineChart :chartdata="datacollection" :chartseries="chartSeries" :unit="unit" />
	</div>
</template>

<script>
import LineChart from '@/components/Graphs/LineChart'
import graphHelper from '@/mixins/graphHelper';
import constructObs from '@/mixins/constructObs';
import axios from 'axios';
import moment from 'moment';

export default {
	name: 'disksiooverall',
	props: ['uuid'],
	mixins: [graphHelper, constructObs],
	components: {
		LineChart
	},

	data () {
		return {
			scaleTime: 300,
			disksNumber: 0,
			unit: "mb/s",
			connection: null,
			fetchingDone: false,
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
			wsBuffer: [],
			chartLabels: [],
			chartDataObjRead: [],
			chartDataObjWrite: [],
			historyDataRead: [],
			historyDataWrite: [],
			bufferDataWs: [],
		}
	},

	mounted: function() {
		let vm = this;

		// Don't setup anything before everything is rendered
		vm.$nextTick(function () {
			// Setup the IntersectionObserver
			// call to the vm.handleWebSocket if we're in realtime,
			// otherwise just call vm.fetching
			vm.constructObs(vm.handleWebSocket, vm.cleaning).observe(vm.$el);
		});
	},

	beforeDestroy: function() {
		// Close the webSocket connection
		this.closeWebSocket();
	},

	methods: {
		// Function responsible to init the fetching data and the websocket connection
		fetching: async function() {
			let vm = this;

			// Await the first call to iostats_count cause it's needed for the next
			await axios.get(vm.getBaseUrl('iostats_count', vm.uuid))
				.then(resp => (vm.disksNumber = resp.data))
				.catch(err => {
					console.log("[DISKSIOOVERALL] Failed to fetch number of disks", err);
					return;
				});

			axios
				.get(vm.getBaseUrl('iostats', vm.uuid) + '&size=' + (vm.scaleTime * vm.disksNumber) + vm.getMinMaxNowString(vm.scaleTime))
				.then(resp => {
					let dataLenght = resp.data.length;
					// Add data in reverse order (push_back) and uPlot use last as most recent
					// And skip disksNumber by disksNumber
					for (let i = dataLenght - 1; i >= 0; i-=vm.disksNumber) {
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

					if (dataLenght > 0) {
						// If there is data is wsBuffer we merge the data
						let wsBuffSize = vm.wsBuffer.length;
						if (wsBuffSize > 0) {
							console.log("[DISKSIOOVERALL] >>> Merging wsBuffer with already added data");
							for (let i = 0; i <= wsBuffSize - 1; i++) {
								let currItem = vm.wsBuffer[i];
								let date = moment.utc(currItem[0][5]).unix();
								// If the current lastest date is lower than the date in the buffer
								if (vm.chartLabels[vm.chartLabels.length - 1] < date) {
									let total_read = 0;
									let total_write = 0;
									// Compute total read and write from all disks
									for (let y = 0; y < currItem.length; y++) {
										total_read += currItem[y][2];
										total_write += currItem[y][3];
									}
									let {read, write} = vm.getReadWriteFrom(total_read, total_write);
									console.log("[DISKSIOOVERALL] >>>> Adding value to the end of the buffer");
									// Add the new value to the Array
									vm.pushValue(moment.utc(currItem[0][5]).unix(), read, write, total_read, total_write);
								}
							}
						}

						// Update onscreen values
						vm.updateGraph();
					}

					// Define the fetching as done
					vm.fetchingDone = true;
					// Clear the wsBuffer
					vm.wsBuffer = [];
				})
				.catch(error => {
					console.log("[DISKSIOOVERALL] Failed to fetch previous data", error);
				}).finally(() => {
					vm.loadingMessage = "No Data"
				});
		},
		// Empty every arrays and close the websocket
		cleaning: function() {
			this.fetchingDone = false;
			this.chartLabels = [];
			this.chartDataObjRead = [];
			this.chartDataObjWrite = [];
			this.historyDataRead = [];
			this.historyDataWrite = [];
			this.wsBuffer = [];
			this.closeWebSocket();
		},
		// Null the data of an index (without nulling the Labels)
		nullData: function(i) {
			this.chartDataObjRead[i] = null;
			this.chartDataObjWrite[i] = null;
			this.historyDataRead[i] = null;
			this.historyDataWrite[i] = null;
		},
		// Remove one index from each data arrays
		spliceData: function(i) {
			this.chartLabels.splice(i, 1);
			this.chartDataObjRead.splice(i, 1);
			this.chartDataObjWrite.splice(i, 1);
			this.historyDataRead.splice(i, 1);
			this.historyDataWrite.splice(i, 1);
		},
		// Update the graph by setting datacollection to the new arrays
		updateGraph: function() {
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
			// Update the datacollection so that uPlot update the chart
			this.datacollection = [
				this.chartLabels,
				this.chartDataObjRead,
				this.chartDataObjWrite,
			];
		},
		// Add values (Labels and data) to the arrays
		pushValue: function(date, read, write, histRead, histWrite) {
			this.chartLabels.push(date);
			this.chartDataObjRead.push(read);
			this.chartDataObjWrite.push(write);
			this.historyDataRead.push(histRead);
			this.historyDataWrite.push(histWrite);
		},
		// Pretty explicit, but close the websocket and set null for the connection
		closeWebSocket: function() {
			console.log("[DISKSIOOVERALL] %cClosing %cthe WebSocket connection", "color:red;", "color:white;");
			if (this.connection != null) {
				console.log("[DISKSIOOVERALL] > Closing the webSocket");
				this.connection.close();
				this.connection = null;
			}
		},
		// Init the websocket for changes in the hosts list
		handleWebSocket: function() {
			let vm = this;

			console.log("[DISKSIOOVERALL] %cStarting %cconnection to WebSocket Server", "color:green;", "color:white;");
			if (vm.connection == null) {
				console.log("[DISKSIOOVERALL] > Setting a new webSocket");
				vm.connection = new WebSocket("wss://cdc.speculare.cloud:9641/ws?query=insert:iostats:host_uuid.eq." + vm.uuid);
			}
			// only add the open (at least for the vm.fetching) if we're in realtime
			vm.connection.addEventListener('open', function() {
				console.log("[DISKSIOOVERALL] >> webSocket opened");
				vm.fetching();
			});
			// Setup onmessage listener
			vm.connection.addEventListener('message', vm.wsMessageHandle);
		},
		wsMessageHandle: function(event) {
			// Parse the data and extract newValue
			let json = JSON.parse(event.data);
			let newValues = json["columnvalues"];
			// Create a buffer of values due to WS sending one event by one event
			// - and as multiple disks as the same time...
			this.bufferDataWs.push(newValues);
			if (this.fetchingDone && this.bufferDataWs.length == this.disksNumber) {
				// Add the new data to the graph
				this.addNewData();
				// Clear the array
				this.bufferDataWs = [];
			// If we're not yet done with the fetching, but done with filling the disks buffer
			} else if (!this.fetchingDone && this.bufferDataWs.length == this.disksNumber) {
				// Add the value to the wsBuffer
				console.log("[DISKSIOOVERALL] >> Adding values to the wsBuffer (WS opened but fetching not done yet)")
				this.wsBuffer.push(this.bufferDataWs);
				// Clear the array
				this.bufferDataWs = [];
			}
		},
		getReadWriteFrom: function(total_read, total_write) {
			let read = null;
			let write = null;
			// If the previous does not exist, we can't compute the percent
			let prevIndex = this.chartLabels.length - 1;
			if (!(this.historyDataRead[prevIndex] == null)) {
				// Get the previous values
				let prevRead = this.historyDataRead[prevIndex];
				let prevWrite = this.historyDataWrite[prevIndex];

				// Dividing by 1000000 to get mb
				read = (total_read - prevRead) / 1000000;
				write = -((total_write - prevWrite) / 1000000);
			}

			return {read, write, total_read, total_write};
		},
		fastAddNewData: function(elem) {			
			let total_read = 0;
			let total_write = 0;
			// Compute total read and write from all disks
			for (let i = 0; i < this.disksNumber; i++) {
				total_read += elem[i].read_bytes;
				total_write += elem[i].write_bytes;
			}

			let {read, write} = this.getReadWriteFrom(total_read, total_write);

			// Add the new value to the Array
			this.pushValue(moment.utc(elem[0].created_at).unix(), read, write, total_read, total_write);
		},
		addNewData: function() {
			let total_read = 0;
			let total_write = 0;
			// Compute total read and write from all disks
			for (let i = 0; i < this.bufferDataWs.length; i++) {
				total_read += this.bufferDataWs[i][3];
				total_write += this.bufferDataWs[i][5];
			}

			let {read, write} = this.getReadWriteFrom(total_read, total_write);

			// Add the new value to the Array
			this.pushValue(moment.utc(this.bufferDataWs[0][8]).unix(), read, write, total_read, total_write);

			// Update onscreen values
			this.updateGraph();
		}
	}
}
</script>