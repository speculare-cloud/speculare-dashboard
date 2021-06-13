const MomentLocalesPlugin = require('moment-locales-webpack-plugin')

module.exports = {
	lintOnSave: false,
	devServer: {
		host: 'localhost',
		overlay: {
			warnings: true,
			errors: true
		}
	},
	configureWebpack: {
		plugins: [
			new MomentLocalesPlugin()
		]
	}
}
