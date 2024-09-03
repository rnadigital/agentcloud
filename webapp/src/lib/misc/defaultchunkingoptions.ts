export const defaultChunkingOptions = Object.freeze(
	Object.preventExtensions(
		Object.seal({
			partitioning: 'auto',
			strategy: 'basic',
			max_characters: 500,
			new_after_n_chars: null, // Defaults to max_characters unless changed
			overlap: 0,
			similarity_threshold: 0.5,
			overlap_all: false,
			file_type: 'txt'
		})
	)
);
