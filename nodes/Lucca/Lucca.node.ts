import {
	N8NPropertiesBuilder,
	N8NPropertiesBuilderConfig,
	OperationContext,
	OperationsCollector,
} from '@devlikeapro/n8n-openapi-node';
//from '../../lib/n8n-openapi-node/src';
import * as doc from './lucca-api@2024-11-01.json';
import { INodeProperties, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { LuccaApiCredentialDescription } from '../../credentials/LuccaApiOAuth2Api.credentials';
// import { eventsWebhook, handShakeWebhook } from '../EmployeeTriggers/EmployeeTriggers.node';
import { OpenAPIV3 } from 'openapi-types';


const excludedRefParameters = [
	'#/components/parameters/if-none-match',
	'#/components/parameters/if-match',
	'#/components/parameters/accept-encoding',
	'#/components/parameters/include'
]
class CustomOperationCollector extends OperationsCollector {
	public override parseFields(
		operation: OpenAPIV3.OperationObject,
		context: OperationContext,
	): INodeProperties[] {
		// don't really know why, but path headers and in:path parameters are not merged in the operation object we do it here
		operation.parameters = [
			...(operation.parameters ?? []),
			...(context.path.parameters?.filter((param) => {
				return !('$ref' in param && excludedRefParameters.includes(param.$ref));
			}) ?? []),
		];

		let fields = super.parseFields(operation, context).map((field) => {
			if (field.type === 'json') {
				field.type = 'string';
			}
			if (!field.required) {
				field.default = null;
				if (field.routing?.send && field.routing.send.type === 'query') {
					// Empty values for query/path/header parameters should not be sent
					field.routing.send.value = '={{$value ?? undefined }}';
				}
			}
			return field;
		});
		/*
		if (['post', 'put', 'patch'].includes(context.method.toLowerCase())) {
			fields = fields.filter((field) => field.routing?.send?.type !== 'body');
			fields.push({
				displayName: `Body`,
				type: 'json',
				name: 'body',
				default: '',
				description: 'JSON object containing the request body',
				routing: {
					send: {
						type: 'body',
						value: '={{$value}}',
					},
				},
			});
		}
		*/
		 
		return fields;
	}
}
const config: N8NPropertiesBuilderConfig = {
	OperationsCollector: CustomOperationCollector,
};
const parser = new N8NPropertiesBuilder(doc, config);
const openApiProperties = parser.build();



export class Lucca implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lucca',
		name: 'Lucca',
		icon: 'file:./lucca.svg',
		group: ['transform'],
		version: 2,
		description: 'Lucca node',
		defaults: {
			name: 'Lucca',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		webhooks: [],
		credentials: [LuccaApiCredentialDescription],
		properties: openApiProperties,
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			baseURL: '={{$credentials.serverUrl}}',
		},
	};
}
