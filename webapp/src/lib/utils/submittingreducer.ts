'use strict';

export default function submittingReducer(state, action) {
	return {
		...state,
		...action
	};
}
