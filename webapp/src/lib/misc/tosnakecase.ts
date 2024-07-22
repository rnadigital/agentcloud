export default function toSnakeCase(str: string) {
	// Lowercase the string and replace non-alphanumeric characters with underscores
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '_')
		.replace(/_+/g, '_') // Replace multiple underscores with a single one
		.replace(/^_|_$/g, ''); // Remove leading and trailing underscores
}
