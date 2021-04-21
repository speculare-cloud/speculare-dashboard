import moment from 'moment';
import uPlot from 'uplot';

const _spline = uPlot.paths.spline();

const sanitizeGraphData = {
    methods: {
        splineGraph: function(u, seriesIdx, idx0, idx1, extendGap, buildClip) {
            return _spline(u, seriesIdx, idx0, idx1, extendGap, buildClip);
        },
        sanitizeGraphData(dataSize, scaleTime, chartLabels, throttleshot, spliceData, nullData) {
            // Be sure the date are following in order (by 1s for now)
            const now = moment().utc().unix();
            const min = moment.utc().subtract(scaleTime, 'seconds').unix();
            for (let i = dataSize - 1; i >= 0; i--) {
                // Iterate in the reverse order, and find if any missing data from the lastest we have
                // Also compare start against current time, if over 5s, might be some missing data

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