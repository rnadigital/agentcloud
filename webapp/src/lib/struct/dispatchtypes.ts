import { Dispatch, SetStateAction } from 'react';

import { TeamModelResponse } from './teammodels';

export type GetTeamModelsDispatch = Dispatch<SetStateAction<TeamModelResponse>>;
