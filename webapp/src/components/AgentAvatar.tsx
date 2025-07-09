import Blockies from 'react-blockies';
import StorageProviderFactory from 'storage/index';

export default function AgentAvatar({ agent, fill = false, size = 10 }) {
	let storageProvider;
	try {
		storageProvider = StorageProviderFactory.getStorageProvider();
	} catch (error) {
		console.warn('Storage provider not available:', error);
		storageProvider = null;
	}

	return (
		<span className='rounded-full overflow-hidden'>
			{agent?.icon?.filename && storageProvider ? (
				<img
					className={`object-cover ${fill ? 'w-full h-full' : `h-${size} w-${size}`}`}
					src={`${storageProvider.getBasePath()}/${agent.icon.filename}`}
				/>
			) : (
				agent?.name && <Blockies seed={agent?.name} size={size} />
			)}
		</span>
	);
}
