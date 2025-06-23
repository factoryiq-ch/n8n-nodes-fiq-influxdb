import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InfluxDbApi implements ICredentialType {
	name = 'influxDbApi';
	displayName = 'InfluxDB API';
	documentationUrl = 'https://docs.influxdata.com/influxdb/';

	properties: INodeProperties[] = [
		{
			displayName: 'Endpoint',
			name: 'endpoint',
			type: 'string',
			default: 'http://localhost:8181',
			required: true,
			description: 'InfluxDB v3 API endpoint URL (e.g., http://localhost:8181 for Core or https://your-instance.influxdata.com for Cloud)',
			placeholder: 'http://localhost:8181',
		},
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'InfluxDB v3 API token for authentication',
		},
		{
			displayName: 'Database',
			name: 'database',
			type: 'string',
			default: '',
			required: true,
			description: 'Name of the database to connect to',
			placeholder: 'mydb',
		},
		{
			displayName: 'Organization',
			name: 'org',
			type: 'string',
			default: '',
			description: 'Organization name (optional, required for Cloud instances)',
			required: false,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.endpoint}}',
			url: '/api/v3/query_sql',
			method: 'POST',
			headers: {
				Authorization: '={{"Bearer " + $credentials.token}}',
				'Content-Type': 'application/json',
			},
			body: {
				db: '={{$credentials.database}}',
				q: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'iox\' LIMIT 1',
				format: 'json',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: '',
					value: '',
					message: 'InfluxDB connection test successful. Database accessible and credentials valid.',
				},
			},
		],
	};


}
