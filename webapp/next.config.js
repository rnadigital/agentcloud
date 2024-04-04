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
	webpack(config) {
		config.resolve.fallback = {
			// if you miss it, all the other options in fallback, specified
			// by next.js will be dropped.
			...config.resolve.fallback,
			fs: false,
			path: false,
			net: false,
			child_process: false,
			tls: false,
		};
		return config;
	},
};
