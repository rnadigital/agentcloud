import * as API from '@api';
import { CubeIcon, PlusIcon } from '@heroicons/react/20/solid';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import VariableTable from 'components/variables/VariableTable';
// import VariableCards from 'components/VariableCards'; // Assuming you have a VariableCards component
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function Variables(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { variables } = state;
	const filteredVariables = variables?.filter(x => !x.hidden);

	async function fetchVariables() {
		await API.getVariables({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVariables();
	}, [resourceSlug]);

	if (!variables) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Variables - ${teamName}`}</title>
			</Head>

			<PageTitleWithNewButton
				list={filteredVariables}
				title='Variables'
				buttonText='New Variable'
				href='/variable/add'
			/>

			<VariableTable variables={filteredVariables} fetchVariables={fetchVariables} />

			{variables.length === 0 && (
				<NewButtonSection
					link={`/${resourceSlug}/variable/add`}
					emptyMessage={'No variables'}
					message={'Get started by adding variables.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'Add Variable'}
				/>
			)}
		</>
	);
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
