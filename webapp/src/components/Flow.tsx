import '@xyflow/react/dist/style.css';

import type { OnConnect } from '@xyflow/react';
import {
	addEdge,
	Background,
	ColorMode,
	Controls,
	MiniMap,
	Panel,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow
} from '@xyflow/react';
import React, { ChangeEventHandler, useCallback, useRef, useState } from 'react';

export default function Flow() {
	const [colorMode, setColorMode] = useState<ColorMode>('dark');
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const reactFlowWrapper = useRef(null);
	const reactFlowInstance = useReactFlow();

	const onConnect: OnConnect = useCallback(
		connection => setEdges(edges => addEdge(connection, edges)),
		[setEdges]
	);

	const onDrop = useCallback(
		event => {
			event.preventDefault();
			const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
			const type = event.dataTransfer.getData('application/reactflow');
			const nodeData = JSON.parse(event.dataTransfer.getData('data'));
			if (typeof type === 'undefined' || !type) {
				return;
			}
			const position =
				reactFlowInstance &&
				reactFlowInstance.screenToFlowPosition({
					x: event.clientX - 150,
					y: event.clientY - 30
				});
			const newNode = {
				id: `${type}-${+new Date()}`,
				type,
				position,
				data: { label: nodeData.name }
			};

			setNodes(nds => nds.concat(newNode));
		},
		[setNodes]
	);

	const onChange: ChangeEventHandler<HTMLSelectElement> = evt =>
		setColorMode(evt.target.value as ColorMode);

	const onDragOver = useCallback(event => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}, []);

	return (
		<div className='reactflow-wrapper w-full h-full' ref={reactFlowWrapper}>
			<ReactFlow
				nodes={nodes}
				onNodesChange={onNodesChange}
				edges={edges}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onDrop={onDrop}
				onDragOver={onDragOver}
				colorMode={colorMode}
				fitView>
				<MiniMap />
				<Background />
				<Controls />
				<Panel position='top-right'>
					<select onChange={onChange} data-testid='colormode-select'>
						<option value='dark'>dark</option>
						<option value='light'>light</option>
						<option value='system'>system</option>
					</select>
				</Panel>
			</ReactFlow>
		</div>
	);
}

export function FlowWithProvider(props) {
	return (
		<ReactFlowProvider>
			<Flow {...props} />
		</ReactFlowProvider>
	);
}
