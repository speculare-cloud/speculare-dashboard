<template>
	<div ref="uniqueName" class="w-100" />
</template>

<script>
import uPlot from 'uplot'

export default {
	name: 'LineChart',
	props: {
		chartdata: {
			type: Array,
			default: null
		},
		chartseries: {
			type: Array,
			required: true
		},
		unit: {
			type: String,
			required: true
		},
		yscale: {
			type: Array,
			default: null
		}
	},

	data () {
		return {
			chart: null,
			hovered: false
		}
	},

	watch: {
		chartdata: function (newData, oldData) {
			if (oldData == null || !this.chart) {
				this.createChart(newData)
			} else if (!this.hovered && this.chart) {
				this.chart.setData(newData)
			}

			if (!this.hovered) {
				// Update the legend to the latest value
				this.chart.setLegend({ idx: newData[1].length - 1 }, false)
			}
		}
	},

	mounted () {
		// Add the event after the page has been rendered
		this.$nextTick(function () {
			window.addEventListener('resize', this.setChartSize)
		})
	},

	beforeUnmount: function () {
		window.removeEventListener('resize', this.setChartSize)
	},

	methods: {
		customLegend: function () {
			const vm = this

			function init (u, ) {
				const legendEl = u.root.querySelector('.u-legend')
				// Get the u-series corresponding to the Timestamp
				const time = legendEl.getElementsByClassName('u-series')[0]
				// Remove first elem of time, which is just the label "Time"
				time.firstChild.remove()
				// Assign some style change
				uPlot.assign(time.firstChild.style, {
					fontSize: '14px',
					color: 'rgb(189, 189, 193)'
				})
				// Create unit item - and insert it before time.firstChild
				const unit = document.createElement('td')
				const content = document.createTextNode(vm.unit)
				unit.appendChild(content)
				time.insertBefore(unit, time.firstChild)

				// Assign some style change
				uPlot.assign(time.style, {
					width: '100%',
					display: 'flex',
					webkitBoxPack: 'justify',
					justifyContent: 'space-between'
				})
				uPlot.assign(time.firstChild.style, {
					fontSize: '14px',
					color: 'rgb(189, 189, 193)'
				})
				uPlot.assign(legendEl.style, {
					paddingLeft: '35px',
					paddingRight: '25px'
				})
			}

			return {
				hooks: {
					init: init
				}
			}
		},
		initMouseEvent: function () {
			const vm = this

			// get the over part of the Graph as per uPlot doc
			const elems = this.$el.getElementsByClassName('u-over')
			// Add mouseleave event
			elems.item(0).addEventListener('mouseleave', () => {
				vm.hovered = false
				this.chart.setLegend({ idx: this.chartdata[1].length - 1 }, false)
			})
			// Add mouseenter event
			elems.item(0).addEventListener('mouseenter', () => {
				vm.hovered = true
			})
		},
		createChart: function (data) {
			const opts = {
				...this.getSize(),
				plugins: [
					this.customLegend()
				],
				cursor: {
					points: {
						size: (u, seriesIdx) => u.series[seriesIdx].points.size * 0.85,
						width: (_u, _seriesIdx, size) => size / 4
					},
					x: false,
					y: false
				},
				legend: {
					live: true
				},
				select: {
					show: false
				},
				series: this.$props.chartseries,
				axes: [
					{
						stroke: '#c7d0d9',
						grid: {
							width: 1 / devicePixelRatio,
							stroke: '#2c3235'
						},
						ticks: {
							width: 1 / devicePixelRatio,
							stroke: '#2c3235'
						}
					},
					{
						stroke: '#c7d0d9',
						grid: {
							width: 1 / devicePixelRatio,
							stroke: '#2c3235'
						},
						ticks: {
							width: 1 / devicePixelRatio,
							stroke: '#2c3235'
						}
					}
				],
				scales: {
					x: {
						time: true
					},
					y: this.yscale && this.yscale.length ? {
						auto: false,
						range: this.yscale
					} : { auto: true }
				}
			}
			this.chart = new uPlot(opts, data, this.$refs.uniqueName)
			// Init mouseenter and mouseleave event for freezing the charts
			// and setting the legend correctly
			this.initMouseEvent()
		},
		getSize: function () {
			return {
				width: this.$refs.uniqueName.clientWidth,
				height: 200
			}
		},
		setChartSize: function () {
			if (this.chart) {
				this.chart.setSize(this.getSize())
			}
		}
	}
}
</script>
