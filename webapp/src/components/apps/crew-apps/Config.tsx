import SharingModeSelect from 'components/SharingModeSelect';
import { MultiSelect } from 'modules/components/multi-select';
import { Card, CardContent } from 'modules/components/ui/card';
import { Checkbox } from 'modules/components/ui/checkbox';
import { Input } from 'modules/components/ui/input';
import { Label } from 'modules/components/ui/label';

export function Config({
	combinedVariables,
	setKickOffVariables,
	sharingMode,
	setSharingMode,
	shareLinkShareId,
	setShareLinkShareId,
	shareEmail,
	setShareEmail,
	setModalOpen,
	sharingEmailState,
	initialEmails,
	setSharingEmailState,
	fullOutput,
	setFullOutput,
	appCache,
	setAppCache,
	appMemory,
	setAppMemory,
	verboseInt,
	setVerboseInt
}: {
	combinedVariables: any[];
	setKickOffVariables: any;
	sharingMode: any;
	setSharingMode: any;
	shareLinkShareId: any;
	setShareLinkShareId: any;
	shareEmail: any;
	setShareEmail: any;
	setModalOpen: any;
	sharingEmailState: any;
	initialEmails: any;
	setSharingEmailState: any;
	fullOutput: any;
	setFullOutput: any;
	appCache: any;
	setAppCache: any;
	appMemory: any;
	setAppMemory: any;
	verboseInt: any;
	setVerboseInt: any;
}) {
	return (
		<Card>
			<CardContent className='pt-6 space-y-8 bg-gray-100 text-sm'>
				<div>
					<Label htmlFor='verbosity' className='text-gray-900'>
						Verbosity Level
					</Label>
					<div className='text-gray-500 mb-2'>
						Controls if agent actions and thoughts are shown. Zero shows only final answers.
					</div>
					<Input
						id='verbosity'
						type='number'
						placeholder='0'
						className='w-full'
						value={verboseInt}
						onChange={e => setVerboseInt(parseInt(e.target.value))}
					/>
				</div>

				{combinedVariables?.length > 0 && (
					<div>
						<Label>Variables</Label>
						<MultiSelect
							options={combinedVariables.map(v => ({
								label: v.name,
								value: v._id.toString()
							}))}
							onValueChange={(value: string[]) => {
								setKickOffVariables(value.map(v => ({ label: v, value: v })));
							}}
							placeholder='Select variables'
							className='w-full'
						/>
					</div>
				)}

				<SharingModeSelect
					sharingMode={sharingMode}
					setSharingMode={setSharingMode}
					showInfoAlert
					setShareLinkShareId={setShareLinkShareId}
					shareLinkShareId={shareLinkShareId}
					emailState={sharingEmailState}
					emailOptions={initialEmails}
					onChange={setSharingEmailState}
					setModalOpen={x => {
						setModalOpen('whitelist');
					}}
					shareEmail={shareEmail}
					setShareEmail={setShareEmail}
				/>

				<div className='grid lg:grid-cols-3 gap-8'>
					<div>
						<div className='flex items-center space-x-2 mb-2'>
							<Checkbox
								id='full-output'
								checked={fullOutput}
								onCheckedChange={e => setFullOutput(e)}
							/>
							<Label htmlFor='full-output' className='font-medium'>
								Full final output
							</Label>
						</div>
						<div className='text-gray-500'>
							Show complete, detailed output after process completion.
						</div>
					</div>

					<div>
						<div className='flex items-center space-x-2 mb-2'>
							<Checkbox
								id='cache-results'
								checked={appCache}
								onCheckedChange={e => setAppCache(e)}
							/>
							<Label htmlFor='cache-results' className='font-medium'>
								Cache Tool Results
							</Label>
						</div>
						<div className='text-gray-500'>
							Save tool outputs to reuse them for faster future runs.
						</div>
					</div>

					<div>
						<div className='flex items-center space-x-2 mb-2'>
							<Checkbox
								id='enable-memory'
								checked={appMemory}
								onCheckedChange={e => setAppMemory(e)}
							/>
							<Label htmlFor='enable-memory' className='font-medium'>
								Enable Memory
							</Label>
							<span className='text-sm text-gray-500'>(Experimental)</span>
						</div>
						<div className='text-gray-500'>
							Allow agents to retain memory across tasks for smarter interactions.
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
