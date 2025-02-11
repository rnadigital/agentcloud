import { Separator } from 'modules/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'modules/components/ui/dialog';
import ApiKeyForm from './apikeys/ApiKeyForm';

export default function CreateModelModal({
	open,
	setOpen,
	callback
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	callback: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='text-2xl'>New Model</DialogTitle>
					<Separator />
				</DialogHeader>
				<ApiKeyForm callback={callback} />
			</DialogContent>
		</Dialog>
	);
}
