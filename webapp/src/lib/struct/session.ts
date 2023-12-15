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
	RAG = 'execute_rag',
}

export enum FeedbackOption {
	EXIT = 'exit',
	CONTINUE = 'continue',
	CANCEL = 'cancel',
}
