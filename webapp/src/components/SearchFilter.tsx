export default function SearchFilter({ filter, setFilter }) {
	return (
		<div className='input-group mb-3'>
			<div className='input-group-prepend'>
				<span className='input-group-text' style={{ borderRadius: '5px 0 0 5px' }}>
					<i className='bi bi-search' />
				</span>
			</div>
			<input
				onChange={e => setFilter(e.target.value || '')}
				type='text'
				className='form-control'
				placeholder='Search'
			/>
		</div>
	);
}
