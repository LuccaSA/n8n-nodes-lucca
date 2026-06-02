import { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class LuccaOAuth2Api implements ICredentialType {
	name = 'luccaOAuth2Api';
	icon: Icon = 'file:./lucca.svg';
	extends = ['oAuth2Api'];
	displayName = 'Lucca OAuth2 API';
	documentationUrl = 'https://developers.lucca.fr/documentation/using-api/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'serverUrl',
			type: 'string',
			default: 'https://your-domain.ilucca.net',
			required: true,
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://accounts.world.luccasoftware.com/connect/token',
			required: true,
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'webhook-endpoints.readwrite',
			// multiple values can be selected
			required: true,
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Send Additional Body Properties',
			name: 'sendAdditionalBodyProperties',
			type: 'hidden',
			default: false,
		},
		{
			displayName: 'Allowed HTTP Request Domains',
			name: 'allowedHttpRequestDomains',
			type: 'hidden',
			default: 'all',
			description: 'Control which domains this credential can be used with in HTTP Request nodes',
		},
	];
	genericAuth = true;
}
