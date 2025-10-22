import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MastodonApi implements ICredentialType {
	name = 'mastodonApi';
	displayName = 'Mastodon API';
	documentationUrl = 'https://docs.joinmastodon.org/client/token/';
	properties: INodeProperties[] = [
		{
			displayName: 'Instance URL',
			name: 'instanceUrl',
			type: 'string',
			default: 'https://mastodon.social',
			placeholder: 'https://mastodon.social',
			description: 'The URL of your Mastodon instance',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your Mastodon API access token',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.instanceUrl}}',
			url: '/api/v1/accounts/verify_credentials',
			method: 'GET',
		},
	};
}
