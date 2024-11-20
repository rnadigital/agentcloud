import { Dispatch, SetStateAction } from 'react';

import { Task } from './task';
import { TeamModelResponse } from './teammodels';
import { Variable } from './variable';
import { VectorDbDocument } from './vectordb';

export type GetTeamModelsDispatch = Dispatch<SetStateAction<TeamModelResponse>>;
export type GetTaskByNameDispatch = Dispatch<SetStateAction<Task>>;
export type GetVariableDispatch = Dispatch<SetStateAction<Variable>>;
export type GetVectorDbDispatch = Dispatch<SetStateAction<VectorDbDocument>>;
