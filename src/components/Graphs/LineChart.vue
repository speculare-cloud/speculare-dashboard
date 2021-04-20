<template>
	<div ref="uniqueName" class="w-100"></div>
</template>

<script>
import uPlot from 'uplot';

export default {
	name: 'LineChart',
	props: {
		chartdata: {
			type: Array,
			default: null
    	},
		chartseries: Array,
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
				this.chart.setData(newData);
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
		createChart: function(data) {
			let opts = {
				...this.getSize(),
				cursor: {
					points: {
						size: (u, seriesIdx) => u.series[seriesIdx].points.size * 0.85,
						width: (_u, _seriesIdx, size) => size / 4,
					},
					x: false,
					y: false
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
						}
					},
				],
				scales: {
					x: {
						time: true,
					},
					y: {
						auto: true,
					},
				}
			};
			this.chart = new uPlot(opts, data, this.$refs.uniqueName);
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
