const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
    devServer: {
        host: "localhost"
    },
    configureWebpack: {
        plugins: [
            new MomentLocalesPlugin(),
        ]
    }
}