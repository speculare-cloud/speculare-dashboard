const MomentLocalesPlugin = require('moment-locales-webpack-plugin')

module.exports = {
	lintOnSave: false,
	configureWebpack: {
		plugins: [
			new MomentLocalesPlugin()
		]
	}
}