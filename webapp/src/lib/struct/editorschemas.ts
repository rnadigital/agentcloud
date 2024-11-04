export const RagFilterSchema = {
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
								items: { oneOf: [{ type: 'string' }, { type: 'number' }] }
							},
							except: {
								type: 'array',
								items: { oneOf: [{ type: 'string' }, { type: 'number' }] }
							}
						},
						additionalProperties: false
					},
					range: {
						type: 'object',
						properties: {
							gt: { oneOf: [{ type: 'number' }, { type: 'string', format: 'date-time' }] },
							gte: { oneOf: [{ type: 'number' }, { type: 'string', format: 'date-time' }] },
							lt: { oneOf: [{ type: 'number' }, { type: 'string', format: 'date-time' }] },
							lte: { oneOf: [{ type: 'number' }, { type: 'string', format: 'date-time' }] }
						},
						additionalProperties: false
					}
				},
				required: ['key'],
				oneOf: [{ required: ['match'] }, { required: ['range'] }],
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
			},
			variables: {
				type: 'array',
				items: {
					type: 'string'
				}
			}
		}
	}
};
