import {
	INodeExecutionData,
	INodeOutputConfiguration,
	INodeType,
	INodeTypeDescription,
	IWebhookDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { BaseHelperFunctions, BinaryHelperFunctions, RequestHelperFunctions } from 'n8n-workflow/dist/esm/interfaces';
import { LuccaApiCredentialDescription } from '../../credentials/LuccaApiOAuth2Api.credentials';
export const handShakeWebhook: IWebhookDescription = {
	name: 'setup',
	httpMethod: 'GET',
	path: ''
};
export const eventsWebhook: IWebhookDescription = {
	name: 'default',
	httpMethod: 'POST',
	path:'',
	responseData: 'noData'
};
export type WebhookType = string;
export type WebhookData = JsonObject & {
	id: string;
	type: WebhookType;
	url: string
	description: string;
	endpointId: number;
}

function outputs(types: WebhookType[]): INodeOutputConfiguration[] {
	return [
		...types.map((eventType) => ({
			displayName: eventType,
			required: false,
			type: 'main' as NodeConnectionType,
		})),
	];
}
function routeToOutput(
	helpers: RequestHelperFunctions & BaseHelperFunctions & BinaryHelperFunctions,
	outputIndex: number,
	outputs: INodeOutputConfiguration[],
	outputData: JsonObject[] | JsonObject,
): INodeExecutionData[][] {
	return outputs.map((e, index) => {
		if (index === outputIndex) {
			return helpers.returnJsonArray(Array.isArray(outputData) ? outputData : [outputData]);
		} else {
			return helpers.returnJsonArray([]);
		}
	});
}
const triggerOutputs = outputs(['employee.created', 'employee.updated']);
export class LuccaWebhooks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lucca Webhooks',
		name: 'luccaWebhooks',
		icon:  'file:./lucca.svg',
		group: ['trigger', 'transform'],
		version: 2,
		description: 'Lucca webhooks node',
		defaults: {
			name: 'LuccaWebhooks',
		},
		inputs: [],
		outputs: triggerOutputs,
		usableAsTool: true,
		webhooks: [handShakeWebhook, eventsWebhook],
		credentials: [LuccaApiCredentialDescription],
		properties:[]
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const method = req.method;
		if (method === 'GET') {
			const queryParams = req.query;
			const echo = queryParams['echo'];
			return {
				webhookResponse: echo,
			};
		}
		const body = req.body as WebhookData;
		const eventType = body.type;
		const outputIndex = triggerOutputs.findIndex((output) => output.displayName === eventType);
		if (outputIndex === -1) {
			throw new NodeOperationError(this.getNode(), `No output found for event type: ${eventType}`);
		}
		return {
			workflowData: routeToOutput(this.helpers, outputIndex, triggerOutputs, body),
		};
	}
}
