module.exports = {
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'vue/max-attributes-per-line': ['error', {
			'singleline': {
				'max': 4,
			},
			'multiline': {
				'max': 4,
			}
		}],
		'vue/html-closing-bracket-newline': ['error', {
			'singleline': 'never',
			'multiline': 'never'
		}],
		'new-cap': 'off',
		'camelcase': 'off',
		'no-tabs': 0,
		'indent': [2, 'tab'],
		'vue/script-indent': ['error', 'tab', {
			'baseIndent': 0,
			'switchCase': 0,
			'ignores': []
		}],
		'vue/html-indent': ['error', 'tab', {
			'attribute': 1,
			'baseIndent': 1,
			'closeBracket': 0,
			'alignAttributesVertically': true,
			'ignores': []
		}],
		'vue/no-multi-spaces': 'off',
		'vue/multi-word-component-names': 'off',
	},

	root: true,

	env: {
		node: true
	},

	extends: [
		'plugin:vue/base',
		'plugin:vue/vue3-essential',
		'plugin:vue/vue3-strongly-recommended',
		'eslint:recommended'
	],

	parser: "vue-eslint-parser"
}