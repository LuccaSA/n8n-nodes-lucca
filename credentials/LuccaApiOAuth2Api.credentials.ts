import {
	Icon,
	ICredentialType,
	INodeCredentialDescription,
	INodeProperties,
} from 'n8n-workflow';

export const LuccaApiCredential = 'luccaOauth2Api';
export const LuccaApiCredentialDescription: INodeCredentialDescription = {
	name: LuccaApiCredential,
	displayName: 'Lucca oauth2 API',
	required: true,
};
export const scopes = [
	"employees.readonly",
	"employees.readwrite",
	"records.readonly",
	"records.readwrite",
	"employments.readonly",
	"employments.readwrite",
	"templates.readonly",
	"templates.readwrite",
	"positions.readonly",
	"positions.readwrite",
	"leaves.readonly",
	"leaves.readwrite",
	"requests.readonly",
	"requests.readwrite",
	"entities.readonly",
	"establishments.readonly",
	"departments.readonly",
	"extensions.readonly",
	"extensions.readwrite",
	"definitions.readonly",
	"definitions.readwrite",
	"extensions.readonly",
	"extensions.readwrite",
	"definitions.readonly",
	"definitions.readwrite",
	"extensions.readonly",
	"extensions.readwrite",
	"definitions.readonly",
	"definitions.readwrite",
	"periods.readonly",
	"periods.readwrite",
	"departments.readwrite",
	"professions.readonly",
	"professions.readwrite",
	"categories.readonly",
	"categories.readwrite",
	"qualifications.readonly",
	"qualifications.readwrite",
	"endpoints.readonly",
	"endpoints.readwrite",
	"deliveries.readonly",
	"deliveries.readwrite",
	"events.readonly",
];
export class LuccaApiOAuth2Api implements ICredentialType {
	name = LuccaApiCredential;
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
			default:'',
			// multiple values can be selected
			required: true,
		},
		/*
				{
			displayName: 'Scopes',
			name: 'scopes',
			type: 'multiOptions',
			default: scopes,
			options: scopes.map((scope) => ({
				name: scope,
				value: scope,
			})),
			// multiple values can be selected
			required: true,
		},
		 */
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
	];
	genericAuth = true;
}
