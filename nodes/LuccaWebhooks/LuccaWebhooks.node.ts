import {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';
import { INodeProperties } from 'n8n-workflow/dist/esm/interfaces';
import { createHmac, timingSafeEqual } from 'crypto';
export const handShakeWebhook: IWebhookDescription = {
	name: 'setup',
	httpMethod: 'GET',
	path: ''
};
export const eventsWebhook: IWebhookDescription = {
	name: 'default',
	httpMethod: 'POST',
	path: '',
	responseData: 'noData',
};

export type Topic = string;
export type Event = JsonObject & {
	topic: Topic;
	data: JsonObject;
};
const webhookTopics = [
	'calendar-event.created',
	'calendar-event.updated',
	'calendar-event.deleted',
	'leave.created',
	'leave.updated',
	'leave.deleted',
	'leave-request.created',
	'leave-request.updated',
	'leave-request.deleted',
	'business-establishment.created',
	'business-establishment.updated',
	'business-establishment.deleted',
	'legal-entity.created',
	'legal-entity.updated',
	'legal-entity.deleted',
	'department.created',
	'department.updated',
	'department.deleted',
	'employee.created',
	'employee.updated',
	'employee-personal-record.created',
	'employee-personal-record.updated',
	'job-qualification.created',
	'job-qualification.updated',
	'job-qualification.deleted',
	'occupation-category.created',
	'occupation-category.updated',
	'occupation-category.deleted',
	'employment.created',
	'employment.updated',
	'employment.deleted',
	'job-position.created',
	'job-position.updated',
	'job-position.deleted',
	'test.created',
];
function toTitleCase(str: string): string {
	return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
function distinctArray<T>(arr: T[]): T[] {
	return arr.filter((value, index, self) => self.indexOf(value) === index);
}
function getResourceFromTopic(topic: string): string {
	return topic.split('.')[0];
}
const resourcesOptions = distinctArray(webhookTopics.map(getResourceFromTopic)).map((resource) => ({
	name: toTitleCase(resource.replace('-', ' ')),
	value: resource,
}));
function getPropertyFromTopicsAndResource(topics: string[], resource: string): INodeProperties {
	return {
		displayName: 'Operations',
		name: 'operations',
		type: 'multiOptions',
		noDataExpression: true,
		options: topics
				.filter((topic) => topic.startsWith(resource))
				.map((topic) => {
					const humanReadableTopic = toTitleCase(topic.replace(/(\.|-)/g, ' '));
					const action = topic.split('.')[1];
					return {
						name: humanReadableTopic,
						value: topic,
						action: humanReadableTopic,
						description: `Triggers when a ${resource} is ${action}`,
					};
				}),
		default: [],
		displayOptions: {
			show: {
				resources: [resource],
			},
		},
	};
}
const webhookProperties: INodeProperties[] = resourcesOptions.map((resource) =>
	getPropertyFromTopicsAndResource(webhookTopics, resource.value),
);

function validateSignature(
	luccaSecret: string | null,
	luccaSignature: string | null,
	luccaTimestamp: string | null,
	rawBody: string,
): boolean {
	if (!luccaSecret || !luccaSignature || !luccaTimestamp) {
		return false;
	}
	const luccaDate = new Date(luccaTimestamp);
	const currentDate = new Date();
	const timeDiff = Math.abs(currentDate.getTime() - luccaDate.getTime());
	const timeDiffMinutes = Math.floor(timeDiff / (1000 * 60));
	if (timeDiffMinutes > 5) {
		return false;
	}
	const expectedSignature = createHmac('sha256', luccaSecret)
		.update(`${luccaTimestamp}.${rawBody}`)
		.digest('base64');
	return timingSafeEqual(Buffer.from(luccaSignature), Buffer.from(expectedSignature));
}
interface WebhookEndpoint{
	id?: string;
	name: string;
	webhookUrl: string;
	topics: string[];
	apiVersion: string;
	secret?: string,
	status: string
}

function buildWebhookEndpoint(this: IHookFunctions): WebhookEndpoint {
	const webhookUrl = this.getNodeWebhookUrl('default');
	const topics = this.getNodeParameter('operations') as string[];
	const version = this.getNodeParameter('apiVersion') as string;
	const endpointId = this.getWorkflowStaticData('node').endpointId as string | undefined;
	if (!webhookUrl) {
		throw new NodeApiError(this.getNode(), { message: 'Invalid webhook URL' });
	}
	return {
		id: endpointId,
		name: `n8n: ${this.getNode().name}`,
		webhookUrl: webhookUrl,
		topics: topics,
		apiVersion: version,
		status: 'active',
	};
}
async function getLuccaBaseUrl(this: IHookFunctions): Promise<string> {
	let baseUrl = (await this.getCredentials('luccaOAuth2Api')).serverUrl as string;
	baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	return baseUrl;
}


export class LuccaWebhooks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lucca Webhooks',
		name: 'luccaWebhooks',
		icon: 'file:./lucca.svg',
		group: ['trigger', 'transform'],
		version: 2,
		description: 'Lucca webhooks node',
		defaults: {
			name: 'LuccaWebhooks',
		},
		inputs: [],
		outputs: ['main'],
		usableAsTool: true,
		webhooks: [handShakeWebhook, eventsWebhook],
		credentials: [
			{
				name: "luccaOAuth2Api",
				displayName: 'Lucca oauth2 API',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resources',
				name: 'resources',
				type: 'options',
				options: resourcesOptions,
				default: '',
			},
			...webhookProperties,
			{
				displayName: 'ApiVersion',
				name: 'apiVersion',
				type: 'options',
				options: [{ name: '2024-11-01', value: '2024-11-01' }],
				default: '2024-11-01',
			}
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const method = req.method;
		// setup handshake response
		if (method === 'GET') {
			const queryParams = req.query;
			const echo = queryParams['echo'];
			return {
				webhookResponse: echo,				
			};
		}
		if (
			!validateSignature(
				this.getWorkflowStaticData('node').secret as string | null,
				req.header('Lucca-Signature') as string | null,
				req.header('Lucca-Timestamp') as string | null,
				req.rawBody?.toString(),
			)
		) {
			throw new NodeApiError(this.getNode(), { message: 'Invalid Lucca signature' });
		}
		if (!req.headers['content-type']?.includes('application/json')) {
			throw new NodeApiError(this.getNode(), {
				message: 'Invalid content type, expected application/json',
			});
		}
		const body = req.body as Event;
		const topic = body.topic;
		const operation = this.getNodeParameter('operations') as string[];
		if (!operation.includes(topic)) {
			// Ignore events that are not configured
			return {
				workflowData: [],
			};
		}
		return {
			workflowData: [this.helpers.returnJsonArray([body])],
		};
	}
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookEndpoint = buildWebhookEndpoint.call(this)
				if (!webhookEndpoint.id) {
					return false;
				}
				const endpoint = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'luccaOAuth2Api',
					{
						url: `/lucca-api/webhook-endpoints/${webhookEndpoint.id}`,
						method: 'GET',
						headers: {
							'Api-Version': this.getNodeParameter('apiVersion') as string,
						},
					},
				);
				if (!endpoint || !endpoint.id){
					return false;
				}
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookEndpointPayload = buildWebhookEndpoint.call(this);
				const baseUrl = await getLuccaBaseUrl.call(this);
				const endpoint = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'luccaOAuth2Api',
					{
						url: `${baseUrl}/lucca-api/webhook-endpoints`,
						method: 'POST',
						body: webhookEndpointPayload,
						headers:{
							"Api-Version": this.getNodeParameter('apiVersion') as string,
						}
					},
				);
				this.getWorkflowStaticData('node').endpointId = endpoint.id;
				this.getWorkflowStaticData('node').secret = endpoint.secret;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const endpointId = this.getWorkflowStaticData('node').endpointId;
				if (!endpointId) {
					return false;
				}
				const baseUrl = await getLuccaBaseUrl.call(this);
				await this.helpers.httpRequestWithAuthentication.call(this, 'luccaOAuth2Api', {
					url: `${baseUrl}/lucca-api/webhook-endpoints/${endpointId}`,
					method: 'DELETE',
					headers: {
						'Api-Version': this.getNodeParameter('apiVersion') as string,
					},
				});
				return true;
			},
		},
	};
}
