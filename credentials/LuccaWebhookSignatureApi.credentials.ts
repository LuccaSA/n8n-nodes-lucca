import { Icon, ICredentialType, INodeCredentialDescription, INodeProperties } from 'n8n-workflow';

export const LuccaWebhookSignatureApiCredentials = 'luccaWebhookSignature';
export const LuccaWebhookSignatureCredentialDescription: INodeCredentialDescription = {
	name: LuccaWebhookSignatureApiCredentials,
	displayName: 'Lucca webhook signature',
	required: true,
};
export class LuccaWebhookSignatureApi implements ICredentialType {
	name = LuccaWebhookSignatureApiCredentials;
	icon: Icon = 'file:./lucca.svg';
	displayName = 'Lucca Webhook Signature API';
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
