export const QdrantFilterSchema = {
	uri: 'https://agent-cloud/schemas/qdrant-filter-schema.json',
	fileMatch: ['*'],
	type: 'object',
	schema: {
		type: 'object',
		properties: {
			must: {
				type: 'array',
				items: {
					$ref: '#/definitions/condition'
				}
			},
			should: {
				type: 'array',
				items: {
					$ref: '#/definitions/condition'
				}
			},
			must_not: {
				type: 'array',
				items: {
					$ref: '#/definitions/condition'
				}
			}
		},
		oneOf: [{ required: ['must'] }, { required: ['should'] }, { required: ['must_not'] }],
		// At least one of 'must', 'should', or 'must_not' must be present
		definitions: {
			condition: {
				type: 'object',
				properties: {
					key: {
						type: 'string'
					},
					match: {
						type: 'object',
						properties: {
							value: {},
							any: {
								type: 'array',
								items: {}
							},
							except: {
								type: 'array',
								items: {}
							}
						},
						additionalProperties: {
							oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }]
						}
					}
				},
				required: ['key', 'match'],
				additionalProperties: false
			}
		},
		additionalProperties: false
	}
};

export const StructuredOutputSchema = {
	uri: 'https://agent-cloud/schemas/output-schema.json',
	fileMatch: ['*'],
	schema: {
		type: 'object',
		properties: {
			schema: {
				type: 'object',
				additionalProperties: {
					oneOf: [
						{
							type: 'object',
							properties: {
								type: { const: 'object' },
								schema: {
									type: 'object',
									additionalProperties: {
										$ref: '#/properties/schema/additionalProperties'
									}
								}
							},
							required: ['type', 'schema']
						},
						{
							type: 'object',
							properties: {
								type: { const: 'array' },
								items: {
									$ref: '#/properties/schema/additionalProperties'
								}
							},
							required: ['type', 'items']
						},
						{
							type: 'object',
							properties: {
								type: { const: 'enum' },
								enum: {
									type: 'array',
									items: { type: 'string' }
								}
							},
							required: ['type']
						},
						{
							type: 'object',
							properties: {
								type: { const: 'null' }
							},
							required: ['type']
						},
						{
							type: 'object',
							properties: {
								type: { const: 'string' }
							},
							required: ['type']
						},
						{
							type: 'object',
							properties: {
								type: { const: 'number' }
							},
							required: ['type']
						}
					]
				}
			}
		}
	}
};
