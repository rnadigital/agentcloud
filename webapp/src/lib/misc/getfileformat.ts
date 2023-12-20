'use strict';

const fileTypes = {
	'.csv': 'csv',
	'.json': 'json',
	'.pdf': 'jsonl',
	'.jsonl': 'jsonl',
	'.txt': 'jsonl',		// Converted from txt
	'.xls': 'excel',       // For older Excel files
	'.xlsx': 'excel',      // For newer Excel files
	'.xlsm': 'excel',      // For macro-enabled Excel files
	'.xlsb': 'excel_binary',
	'.feather': 'feather',
	'.parquet': 'parquet',
	'.yaml': 'yaml',
	'.yml': 'yaml'         // .yml is also used for YAML files
};

export default function getFileFormat(extension) {
	return fileTypes[extension.toLowerCase()];
}
