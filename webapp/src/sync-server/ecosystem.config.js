module.exports = {
	apps: [
		{
			script: 'npm run dev:sync-main',
			watch: true,
			ignore_watch: [
				'node_modules',
				'src/components',
				'src/pages',
				'src/context',
				'\\.next',
				'\\.dist',
				'tsconfig.tsbuildinfo',
				'.DS_Store',
				'src/test'
			],
			env: {
				DEBUG: 'webapp:*,sync-server:*',
				DEBUG_COLORS: true
			}
		}
		// {
		// 	script: 'npm run dev:sync-worker',
		// 	watch: true,
		// 	ignore_watch: [
		// 		'node_modules',
		// 		'src/components',
		// 		'src/pages',
		// 		'src/context',
		// 		'\\.next',
		// 		'\\.dist',
		// 		'tsconfig.tsbuildinfo',
		// 		'.DS_Store',
		// 		'src/test'
		// 	],
		// 	env: {
		// 		DEBUG: 'sync-server:main',
		// 		DEBUG_COLORS: true
		// 	}
		// }
	]
};
