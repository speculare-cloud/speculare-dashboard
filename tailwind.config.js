module.exports = {
    purge: {
        enabled: false,
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