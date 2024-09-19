import { SubmitHandler, useForm } from 'react-hook-form';
import { VariableConfig } from 'struct/app';

interface SessionVariableFormProps {
	variables?: VariableConfig[];
	onSubmit: (variableValues: { [key: string]: string }) => void;
}

interface FormValues {
	[key: string]: string;
}

export default function SessionVariableForm({ variables, onSubmit }: SessionVariableFormProps) {
	const { register, handleSubmit } = useForm<FormValues>();

	const handleFormSubmit: SubmitHandler<FormValues> = data => {
		const finalValues = { ...data };
		variables.forEach(variable => {
			if (!finalValues[variable.name]) {
				finalValues[variable.name] = variable.defaultValue;
			}
		});
		onSubmit(finalValues);
	};

	return (
		<div className='flex justify-center items-center mt-4'>
			<form
				onSubmit={handleSubmit(handleFormSubmit)}
				className='bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md w-full max-w-lg'
			>
				<h3 className='text-lg font-medium leading-6 text-gray-900 dark:text-white text-center mb-4'>
					Enter Session Values
				</h3>
				<div>
					{variables?.map(variable => (
						<div key={variable.name} className='mt-4'>
							<label
								htmlFor={variable.name}
								className='block text-sm font-medium text-gray-700 dark:text-gray-300 text-left'
							>
								{variable.name}
							</label>
							<input
								type='text'
								{...register(variable.name)}
								id={variable.name}
								placeholder={variable.defaultValue}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white'
							/>
						</div>
					))}
				</div>
				<div className='mt-5 sm:mt-6'>
					<button
						type='submit'
						className='inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm'
					>
						Submit
					</button>
				</div>
			</form>
		</div>
	);
}
