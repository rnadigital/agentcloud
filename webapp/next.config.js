module.exports = {
	images: {
		dangerouslyAllowSVG: true, //remove once we stop using the tailwind images
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'tailwindui.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				port: '',
				pathname: '/**',
			},
		],
	},
	webpack(config, { isServer }) {
		config.resolve.fallback = {
			// if you miss it, all the other options in fallback, specified
			// by next.js will be dropped.
			...config.resolve.fallback,
			fs: false,
			path: false,
			net: false,
			child_process: false,
			tls: false,
			events: false,
			stream: false,
			crypto: false,
			util: false,
			url: false,
			querystring: false,
			http: false,
			https: false,
			zlib: false,
			assert: false,
			os: false,
			buffer: false,
		};

		if (!isServer) {
			config.externals = config.externals || [];
			config.externals.push({
				'@google-cloud/storage': '@google-cloud/storage',
				'google-auth-library': 'google-auth-library',
				'gcp-metadata': 'gcp-metadata',
				'google-logging-utils': 'google-logging-utils',
			});
		}

		return config;
	},
};
