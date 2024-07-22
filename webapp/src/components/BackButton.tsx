import Link from 'next/link';

const labelStyles = { width: 16, height: 16 };

export default function BackButton({ to }) {
	return (
		<Link href={to} className='btn btn-sm btn-primary mt-3 ms-1 ps-2'>
			<i className='bi-chevron-left pe-2' style={labelStyles} />
			Back
		</Link>
	);
}
