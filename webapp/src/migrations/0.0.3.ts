import debug from 'debug';
const log = debug('webapp:migration:0.0.3');

export default async function (db) {
	log('Terminating all existing sessions, and removing their agents array');
	await db.collection('sessions').updateMany(
		{},
		{
			$set: {
				status: 'terminated'
			},
			$unset: {
				agents: ''
			}
		}
	);
	log('For each group, take the first agent and make it adminAgent, and remove it from the array.');
	const groups = await db.collection('groups').find().toArray();
	for (let g of groups) {
		const newAdminAgent = g.agents[0];
		const newAgents = g.agents.slice(1);
		await db.collection('groups').updateOne(
			{
				_id: g._id
			},
			{
				$set: {
					agents: newAgents,
					adminAgent: newAdminAgent
				}
			}
		);
	}
}
