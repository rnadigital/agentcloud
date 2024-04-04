import Blockies from 'react-blockies';
import StorageProviderFactory from 'storage/index';
const storageProvider = StorageProviderFactory.getStorageProvider();

export default function AgentAvatar({ agent, fill=false, size=16 }) {
	return <span className='rounded-full overflow-hidden'>
		{agent?.icon?.filename
			? <img className={`object-cover ${fill ? 'w-full h-full' : `h-${size} w-${size}`}`} src={`${storageProvider.getBasePath()}/${agent.icon.filename}`} />
			: <Blockies seed={agent?.name} size={16} />}
	</span>;
}
