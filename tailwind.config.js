module.exports = {
	mode: 'jit',
	purge: {
		enabled: process.env.NODE_ENV,
		content: ['./public/index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
	},
	variants: {},
	plugins: []
}
