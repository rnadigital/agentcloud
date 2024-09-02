import { Dispatch, SetStateAction } from 'react';

import { Task } from './task';
import { TeamModelResponse } from './teammodels';

export type GetTeamModelsDispatch = Dispatch<SetStateAction<TeamModelResponse>>;
export type GetTaskByNameDispatch = Dispatch<SetStateAction<Task>>;
