'use strict';

import React, { useState } from 'react';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';

export default function GroupForm({ group = {}, editing }: { group?: any, editing?: boolean }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;

	const router = useRouter();
	const [groupState, setGroup] = useState(group);
	const [error, setError] = useState();

	const { _id, name, agents } = groupState;

	async function groupPost(e) {
		e.preventDefault();
		if (editing) {			
			await API.editGroup(groupState._id, {
				_csrf: e.target._csrf.value,
				//TODO: edit group data
			}, null, setError, null);
			toast.success('Group Updated');
		} else {
			API.addGroup({
				_csrf: e.target._csrf.value,
				//TODO: add group data
			}, null, setError, router);
		}
	}

	return (<form onSubmit={groupPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>

		<div className='space-y-12'>

		</div>

		<div className='mt-6 flex items-center justify-end gap-x-6'>
			<button type='button' className='text-sm font-semibold leading-6 text-gray-900'>
					Cancel
			</button>
			<button
				type='submit'
				className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
					Save
			</button>
		</div>
	</form>);

}
