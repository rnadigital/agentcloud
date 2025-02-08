interface SharingConfig {
	permissions: Record<string, never>;
	mode: 'team';
}

interface Session {
	_id: string;
	orgId: string;
	teamId: string;
	name: string | null;
	startDate: string;
	lastUpdatedDate: string;
	tokensUsed: number;
	status: 'started' | 'running' | 'terminated';
	appId: string;
	sharingConfig: SharingConfig;
}

interface SessionState {
	sessions: Session[];
}
