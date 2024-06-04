import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect,useReducer } from 'react';

// Define action types
const SET_KEY = 'SET_KEY';
const RESET = 'RESET';

// Define initial state
const initialState = { state: {} };

// Define reducer function
function flowReducer(state, action) {
	switch (action.type) {
		case SET_KEY:
			return { ...state, [action.key]: action.value };
		case RESET:
			return initialState;
		default:
			return state;
	}
}

const FlowContext = createContext({});

export function FlowWrapper({ children }) {
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useReducer(flowReducer, initialState);

	// Function to set/update a key
	const setKey = (key, value) => {
		dispatch({ type: SET_KEY, key, value });
	};

	// Function to reset all data
	const reset = () => {
		dispatch({ type: RESET });
	};

	return (
		<FlowContext.Provider value={{ state, setKey, reset }}>
			{children}
		</FlowContext.Provider>
	);
}

export function useFlowContext() {
	return useContext(FlowContext);
}
