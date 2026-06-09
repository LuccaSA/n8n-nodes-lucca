// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import {
	N8NPropertiesBuilder,
	N8NPropertiesBuilderConfig,
	OperationContext,
	OperationsCollector,
} from '@devlikeapro/n8n-openapi-node';
// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { OpenAPIV3 } from 'openapi-types';

import * as doc from './lucca-api@2024-11-01.json';
import {
	IDataObject,
	IExecuteSingleFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';


const excludedRefParameters = [
	'#/components/parameters/if-none-match',
	'#/components/parameters/if-match',
	'#/components/parameters/accept-encoding'
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
		let fields = super.parseFields(operation, context);
		fields = fields.map((field) => {
			if (field.type === 'json') {
				field.type = 'string';
			}
			if (!field.required) {
				field.default = null;
				if (field.routing?.send && field.routing.send.type === 'query') {
					// Empty values for query/path/header parameters should not be sent
					field.routing.send.value = '={{ $value ?? undefined }}';
				}
			}
			if (field.name === 'include') {
				field.default = 'totalCount,links';
				field.required = true;
			}
			return field;
		});
		if (['POST', 'PUT', 'PATCH'].includes(context.method)) {
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
		return fields;
	}

}
const config: N8NPropertiesBuilderConfig = {
	OperationsCollector: CustomOperationCollector,
};
const parser = new N8NPropertiesBuilder(doc, config);
const additionalPropertiesByResourceAndOperation: Record<string, INodeProperties[]> = {};

const openApiProperties = parser.build().map((operation) => {
	const resourceName = (operation.displayOptions?.show?.resource ?? [null])[0] as string | null;
	const operationName = (operation.displayOptions?.show?.operation ?? [null])[0] as string | null;
	if (operation.routing?.send?.type === 'query' && !operation.required && resourceName && operationName) {
		const key = `${resourceName}:${operationName}`;
		if (!additionalPropertiesByResourceAndOperation[key]) {
			additionalPropertiesByResourceAndOperation[key] = [];
		}
		additionalPropertiesByResourceAndOperation[key].push({
			...operation,
			displayOptions: undefined,
		});

		return null;
	}
	return operation;
}).filter((operation): operation is INodeProperties => operation !== null);

// not needed parameter are moved in it own select, as it reduce visual polution.
const parametersOptions : INodeProperties[] = Object.entries(additionalPropertiesByResourceAndOperation).map(([key,value]) => {
	const [resource, operation] = key.split(':');
	return {
		displayName: 'Additional query Parameters',
		name: 'parameters',
		type: 'collection',
		placeholder: 'Add query parameter',
		options: value,
		displayOptions: {
			show: {
				resource: [resource],
				operation: [operation],
			},
		},
		default: {},
	} as INodeProperties;
});



export class Lucca implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lucca',
		name: 'lucca',
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
		credentials: [
			{
				name: 'luccaOAuth2Api',
				displayName: 'Lucca oauth2 API',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Automatic Pagination',
				name: 'automaticPagination',
				default: false,
				description: 'Whether to return all results or only up to the given limit',
				displayOptions:{
					show: {}
				},
				routing: {
					send: {
						paginate: '={{ $value }}',
					},
					output:{
						postReceive:[
							async function (
								this: IExecuteSingleFunctions,
								data: INodeExecutionData[],
							): Promise<INodeExecutionData[]> {
								if(!this.getNodeParameter('automaticPagination', 0)){
									return data;
								}
								return this.helpers.returnJsonArray(data.map(item => item.json.items as IDataObject[]).flat());
							},
						]
					},
					operations: {
						pagination: {
							type: 'generic',
							properties: {
								continue: '={{ !!$response.body?.links?.next?.href}}',
								request: {
									url: '={{ $request.url }}{{ $response.body?.links?.next?.href ? "?page="+$response.body.links.next.href.match(/page=([^&]+)/)?.[1] : undefined}}',
								},
							},
						},
					},
				},
				type: 'boolean',
			},
			...openApiProperties,
			...parametersOptions,
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			baseURL: '={{$credentials.serverUrl}}',
		},
	};
}
