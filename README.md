# @lucca/n8n-nodes-lucca

This is an n8n community node. It lets you use [Lucca](https://lucca.fr//) in your n8n workflows.

Lucca is a suite of HR software solutions designed to automate administrative processes such as leave management, expense reports, time tracking, and personnel files.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

### Requirements

* **n8n**: Version 1.0.0 or later.

### Install via n8n (Recommended)

1. Open your n8n instance.
2. Go to **Settings** > **Community Nodes**.
3. Click on **Install**.
4. Enter the package name: `@lucca/n8n-nodes-lucca`.

### Install via npm

If you are running n8n manually or want to include this node in a custom setup, you can install it via npm in your n8n root directory (usually `~/.n8n`):

```bash
npm install @lucca/n8n-nodes-lucca
```

## Operations

### Lucca Node
This node provides a generic interface to the Lucca Public API, allowing you to interact with various resources:
- **Employees**, **JobPositions**, **Employments**, **Departments**, **LegalEntities**, **BusinessEstablishments**.
- More resources to come

### Lucca Webhooks
- **Webhook Trigger**: Receive real-time events from Lucca (e.g. department update, employee creation).

## Credentials

This node uses OAuth2 for authentication.

1. Create an API Key/Application in your Lucca instance (refer to [Lucca documentation](https://developers.lucca.fr/documentation/using-api/authentication#authentication-steps)).
2. in n8n, create a new credential for **Lucca API**.
3. Enter your **Lucca Domain** (e.g., `mydomain` for `https://mydomain.ilucca.net`).
4. Enter your **Client ID** and **Client Secret**.

## Compatibility

Tested with n8n version 1.0.0+.

## Usage

This node uses the OpenAPI definition to dynamically generate available operations.

1. Select the **Lucca** node.
2. Choose the **Resource** you want to interact with (e.g., Employees, Departments).
3. Select the **Operation** (e.g., Get by ID, Create).
4. Fill in the required parameters.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Lucca Developer Portal](https://developers.lucca-hr.com/)
* [Lucca Website](https://www.lucca-hr.com/)

## Technical Details

This node utilizes the [`@devlikeapro/n8n-openapi-node`](https://github.com/devlikeapro/n8n-openapi-node) library to bridge n8n with the Lucca API.

**Why?**
The Lucca Public API aims to be comprehensive, eventually covering many different domains (Core HR, Leaves, Time, etc.). Developing and maintaining specific n8n operations for hundreds of endpoints manually is not feasible.

**How?**
We include the official Open API specification (Swagger) for Lucca in the node package. The `@devlikeapro/n8n-openapi-node` library parses this specification file to dynamically generate:
1.  **Node Operations:** All API endpoints are automatically available as operations in the node.
2.  **UI Parameters:** Input fields for the node are created based on the API parameters and schema.
3.  **Request Handling:** The library handles the construction and execution of HTTP requests based on the selected operation and provided inputs.

This approach ensures that the node stays up-to-date with the API definition and provides full coverage of the available features.

