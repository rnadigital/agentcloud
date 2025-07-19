import ChatAppForm2 from 'components/ChatAppForm2';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle
} from 'modules/components/ui/sheet';
import { App, AppType } from 'struct/app';
import { SharingMode } from 'struct/sharing';

const EditChatAppSheet = ({
	open,
	setOpen,
	selectedApp,
	onAppUpdate,
	toolChoices,
	modelChoices,
	agentChoices,
	fetchFormData // Add this prop
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	selectedApp: App;
	onAppUpdate: () => void;
	toolChoices: any[];
	modelChoices: any[];
	agentChoices: any[];
	fetchFormData: () => Promise<void>; // Add this type
}) => {
	// Add default values for missing properties
	const enrichedApp = {
		...selectedApp,
		chatAppConfig: {
			...selectedApp?.chatAppConfig,
			maxMessages: selectedApp?.chatAppConfig?.maxMessages || 30
		},
		sharingConfig: {
			...selectedApp?.sharingConfig,
			mode: selectedApp?.sharingConfig?.mode || SharingMode.TEAM,
			permissions: selectedApp?.sharingConfig?.permissions || {}
		},
		description: selectedApp?.description || '',
		name: selectedApp?.name || 'Untitled Chat App',
		type: selectedApp?.type || AppType.CHAT
	};

	return (
		<Sheet
			open={open}
			onOpenChange={open => {
				if (!open) {
					// Force a slight delay before resetting pointer events
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
					<SheetTitle>Edit App</SheetTitle>
					<SheetDescription>Modify your app settings and configuration.</SheetDescription>
				</SheetHeader>
				<div className='mt-4 overflow-auto max-h-[80vh]'>
					<ChatAppForm2
						fetchFormData={fetchFormData}
						app={enrichedApp}
						editing={true}
						callback={() => {
							setOpen(false);
							onAppUpdate();
						}}
						toolChoices={toolChoices} // Pass these from parent if available
						modelChoices={modelChoices} // Pass these from parent if available
						agentChoices={agentChoices} // Pass these from parent if available
						whiteListSharingChoices={Object.values(enrichedApp.sharingConfig.permissions || {})}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default EditChatAppSheet;
