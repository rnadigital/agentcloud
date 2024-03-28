import Blockies from 'react-blockies';
export default function AgentAvatar({ agent }) {
	console.log('agent', agent);
	return agent?.icon?.filename
		? <img src={`https://storage.googleapis.com/${process.env.NEXT_PUBLIC_GCS_BUCKET_NAME}/${agent.icon.filename}`} />
		: <Blockies seed={agent?.name} size={16} />;
}
