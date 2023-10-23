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
};
