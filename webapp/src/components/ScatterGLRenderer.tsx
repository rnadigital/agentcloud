// import UMAPWorker from 'components/UMAP.worker';
import React, { useCallback,useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
const ScatterGL = dynamic(() => import('scatter-gl'), { ssr: false });

const ScatterGLRenderer = ({ store }) => {

	const [scatterGL, setScatterGL] = useState(null);
	const [pointMetadata, setPointMetadata] = useState([]);
	const [dataset, setDataset] = useState([]);
	const [selectedPointIndexes, setSelectedPointIndexes] = useState([]);
	const [hoveredPointIndexes, setHoveredPointIndexes] = useState([]);
	const [colorKey, setColorKey] = useState('event');
	const [colorKeys, setColorKeys] = useState([]);
	const [filteredMetadata, setFilteredMetadata] = useState([]);
	const [filteredEmbedding, setFilteredEmbedding] = useState([]);
	const [finishedEmbedding, setFinishedEmbedding] = useState(false);
	const [processingStateName, setProcessingStateName] = useState('Initializing...');
	const [error, setError] = useState(false);
	const [domain, setDomain] = useState([]);

	async function queryQdrant() {
		const userId = store.selectedDelegator || store.currentUser._id;
		return fetch(`${URL_VECTOR}/scroll/${userId}?limit=200&get_all_pages=false&with_vectors=true`, {
			'credentials': 'include',
			'mode': 'cors',
		})
			.then(res => res.json())
			.catch(e => console.error(e));
	}

	const workerRef = useRef<Worker>();
	useEffect(async () => {
		if (!ScatterGL) { return; }
		workerRef.current = new Worker(new URL('../worker', import.meta.url)); //TODO: rename worker
		workerRef.current.onmessage = (event: MessageEvent<number>) =>
		workerRef.current.postMessage('test');
		const scatterGlComponent = document && document.getElementById('scattergl');
		let interval;
		if (scatterGlComponent) {
			const ScatterGL = await import('scatter-gl');
			const scatterGL = new ScatterGL.ScatterGL(scatterGlComponent);
			interval = setInterval(() => scatterGL.resize(), 1000);
		}
		return () => {
			clearInterval(interval);
		}
	}, []);

	return <div id='scattergl' style={{ height: '500px' }} />;

};

export default ScatterGLRenderer;
