const MomentLocalesPlugin = require('moment-locales-webpack-plugin')

module.exports = {
	lintOnSave: false,
	devServer: {
		host: 'localhost',
	},
	configureWebpack: {
		plugins: [
			new MomentLocalesPlugin()
		]
	}
}