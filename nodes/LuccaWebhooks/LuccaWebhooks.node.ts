import {
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
import { LuccaWebhookSignatureCredentialDescription } from '../../credentials/LuccaWebhookSignatureApi.credentials';
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
export type Topic = string;
export type Event = JsonObject & {
	topic: Topic;
	data: JsonObject;
};
const webhookTopics = [
	"calendar-event.created",
	"calendar-event.updated",
	"calendar-event.deleted",
	"leave.created",
	"leave.updated",
	"leave.deleted",
	"leave-request.created",
	"leave-request.updated",
	"leave-request.deleted",
	"business-establishment.created",
	"business-establishment.updated",
	"business-establishment.deleted",
	"legal-entity.created",
	"legal-entity.updated",
	"legal-entity.deleted",
	"department.created",
	"department.updated",
	"department.deleted",
	"employee.created",
	"employee.updated",
	"employee-personal-record.created",
	"employee-personal-record.updated",
	"job-qualification.created",
	"job-qualification.updated",
	"job-qualification.deleted",
	"occupation-category.created",
	"occupation-category.updated",
	"occupation-category.deleted",
	"employment.created",
	"employment.updated",
	"employment.deleted",
	"job-position.created",
	"job-position.updated",
	"job-position.deleted",
	"test.created"
]
function ToTitleCase(str: string): string {
	return str.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
	);
}
function distinctArray<T>(arr: T[]): T[] {
	return arr.filter((value, index, self) => self.indexOf(value) === index);
}
function getResourceFromTopic(topic: string): string {
	return topic.split('.')[0];
}
const resourcesOptions = distinctArray(webhookTopics.map(getResourceFromTopic)).map((resource) => ({
	name: ToTitleCase(resource.replace('-',' ')),
	value: resource,
}));
function getPropertyFromTopicsAndResource(topics: string[],resource: string ): INodeProperties{
		return {
			displayName: 'Operations',
			name: 'operations',
			type: 'multiOptions',
			noDataExpression: true,
			options: topics.filter(topic => getResourceFromTopic(topic) === resource).map(topic => {
				const humanReadableTopic = ToTitleCase(topic.replace(/(\.|-)/g, ' '));
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
					resources:[resource]
				},
			},
		};
}
const webhookProperties: INodeProperties[] = resourcesOptions.map(resource => getPropertyFromTopicsAndResource(webhookTopics,resource.value));


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

export class LuccaWebhooksNode implements INodeType {
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
		credentials: [LuccaWebhookSignatureCredentialDescription],
		properties: [
			{
				displayName: 'Resources',
				name: 'resources',
				type: 'options',
				options: resourcesOptions,
				default: '',
			},
			...webhookProperties,
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
				(await this.getCredentials('luccaWebhookSignature'))?.signature  as string | null,
				req.header('Lucca-Signature') as string | null,
				req.header('Lucca-Timestamp') as string | null,
				req.rawBody.toString(),
			)
		) {
			throw new NodeApiError(this.getNode(), { message: 'Invalid Lucca signature' });
		}
		if (req.headers['content-type'] !== 'application/json') {
			throw new NodeApiError(this.getNode(), { message: 'Invalid content type, expected application/json' });
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
}
