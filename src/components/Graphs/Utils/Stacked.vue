<template>
	<div ref="uniqueName" class="w-100"></div>
</template>

<script>
import uPlot from 'uplot';

export default {
	name: 'Stacked',
	props: {
		chartdata: {
			type: Array,
			default: null
    	},
		chartseries: Array,
		unit: String,
		yscale: Array
  	},

	data () {
		return {
			chart: null,
			hovered: false,
		}
	},
	
	watch: {
		chartdata: function (newData, oldData) {
			if (oldData == null || !this.chart) {
				this.createChart(newData);
			} else if (!this.hovered && this.chart) {
				let stacked = this.stack(newData, i => false, false);
				this.chart.setData(stacked.data);
			}
			
			if (!this.hovered) {
				// Update the legend to the lastest value
				this.chart.setLegend({idx: newData[1].length - 1}, false);
			}
		}
	},

	mounted () {
		// Add the event after the page has been rendered
		this.$nextTick(function() {
			window.addEventListener('resize', this.setChartSize);
		});
	},

	methods: {
		customLegend: function() {
			let vm = this;

			function init(u, _) {
				let legendEl = u.root.querySelector(".u-legend");
				// Get the u-series corresponding to the Timestamp
				let time = legendEl.getElementsByClassName("u-series")[0];
				// Remove first elem of time, which is just the label "Time"
				time.firstChild.remove();
				// Assign some style change
				uPlot.assign(time.firstChild.style, {
					fontSize: "14px",
					color: "rgb(189, 189, 193)"
				});
				// Create unit item - and insert it before time.firstChild
				let unit = document.createElement("td");
				let content = document.createTextNode(vm.unit);
				unit.appendChild(content);
				time.insertBefore(unit, time.firstChild);

				// Assign some style change
				uPlot.assign(time.style, {
					width: "100%",
					display: "flex",
    				webkitBoxPack: "justify",
    				justifyContent: "space-between",
				});
				uPlot.assign(time.firstChild.style, {
					fontSize: "14px",
					color: "rgb(189, 189, 193)"
				});
				uPlot.assign(legendEl.style, {
					paddingLeft: "35px",
					paddingRight: "25px"
				});
			}

			return {
				hooks: {
					init: init,
				}
			};
		},
		initMouseEvent: function() {
			let vm = this;

			// get the over part of the Graph as per uPlot doc
			let elems = this.$el.getElementsByClassName("u-over");
			// Add mouseleave event
			elems.item(0).addEventListener("mouseleave", () => {
				vm.hovered = false;
				this.chart.setLegend({idx: this.chartdata[1].length - 1}, false);
			});
			// Add mouseenter event
			elems.item(0).addEventListener("mouseenter", () => {
				vm.hovered = true;
			});
		},
		stack: function(data, omit, dobands=true) {
			let d0lenght = data[0].length;
			let accum = Array(d0lenght);
			for (let i = 0; i < d0lenght; ++i) accum[i] = 0;
			let stacked_data = [data[0]];
			let length = data.length;
			let bands = [];

			// Compute the stacked value (add each value (kind of))
			for (let i = 1; i < length; i++) {
				stacked_data.push(omit(i) ? data[i] : data[i].map((v, i) => (accum[i] += +v)));
			}

			for (let i = 1; i < length; i++) {
				!omit(i) && bands.push({
					series: [
						data.findIndex((_s, j) => j > i && !omit(j)),
						i,
					]
				});
			}

			return {
				data: stacked_data,
				bands,
			};
		},
		createChart: function(data) {
			let stacked = this.stack(data, i => false);
			let opts = {
				...this.getSize(),
				plugins: [
					this.customLegend(),
				],
				bands: stacked.bands,
				cursor: {
					points: {
						size: (u, seriesIdx) => u.series[seriesIdx].points.size * 0.85,
						width: (_u, _seriesIdx, size) => size / 4,
					},
					x: false,
					y: false
				},
				hooks: {
					setSeries: [
						(u, i) => {
							let stacked = this.stack(data, i => !u.series[i].show);
							u.delBand(null);
							stacked.bands.forEach(b => u.addBand(b));
							u.setData(stacked.data);
						}
					],
				},
				legend: {
					live: true,
				},
				select: {
					show: false,
				},
				series: this.$props.chartseries,
				axes: [
					{
						stroke: "#c7d0d9",
						grid: {
							width: 1 / devicePixelRatio,
							stroke: "#2c3235",
						},
						ticks: {
							width: 1 / devicePixelRatio,
							stroke: "#2c3235",
						}
					},
					{
						stroke: "#c7d0d9",
						grid: {
							width: 1 / devicePixelRatio,
							stroke: "#2c3235",
						},
						ticks: {
							width: 1 / devicePixelRatio,
							stroke: "#2c3235",
						},
					},
				],
				scales: {
					x: {
						time: true,
					},
					y: this.yscale && this.yscale.length ? {
						auto: false,
						range: this.yscale,
					} : { auto: true },
				}
			};
			this.chart = new uPlot(opts, stacked.data, this.$refs.uniqueName);
			// Init mouseenter and mouseleave event for freezing the charts
			// and setting the legend correctly
			this.initMouseEvent();
		},
		getSize: function() {
			return {
				width: this.$refs.uniqueName.clientWidth,
				height: 200,
			}
		},
		setChartSize: function (_event) {
			if (this.chart) {
				this.chart.setSize(this.getSize());
			}
		}
	},

	beforeDestroy: function() {
		window.removeEventListener('resize', this.setChartSize);
	}
}
</script>
