import Link from 'next/link';
import { withRouter } from 'next/router';

const labelStyles = { width: 16, height: 16 };

export default withRouter(function MenuLinks({ router }) {
	return (
		<>
			<Link
				href='/'
				className='d-flex align-items-center mb-3 mb-md-0 text-body text-decoration-none'
			>
				<span className='mx-2 fs-4 text-decoration-none'>Agent Cloud</span>
			</Link>
			<hr />
			<ul className='nav nav-pills flex-column mb-auto'>
				<li className='nav-item'>
					<Link
						href='/account'
						className={router.pathname === '/account' ? 'nav-link active' : 'nav-link text-body'}
						aria-current='page'
					>
						<i className='bi-person-square pe-none me-2' style={labelStyles} />
						Account
					</Link>
				</li>
			</ul>
			<hr />
			<ul className='nav nav-pills flex-column'>
				<li className='nav-item'>
					<form action='/forms/logout' method='POST'>
						<button className='nav-link text-body' type='submit'>
							<i className='bi-door-open pe-none me-2' style={labelStyles} />
							Logout
						</button>
					</form>
				</li>
			</ul>
		</>
	);
});
