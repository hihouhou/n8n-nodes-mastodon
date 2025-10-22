import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';

export class Mastodon implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mastodon',
		name: 'mastodon',
		icon: 'file:mastodon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Mastodon API',
		defaults: {
			name: 'Mastodon',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'mastodonApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Status',
						value: 'status',
					},
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Notification',
						value: 'notification',
					},
				],
				default: 'status',
			},
			// Status Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['status'],
					},
				},
				options: [
					{
						name: 'Post Message',
						value: 'post',
						description: 'Post a new status',
						action: 'Post a status',
					},
				],
				default: 'post',
			},
			{
				displayName: 'Status Text',
				name: 'status',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['status'],
						operation: ['post'],
					},
				},
				default: '',
				description: 'The text content of the status',
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['status'],
						operation: ['post'],
					},
				},
				options: [
					{
						name: 'Public',
						value: 'public',
						description: 'Visible to everyone',
					},
					{
						name: 'Unlisted',
						value: 'unlisted',
						description: 'Visible to public, but not on public timelines',
					},
					{
						name: 'Private',
						value: 'private',
						description: 'Visible to followers only',
					},
					{
						name: 'Direct',
						value: 'direct',
						description: 'Visible to mentioned users only',
					},
				],
				default: 'public',
				description: 'Status visibility',
			},
			// Account Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Followers',
						value: 'getFollowers',
						description: 'Get account followers',
						action: 'Get account followers',
					},
					{
						name: 'Block Account',
						value: 'block',
						description: 'Block an account',
						action: 'Block an account',
					},
					{
						name: 'Unblock Account',
						value: 'unblock',
						description: 'Unblock an account',
						action: 'Unblock an account',
					},
				],
				default: 'getFollowers',
			},
			{
				displayName: 'Account ID',
				name: 'accountId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['account'],
						operation: ['getFollowers', 'block', 'unblock'],
					},
				},
				default: '',
				description: 'The ID of the account',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['account'],
						operation: ['getFollowers'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 80,
				},
				default: 40,
				description: 'Maximum number of followers to return',
			},
			// Notification Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['notification'],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all notifications',
						action: 'Get all notifications',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['notification'],
						operation: ['getAll'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 80,
				},
				default: 40,
				description: 'Maximum number of notifications to return',
			},
			{
				displayName: 'Exclude Types',
				name: 'excludeTypes',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['notification'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						name: 'Follow',
						value: 'follow',
					},
					{
						name: 'Favourite',
						value: 'favourite',
					},
					{
						name: 'Reblog',
						value: 'reblog',
					},
					{
						name: 'Mention',
						value: 'mention',
					},
					{
						name: 'Poll',
						value: 'poll',
					},
				],
				default: [],
				description: 'Types of notifications to exclude',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('mastodonApi');
		const instanceUrl = credentials.instanceUrl as string;
		const accessToken = credentials.accessToken as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let endpoint = '';
				let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET';
				let body: IDataObject = {};
				let qs: IDataObject = {};

				if (resource === 'status') {
					if (operation === 'post') {
						endpoint = '/api/v1/statuses';
						method = 'POST';
						body = {
							status: this.getNodeParameter('status', i) as string,
							visibility: this.getNodeParameter('visibility', i) as string,
						};
					}
				}

				if (resource === 'account') {
					const accountId = this.getNodeParameter('accountId', i) as string;

					if (operation === 'getFollowers') {
						endpoint = `/api/v1/accounts/${accountId}/followers`;
						method = 'GET';
						qs.limit = this.getNodeParameter('limit', i) as number;
					} else if (operation === 'block') {
						endpoint = `/api/v1/accounts/${accountId}/block`;
						method = 'POST';
					} else if (operation === 'unblock') {
						endpoint = `/api/v1/accounts/${accountId}/unblock`;
						method = 'POST';
					}
				}

				if (resource === 'notification') {
					if (operation === 'getAll') {
						endpoint = '/api/v1/notifications';
						method = 'GET';
						qs.limit = this.getNodeParameter('limit', i) as number;

						const excludeTypes = this.getNodeParameter('excludeTypes', i) as string[];
						if (excludeTypes.length > 0) {
							qs['exclude_types[]'] = excludeTypes;
						}
					}
				}

				const options: IHttpRequestOptions = {
					method,
					url: `${instanceUrl}${endpoint}`,
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					qs,
					body,
					json: true,
				};

				const responseData = await this.helpers.httpRequest(options);

				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map((item) => ({ json: item })));
				} else {
					returnData.push({ json: responseData });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
