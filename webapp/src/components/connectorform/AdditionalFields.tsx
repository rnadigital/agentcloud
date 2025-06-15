import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface AdditionalField {
	key: string;
	value: string;
}

const AdditionalFields = () => {
	const { unregister, setValue } = useFormContext();

	const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);

	const addField = () => {
		setAdditionalFields([...additionalFields, { key: '', value: '' }]);
	};

	const handleKeyChange = (index: number, key: string) => {
		const newFields = [...additionalFields];
		if (newFields[index].key) {
			unregister(newFields[index].key);
		}
		newFields[index].key = key;
		setAdditionalFields(newFields);
		setValue(key, newFields[index].value);
	};

	const handleValueChange = (index: number, value: string) => {
		const newFields = [...additionalFields];
		newFields[index].value = value;
		setAdditionalFields(newFields);
		if (newFields[index].key) {
			setValue(newFields[index].key, value);
		}
	};

	const deleteField = (index: number) => {
		const newFields = [...additionalFields];
		if (newFields[index].key) {
			unregister(newFields[index].key);
		}
		newFields.splice(index, 1);
		setAdditionalFields(newFields);
	};

	return (
		<div className='mb-2 flex flex-col gap-2'>
			{additionalFields.map((field, index) => (
				<div key={index} className='flex gap-2 items-end'>
					<div className='flex-1'>
						<label className='text-sm text-foreground'>Key</label>
						<input
							className='mt-2 block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6 px-2'
							type='text'
							placeholder='Key'
							value={field.key}
							onChange={e => handleKeyChange(index, e.target.value)}
						/>
					</div>

					<div className='flex-1'>
						<label className='text-sm text-foreground'>Value</label>
						<input
							className='mt-2 block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6 px-2'
							type='text'
							placeholder='Value'
							value={field.value}
							onChange={e => handleValueChange(index, e.target.value)}
						/>
					</div>

					<button
						className='border border-destructive p-1 ml-auto mr-2 h-fit rounded-md text-destructive hover:bg-destructive/10 transition-colors'
						type='button'
						onClick={() => deleteField(index)}>
						Delete
					</button>
				</div>
			))}

			<button
				className='border border-primary p-1 mr-auto mt-2 rounded-md text-primary hover:bg-primary/10 transition-colors'
				type='button'
				onClick={addField}>
				Add additional key value pairs
			</button>
		</div>
	);
};

export default AdditionalFields;
