import Tippy, { TippyProps } from '@tippyjs/react';
import parse, { DOMNode } from 'html-react-parser';
import React, { DOMElement } from 'react';

const modifyAnchorTags = (node: DOMNode) => {
	if (node.type === 'tag' && node.name === 'a') {
		node.attribs = {
			...node.attribs,
			target: '_blank',
			rel: 'noopener noreferrer',
			className: 'cursor-pointer hover:underline hover:text-blue-500 text-blue-300'
		};
	}
	return node;
};

interface ToolTipProps extends TippyProps {
	content: string;
}

const ToolTip = ({ content, children, ...props }: ToolTipProps) => {
	const modifiedContent = parse(content, {
		replace: modifyAnchorTags
	});

	return (
		<Tippy content={modifiedContent} {...props}>
			{children}
		</Tippy>
	);
};

export default ToolTip;
