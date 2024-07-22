import Blockies from 'react-blockies';
import StorageProviderFactory from 'storage/index';

export default function AgentAvatar({ agent, fill = false, size = 10 }) {
	const storageProvider = StorageProviderFactory.getStorageProvider();
	return (
		<span className='rounded-full overflow-hidden'>
			{agent?.icon?.filename ? (
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
