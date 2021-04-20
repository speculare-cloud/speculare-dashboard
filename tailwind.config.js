module.exports = {
    purge: {
        enabled: process.env.NODE_ENV,
        content: ['./public/index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
    },
    theme: {
        extend: {
            screens: {
                'dark-mode': { 'raw': '(prefers-color-scheme: dark)' },
            },
        },
    },
    variants: {},
    plugins: [],
};