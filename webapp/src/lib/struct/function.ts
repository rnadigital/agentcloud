export type DeployFunctionArgs = {
	code: string;
	requirements: string;
	id: string;
	runtime?: string;
	environmentVariables?: Record<string, string>;
};

//Runtime optiosn for google cloud functions, used in tool form
export const runtimeOptions = [
	{ label: 'Python 3.12', value: 'python312' },
	{ label: 'Python 3.11', value: 'python311' },
	{ label: 'Python 3.10', value: 'python310' },
	{ label: 'Python 3.9', value: 'python39' },
	{ label: 'Python 3.8', value: 'python38' }
];

export const runtimeValues = runtimeOptions.map(x => x.value);
