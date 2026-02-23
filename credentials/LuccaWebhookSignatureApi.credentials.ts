import { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

//eslint-disable-next-line @n8n/community-nodes/credential-test-required
export class LuccaWebhookSignatureApi implements ICredentialType {
	name = 'luccaWebhookSignatureApi';
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
