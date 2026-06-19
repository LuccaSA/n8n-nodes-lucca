import {
	IDataObject,
	IExecuteSingleFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

// Generated at build time by `npm run generate` (lib/build/generateOpenApiProperties.cts).
import openApiProperties from './openApiProperties.json';
import parametersOptions from './parametersOptions.json';


export class Lucca implements INodeType {
	description: INodeTypeDescription = {
		subtitle: 'Consume the Lucca API',
		displayName: 'Lucca',
		name: 'lucca',
		icon: 'file:./lucca.svg',
		group: ['transform'],
		version: 2,
		description: 'Lucca node',
		defaults: {
			name: 'Lucca',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		webhooks: [],
		credentials: [
			{
				name: 'luccaOAuth2Api',
				displayName: 'Lucca OAuth2 API',
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
			...(openApiProperties as unknown as INodeProperties[]),
			...(parametersOptions as unknown as INodeProperties[]),
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
