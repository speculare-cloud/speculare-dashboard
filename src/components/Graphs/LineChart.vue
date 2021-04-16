<template>
	<div ref="uniqueName" class="w-100" @mouseover="hover=true" @mouseleave="hover=false"></div>
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
		chartseries: Array
  	},

	data () {
		return {
			chart: null,
			hover: false,
			max: 0
		}
	},
	
	watch: {
		chartdata: function (newData, oldData) {
			if (oldData == null || !this.chart) {
				this.createChart(newData);
			} else if (!this.hover && this.chart) {
				// If the newData[1] contains more than 4000 items, use a for loop
				// https://medium.com/coding-at-dawn/the-fastest-way-to-find-minimum-and-maximum-values-in-an-array-in-javascript-2511115f8621
				let max = Math.max.apply(null, newData[1]);
				if (this.max != max) {
					this.chart.setScale('y', { min: 0, max: (max + (max / 10) + 5) });
				}
				this.chart.setData(newData);
			}
		}
	},

	mounted () {
		this.$nextTick(function() {
			window.addEventListener('resize', this.setChartSize);
		});
	},

	methods: {
		createChart: function(data) {
			this.max = Math.max.apply(null, data[1]);
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
				scales: {
					x: {
						time: true,
					},
					y: {
						auto: false,
						range: [0, this.max + (this.max / 10) + 5]
					},
				}
			};
			this.chart = new uPlot(opts, data, this.$refs.uniqueName);
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
