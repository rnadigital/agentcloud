export enum SessionStatus {
	STARTED = 'started',
	RUNNING = 'running',
	WAITING = 'waiting',
	WARNING = 'warning',
	ERRORED = 'error',
	TERMINATED = 'terminated',
}

export enum SessionType {
	TEAM = 'generate_team',
	TASK = 'execute_task',
}

export enum FeedbackOption {
	EXIT = 'exit',
	CONTINUE = 'continue',
	CANCEL = 'cancel',
}
