import moment from 'moment'
import uPlot from 'uplot'

const _spline = uPlot.paths.spline()

const sanitizeGraphData = {
	methods: {
		handleGraphRangeChange: function (newVal, oldVal, cleaning, fetching, handleWebSocket, connection) {
			if (newVal.start != null) {
				// Clear the data and close the websocket
				cleaning()
				// Refetch the data
				fetching()
			} else {
				// TODO - Optimize: (can be tricky to optimize as we'll have a diff granularity).
				// We could only fetch the new data, since the oldest data to the targeted time of the scale.
				// That way we can avoid cleaning and refetching everything (which is time consuming).
				// Also we can introduce something like "take 1 value every 10" on the server side if the scale is big enough.

				if (newVal.scale != null) {
					// Clear the data and close the websocket if needed
					cleaning(newVal.scale !== 300)
					// Check if we have to open the WS (if we're trying to get the last 5 minutes)
					if (newVal.scale === 300 && connection === null) {
						// Open the websocket and refetch the data
						handleWebSocket()
					} else {
						// Refetch the data
						fetching()
					}
				} else {
					// If we're here, this means that we cleared the selection and so we fallback to the default value for scale.
					// We have to check if previous scale was 300, if it is we don't do anything, else we clean + handle/fetch.
					if (oldVal.scale !== null && oldVal.scale !== 300) {
						cleaning()
						handleWebSocket()
					}
				}
			}
		},
		intValueOrTilde: function (val, dec) {
			return val == null ? '-' : val.toFixed(dec)
		},
		getBaseUrl: function (table, uuid) {
			return this.$apiBaseUrl + '/api/' + table + '?uuid=' + uuid
		},
		getMinMaxString: function (start, end) {
			return '&min_date=' + start + '&max_date=' + end
		},
		getMinMaxNowString: function (scaleTime) {
			// Substract vm.scaleTime seconds as this is pretty much the minimum time for the graph
			const min = moment().utc().subtract(scaleTime + 5, 'seconds').format('YYYY-MM-DDTHH:mm:ss.SSS')
			// Add 5 seconds to minimize the risks of missing data
			const max = moment().utc().add(5, 'seconds').format('YYYY-MM-DDTHH:mm:ss.SSS')
			return '&min_date=' + min + '&max_date=' + max
		},
		splineGraph: function (u, seriesIdx, idx0, idx1, extendGap, buildClip) {
			return _spline(u, seriesIdx, idx0, idx1, extendGap, buildClip)
		},
		sanitizeGraphData (dataSize, scaleTime, chartLabels, throttleshot, spliceData, nullData) {
			// Be sure the date are following in order (by 1s for now)
			const now = moment().utc().unix()
			const min = moment.utc().subtract(scaleTime, 'seconds').unix()
			for (let i = dataSize - 1; i >= 0; i--) {
				// Iterate in the reverse order, and find if any missing data from the lastest we have
				// Also compare start against current time, if over throttleshot, might be some missing data

				// If the current data is too old, get rid of it
				if (chartLabels[i] < min) {
					spliceData(i, 1)
					continue
				}

				if (i === dataSize - 1) {
					// Check against now to see if we're missing starting data
					if (!(now - throttleshot <= chartLabels[i] && chartLabels[i] <= now + throttleshot)) {
						// Change last labels by now to ensure gap if no previous data
						chartLabels[i] = now
						nullData(i)
					}
				} else {
					if (chartLabels[i + 1] > chartLabels[i] + throttleshot) {
						// Don't need to change the Labels, uPlot already handle this
						nullData(i)
					}
				}
			}
		}
	}
}

export default sanitizeGraphData
