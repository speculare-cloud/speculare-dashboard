import moment from 'moment';
import uPlot from 'uplot';

const _spline = uPlot.paths.spline();

const sanitizeGraphData = {
    methods: {
        getBaseUrl: function(table, uuid) {
            return this.$apiBaseUrl + '/api/' + table + '?uuid=' + uuid;
        },
        getMinMaxNowString: function(scaleTime) {
            // Substract vm.scaleTime seconds as this is pretty much the minimum time for the graph
            let min = moment().utc().subtract(scaleTime + 5, 'seconds').format("YYYY-MM-DDTHH:mm:ss.SSS");
            // Add 5 seconds to minimize the risks of missing data
            let max = moment().utc().add(5, 'seconds').format("YYYY-MM-DDTHH:mm:ss.SSS");
            return '&min_date=' + min + '&max_date=' + max;
        },
        splineGraph: function(u, seriesIdx, idx0, idx1, extendGap, buildClip) {
            return _spline(u, seriesIdx, idx0, idx1, extendGap, buildClip);
        },
        sanitizeGraphData(dataSize, scaleTime, chartLabels, throttleshot, spliceData, nullData) {
            // Be sure the date are following in order (by 1s for now)
            const now = moment().utc().unix();
            const min = moment.utc().subtract(scaleTime, 'seconds').unix();
            for (let i = dataSize - 1; i >= 0; i--) {
                // Iterate in the reverse order, and find if any missing data from the lastest we have
                // Also compare start against current time, if over throttleshot, might be some missing data

                // If the current data is too old, get rid of it
                if (chartLabels[i] < min) {
                    // console.log("Data too old for => ", i);
                    spliceData(i);
                    continue;
                }

                if (i == dataSize - 1) {
                    // Check against now to see if we're missing starting data
                    if (!(now - throttleshot <= chartLabels[i] && chartLabels[i] <= now + throttleshot)) {
                        // Change last labels by now to ensure gap if no previous data
                        chartLabels[i] = now;
                        nullData(i);
                    }
                } else {
                    if (chartLabels[i + 1] > chartLabels[i] + throttleshot) {
                        // Don't need to change the Labels, uPlot already handle this
                        nullData(i);
                    }
                }
            }
        }
    }
}

export default sanitizeGraphData