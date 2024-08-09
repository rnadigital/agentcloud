import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
	// The setInitialTheme function sets the initial theme of the application based on the user's preference stored in localStorage or the system's color scheme.
	const setInitialTheme = `
    (function() {
      const theme = localStorage.getItem('theme') || 'light';
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.add('dark');
        document.documentElement.style.backgroundColor = '#1a202c';
      } else {
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.remove('dark');
        document.documentElement.style.backgroundColor = '#f7fafc';
        localStorage.setItem('theme', theme);
      }
    })();
  `;
	return (
		<Html>
			<Head />
			<body className='h-full scroll-smooth'>
				<Main />
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
				<script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
			</body>
		</Html>
	);
}
