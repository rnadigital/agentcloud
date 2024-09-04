import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';

export default function Index() {
	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;

	const router = useRouter();

	if (!account) {
		router.push('/login');
	} else {
		router.push(`/${account.currentTeam}/apps`);
	}

	return null;
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
