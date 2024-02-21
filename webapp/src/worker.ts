import { UMAP } from 'umap-js';

let umap;

async function startUMAP(dataset) {
	try {
		umap = new UMAP({
			nComponents: 10, // what should this max be?
			nNeighbors: 100,
		});
		postMessage({ embedding: umap.getEmbedding(), nEpochs: 0, epoch: 0, processingStateName: 'Initializing Fit...' });
		console.time('initializeFit');
		const nEpochs = umap.initializeFit(dataset);
		console.timeEnd('initializeFit');
		console.time('embedding');
		umap.step();
		postMessage({ embedding: umap.getEmbedding(), nEpochs: 0, epoch: 0, processingStateName: 'Clustering...' });
		for (let i = 1; i < nEpochs; i++) {
			umap.step();
			if (i % 5 === 0) {
				postMessage({ embedding: umap.getEmbedding(), nEpochs: nEpochs, epoch: i });
			}
		}
		postMessage({ embedding: umap.getEmbedding(), epoch: nEpochs, finishedEmbedding: true, processingStateName: 'Done!' });
		console.timeEnd('embedding');
	} catch (e) {
        // self.postMessage(e)
		console.error(e);
	}
}

async function getEmbedding() {
	self.postMessage({ getEmbedding: true, embedding: umap.getEmbedding() });
}

self.onmessage = function(event) {
	return console.log(event);//TODO
	const message = event.data;
	switch (message.event) {
		case 'startUMAP':
			return startUMAP(message.dataset);
		case 'getEmbedding':
			return getEmbedding();
	}
};
