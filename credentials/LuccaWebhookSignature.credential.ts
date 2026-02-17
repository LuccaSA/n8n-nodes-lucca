import { Icon, ICredentialType, INodeCredentialDescription, INodeProperties } from 'n8n-workflow';

export const LuccaWebhookSignatureCredential = 'luccaOauth2Api';
export const LuccaWebhookSignatureCredentialDescription: INodeCredentialDescription = {
	name: LuccaWebhookSignatureCredential,
	displayName: 'Lucca webhook signature',
	required: true,
};
export class LuccaWebhookSignatureOAuth2Api implements ICredentialType {
	name = LuccaWebhookSignatureCredential;
	icon: Icon = 'file:./lucca.svg';
	displayName = 'Lucca webhook signature';
	documentationUrl = 'https://developers.lucca.fr/documentation/webhooks/catching/validate';
	properties: INodeProperties[] = [
		{
			displayName: 'Webhook Signature',
			name: 'signature',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
}
