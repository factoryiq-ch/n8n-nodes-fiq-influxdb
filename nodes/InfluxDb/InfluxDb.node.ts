import { INodeType, INodeTypeDescription, NodeConnectionType, IExecuteFunctions, INodeExecutionData, NodeOperationError, IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

// Input validation functions (replacing zod)
function validateWriteInput(input: any, node: any): { lineProtocol: string } {
	if (!input || typeof input !== 'object') {
		throw new NodeOperationError(node, 'Invalid input object');
	}

	const lineProtocol = input.lineProtocol;
	if (!lineProtocol || typeof lineProtocol !== 'string' || lineProtocol.trim().length === 0) {
		throw new NodeOperationError(node, 'Line protocol data is required');
	}

	return { lineProtocol: lineProtocol.trim() };
}

function validateQueryInput(input: any, node: any): {
	query: string;
	responseFormat: 'json' | 'jsonl' | 'csv' | 'pretty' | 'parquet';
	params?: Record<string, any>;
} {
	if (!input || typeof input !== 'object') {
		throw new NodeOperationError(node, 'Invalid input object');
	}

	const query = input.query;
	if (!query || typeof query !== 'string' || query.trim().length === 0) {
		throw new NodeOperationError(node, 'Query is required');
	}

	const responseFormat = input.responseFormat || 'jsonl';
	if (!['json', 'jsonl', 'csv', 'pretty', 'parquet'].includes(responseFormat)) {
		throw new NodeOperationError(node, 'Invalid response format');
	}

	const result: any = {
		query: query.trim(),
		responseFormat: responseFormat as 'json' | 'jsonl' | 'csv' | 'pretty' | 'parquet',
	};

	if (input.params && typeof input.params === 'object') {
		result.params = input.params;
	}

	return result;
}

// Predefined query bookmarks for system-related queries
const QUERY_BOOKMARKS = {
	system_monitoring: {
		name: 'System Information',
		queries: {
			show_tables: {
				name: 'Show All Tables',
				sql: `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'iox'`
			},
			recent_queries: {
				name: 'Recent Query Performance',
				sql: `SELECT id, query_text, plan_duration, execute_duration, end2end_duration, success FROM system.queries ORDER BY issue_time DESC LIMIT 10`
			},
			table_schema: {
				name: 'Table Schema Information (Parameterized)',
				sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'iox' AND table_name = $table_name`,
				params: { table_name: 'your_table_name' }
			}
		}
	}
};

export class InfluxDb implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'InfluxDB',
		name: 'influxDb',
		icon: { light: 'file:FactoryIQ.svg', dark: 'file:FactoryIQ.svg' },
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"]}} {{$parameter["querySource"] ? "(" + $parameter["querySource"] + ")" : ""}}',
		description: 'Read and write time-series data to InfluxDB v3 with advanced query management and bookmarking',
		defaults: {
			name: 'InfluxDB',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'influxDbApi',
				required: true,
				testedBy: {
					request: {
						method: 'POST',
						url: '/api/v3/query_sql',
						headers: {
							Authorization: '={{"Bearer " + $credentials.token}}',
							'Content-Type': 'application/json',
						},
						body: {
							db: '={{$credentials.database}}',
							q: 'SHOW TABLES LIMIT 1',
							format: 'json',
						},
					},
					rules: [
						{
							type: 'responseSuccessBody',
							properties: {
								key: '',
								value: '',
								message: 'Connection to InfluxDB successful',
							},
						},
					],
				},
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Write Data',
						value: 'write',
						description: 'Write line protocol data to InfluxDB',
						action: 'Write line protocol data to influx db',
					},
					{
						name: 'Query Data',
						value: 'query',
						description: 'Query data from InfluxDB using SQL or InfluxQL',
						action: 'Query data from influx db',
					},
				],
				default: 'query',
				noDataExpression: true,
			},
			// Write operation properties
			{
				displayName: 'Line Protocol Data',
				name: 'lineProtocol',
				type: 'string',
				typeOptions: {
					rows: 8,
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['write'],
					},
				},
				description: 'Line protocol formatted data to write to InfluxDB. Example: measurement,tag1=value1 field1=123.45,field2="string_value" 1609459200000000000.',
				placeholder: 'temperature,location=room1,sensor=A1 value=23.5,humidity=45.2 1609459200000000000',
			},
			// Query operation properties
			{
				displayName: 'Query Source',
				name: 'querySource',
				type: 'options',
				options: [
					{
						name: 'Custom Query',
						value: 'custom',
						description: 'Write your own SQL or InfluxQL query',
					},
					{
						name: 'Bookmarked Query',
						value: 'bookmark',
						description: 'Use a predefined bookmarked query',
					},
				],
				default: 'custom',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
				description: 'Choose whether to use a custom query or a bookmarked query',
				noDataExpression: true,
			},

			{
				displayName: 'Query Category',
				name: 'bookmarkCategory',
				type: 'options',
				options: [
					{
						name: 'System Information',
						value: 'system_monitoring',
						description: 'Database schema and system information queries',
					},
				],
				default: 'system_monitoring',
				displayOptions: {
					show: {
						operation: ['query'],
						querySource: ['bookmark'],
					},
				},
				description: 'Select the category of bookmarked queries',
				noDataExpression: true,
			},
			{
				displayName: 'Bookmarked Query Name or ID',
				name: 'bookmarkedQuery',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBookmarkedQueries',
					loadOptionsDependsOn: ['bookmarkCategory', 'queryLanguage'],
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['query'],
						querySource: ['bookmark'],
					},
				},
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'SQL Query',
				name: 'sqlQuery',
				type: 'string',
				typeOptions: {
					rows: 8,
				},
				default: 'SELECT * FROM your_measurement ORDER BY time DESC LIMIT 10',
				displayOptions: {
					show: {
						operation: ['query'],
						querySource: ['custom'],
					},
				},
				description: 'SQL query to execute against InfluxDB v3. Supports full SQL syntax including JOINs, window functions, and aggregations.',
				placeholder: 'SELECT timestamp, temperature, pressure FROM boiler_data WHERE timestamp >= NOW() - INTERVAL \'1 hour\' ORDER BY timestamp DESC',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'CSV',
						value: 'csv',
						description: 'Comma-separated values format',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Standard JSON format',
					},
					{
						name: 'JSON Lines (Streaming)',
						value: 'jsonl',
						description: 'JSONL format - streams results back efficiently (recommended)',
					},
					{
						name: 'Parquet',
						value: 'parquet',
						description: 'Apache Parquet binary format',
					},
					{
						name: 'Pretty Print',
						value: 'pretty',
						description: 'Human-readable formatted output',
					},
				],
				default: 'jsonl',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
				description: 'Choose the response format for query results',
				noDataExpression: true,
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParams',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: { parameters: [] },
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
				description: 'Parameters for parameterized queries (use $parameter_name in your query)',
				options: [
					{
						displayName: 'Parameters',
						name: 'parameters',
						values: [
							{
								displayName: 'Parameter Name',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'table_name',
								description: 'Parameter name (without the $ prefix)',
							},
							{
								displayName: 'Parameter Value',
								name: 'value',
								type: 'string',
								default: '',
								placeholder: 'boiler_measurements',
								description: 'Parameter value to substitute in the query',
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
				options: [
					{
						displayName: 'Include Query Metadata',
						name: 'includeMetadata',
						type: 'boolean',
						default: false,
						description: 'Whether to include query execution metadata in the response',
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						default: 30,
						description: 'Query timeout in seconds',
						typeOptions: {
							minValue: 1,
							maxValue: 300,
						},
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getBookmarkedQueries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const category = this.getNodeParameter('bookmarkCategory') as string;

				const categoryQueries = QUERY_BOOKMARKS[category as keyof typeof QUERY_BOOKMARKS];
				if (!categoryQueries) return [];

				return Object.entries(categoryQueries.queries)
					.filter(([_, query]) => query.sql)
					.map(([key, query]) => ({
						name: query.name,
						value: key,
						description: query.sql.substring(0, 100) + '...',
					}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('influxDbApi');

				if (!credentials) {
					throw new NodeOperationError(this.getNode(), 'No InfluxDB credentials provided.');
				}

				const endpoint = credentials.endpoint as string;
				const token = credentials.token as string;
				const database = credentials.database as string;
				const org = credentials.org as string | undefined;

				// Validate endpoint format
				if (!endpoint || !endpoint.startsWith('http')) {
					throw new NodeOperationError(this.getNode(), 'Invalid endpoint URL. Please provide a valid HTTP/HTTPS URL.');
				}

				if (operation === 'write') {
					// Handle write operation
					const input = validateWriteInput({
						lineProtocol: this.getNodeParameter('lineProtocol', i) as string,
					}, this.getNode());

					// Use the InfluxDB v3 write endpoint
					const url = `${endpoint}/api/v3/write_lp`;
					const params = new (globalThis as any).URLSearchParams({ db: database });
					if (org) params.append('org', org);

					await this.helpers.httpRequest({
						method: 'POST',
						url: `${url}?${params.toString()}`,
						headers: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'text/plain; charset=utf-8',
						},
						body: input.lineProtocol,
					});

					returnData.push({
						json: {
							success: true,
							statusCode: 204, // InfluxDB write typically returns 204
							message: 'Data written successfully',
							linesWritten: input.lineProtocol.split('\n').filter(line => line.trim()).length,
						},
						pairedItem: i,
					});

				} else if (operation === 'query') {
					// Handle query operation
					const querySource = this.getNodeParameter('querySource', i) as string;
					const responseFormat = this.getNodeParameter('responseFormat', i, 'jsonl') as string;
					const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
					const timeout = (additionalOptions.timeout as number) || 30;

					let query: string;

					if (querySource === 'bookmark') {
						const bookmarkCategory = this.getNodeParameter('bookmarkCategory', i) as string;
						const bookmarkedQuery = this.getNodeParameter('bookmarkedQuery', i) as string;

						const categoryData = QUERY_BOOKMARKS[bookmarkCategory as keyof typeof QUERY_BOOKMARKS];
						const queryData = categoryData?.queries[bookmarkedQuery as keyof typeof categoryData.queries] as any;

						if (!queryData) {
							throw new NodeOperationError(this.getNode(), `Bookmarked query not found: ${bookmarkedQuery}`, { itemIndex: i });
						}

						query = queryData.sql;

						if (!query) {
							throw new NodeOperationError(this.getNode(), `No SQL query available for this bookmarked query`, { itemIndex: i });
						}
					} else {
						query = this.getNodeParameter('sqlQuery', i) as string;
					}

					// Handle query parameters
					const queryParamsCollection = this.getNodeParameter('queryParams', i, { parameters: [] }) as IDataObject;
					const queryParams: Record<string, any> = {};

					if (queryParamsCollection.parameters && Array.isArray(queryParamsCollection.parameters)) {
						for (const param of queryParamsCollection.parameters as Array<{ name: string; value: string }>) {
							if (param.name && param.value !== undefined) {
								queryParams[param.name] = param.value;
							}
						}
					}

					const input = validateQueryInput({
						query,
						responseFormat: responseFormat as 'json' | 'jsonl' | 'csv' | 'pretty' | 'parquet',
						params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
					}, this.getNode());

					// Use the InfluxDB v3 SQL query endpoint
					const url = `${endpoint}/api/v3/query_sql`;

					const requestBody: IDataObject = {
						db: database,
						q: input.query,
						format: input.responseFormat,
					};

					if (input.params) {
						requestBody.params = input.params;
					}

					if (org) {
						requestBody.org = org;
					}

					try {
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url,
							headers: {
								'Authorization': `Bearer ${token}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							timeout: timeout * 1000,
						});

						let result: any = response;
						const resultCount = Array.isArray(result) ? result.length : (typeof result === 'string' ? result.split('\n').length - 1 : 1);

						const outputData: IDataObject = {
							query: input.query,
							responseFormat: input.responseFormat,
							result,
							resultCount,
						};

						if (additionalOptions.includeMetadata) {
							outputData.metadata = {
								executionTime: Date.now(),
							};
						}

						if (input.params) {
							outputData.parameters = input.params;
						}

						returnData.push({
							json: outputData,
							pairedItem: i,
						});

					} catch (error) {
						if (error.message?.includes('timeout')) {
							throw new NodeOperationError(this.getNode(), `Query timed out after ${timeout} seconds`, { itemIndex: i });
						}
						throw new NodeOperationError(this.getNode(), `InfluxDB query failed: ${error.message}`, { itemIndex: i });
					}

				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: i,
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
