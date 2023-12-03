import dynamic from 'next/dynamic';
// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});

export default function FunctionCard({ name, description, parameters, onClickFunction, highlighted }) {

	// Filter out parameters starting with __
	const paramNames = Object.keys(parameters).filter(p => !p.startsWith('__'));

	return (
		<div className={`p-4 overflow-hidden border rounded shadow-sm cursor-pointer ${highlighted ? 'bg-yellow-100 hover:bg-yellow-100' : 'hover:bg-yellow-50'}`} onClick={onClickFunction}>
			<h3 className='text-lg font-semibold'>{name}</h3>
			<p className='text-gray-600'>
				<Markdown
					className={'markdown-content'}
				>
					{description}
				</Markdown>
			</p>
			{/*<ul>
				{paramNames.map(param => (
					<li key={param}>{param}</li>
				))}
			</ul>*/}
		</div>
	);
}
