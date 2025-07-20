import CrewAppForm2 from 'components/CrewAppForm2';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle
} from 'modules/components/ui/sheet';
import { App, AppType } from 'struct/app';
import { SharingMode } from 'struct/sharing';

const EditCrewAppSheet = ({
	open,
	setOpen,
	selectedApp,
	onAppUpdate,
	toolChoices,
	modelChoices,
	agentChoices,
	taskChoices,
	variableChoices,
	fetchFormData
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	selectedApp: App;
	onAppUpdate: () => void;
	toolChoices: any[];
	modelChoices: any[];
	agentChoices: any[];
	taskChoices: any[];
	variableChoices: any[];
	fetchFormData: () => Promise<void>;
}) => {
	const enrichedApp = {
		...selectedApp,
		crew: {
			...(selectedApp as any)?.crew,
			process: (selectedApp as any)?.crew?.process || 'sequential',
			agents: (selectedApp as any)?.crew?.agents || [],
			tasks: (selectedApp as any)?.crew?.tasks || [],
			verbose: (selectedApp as any)?.crew?.verbose || 0,
			fullOutput: (selectedApp as any)?.crew?.fullOutput || false
		},
		sharingConfig: {
			...selectedApp?.sharingConfig,
			mode: selectedApp?.sharingConfig?.mode || SharingMode.TEAM,
			permissions: selectedApp?.sharingConfig?.permissions || {}
		},
		description: selectedApp?.description || '',
		name: selectedApp?.name || 'Untitled Crew App',
		type: selectedApp?.type || AppType.CREW
	};

	return (
		<Sheet
			open={open}
			onOpenChange={open => {
				if (!open) {
					setTimeout(() => {
						document.body.style.pointerEvents = 'auto';
						document.body.style.cursor = 'auto';
					}, 100);
				}
				setOpen(open);
			}}>
			<SheetContent
				size='xl'
				className='w-full overflow-visible'
				style={{
					pointerEvents: 'auto',
					overflow: 'visible'
				}}>
				<SheetHeader>
					<SheetTitle>Edit Crew App</SheetTitle>
					<SheetDescription>Modify your crew app settings and configuration.</SheetDescription>
				</SheetHeader>
				<div className='mt-4 overflow-auto max-h-[80vh]'>
					<CrewAppForm2
						fetchFormData={fetchFormData}
						app={enrichedApp}
						crew={enrichedApp.crew}
						editing={true}
						callback={() => {
							setOpen(false);
							onAppUpdate();
						}}
						toolChoices={toolChoices}
						modelChoices={modelChoices}
						agentChoices={agentChoices}
						taskChoices={taskChoices}
						variableChoices={variableChoices}
						whiteListSharingChoices={Object.values(enrichedApp.sharingConfig.permissions || {})}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default EditCrewAppSheet;
