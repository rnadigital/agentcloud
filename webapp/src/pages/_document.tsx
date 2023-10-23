import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {

	return (
		<Html>
			<Head />
			<body className='h-full scroll-smooth'>
				<Main />
				{/* <NextScript className='flex flex-col' /> */}
				<NextScript />
				<style>
					{`
						html, body, #__next {
						min-height: 100vh;
						display: flex;
						flex-direction: column;
						/*overflow: hidden;*/
						}
					`}
				</style>
			</body>
		</Html>
	);

}
