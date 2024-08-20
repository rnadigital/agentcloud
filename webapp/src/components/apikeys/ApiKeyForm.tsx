'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import ParameterForm from 'components/ParameterForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { NotificationType } from 'struct/notification';

export default function ToolForm({
	name,
	description,
	expirationDate,
	ownerId
}: {
	name: string;
	description: string;
	expirationDate: Date;
	ownerId: ObjectId | string;
}) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	const posthog = usePostHog();
	const [submitting, setSubmitting] = useState(false); // Add submitting state
}
