'use strict';

export default function convertStringToJsonl(inputString, delimiter='\n') {
	// Split the string into lines
	const lines = inputString.split(delimiter);
	// Map each line to a JSON object and then to a string
	const jsonlLines = lines.map(line => {
		const jsonObj = { text: line };
		return JSON.stringify(jsonObj);
	});
	// Join all JSON strings with a newline
	return jsonlLines.join('\n');
}
