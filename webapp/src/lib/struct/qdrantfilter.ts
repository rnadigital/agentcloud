export type RagFilter = {
	must?: Condition[];
	should?: Condition[];
	must_not?: Condition[];
};

type Condition = {
	key: string;
	match: Match;
};

type Match = {
	value?: any;
	any?: any[];
	except?: any[];
};
