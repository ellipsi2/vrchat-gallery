const env = require('./env.cjs');

module.exports = {
	apps: [
		{
			name: 'vrc',
			script: './build/index.js',
			env: {
				NODE_ENV: 'production',
                PORT: 4012,
                ...env,
			},
			env_development: {
				NODE_ENV: 'development',
                PORT: 5999,
				...env
			},
		},
	],
};
