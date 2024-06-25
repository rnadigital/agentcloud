import { createTeamTool } from "db/teamTool";


export async function addTeamToolApi(req, res, next) {
    try {
        const { teamId, toolId, apiKeys } = req.body;

        if (!teamId || !toolId) {
            return res.status(400).json({ error: 'teamId and toolId are required' });
        }

        const newTeamTool = {
            teamId,
            toolId,
            apiKeys: apiKeys || new Map(),
        };

        const createdTeamTool = await createTeamTool(newTeamTool);
        return res.status(201).json(createdTeamTool);
    } catch (error) {
        next(error);
    }
}