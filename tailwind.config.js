module.exports = {
	purge: {
		// In debug mode this can cause the page to take a long
		// time to load. The css is +/- 15mb.
		enabled: process.env.NODE_ENV === 'production' || true,
		content: ['./public/index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
	},
	variants: {},
	plugins: []
}
