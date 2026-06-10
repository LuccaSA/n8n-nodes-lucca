# @lucca/n8n-nodes-lucca

This is an n8n community node. It lets you use [Lucca](https://lucca.fr//) in your n8n workflows.

Lucca is a HRIS solutions designed to automate administrative processes such as leave management, expense reports, time tracking, and employee data.

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
* **mkcert**: For local development with HTTPS (optional but recommended).

### Local Development
1. Clone this repository.
2. Run `npm install` to install dependencies.
```
# Without https (almost impossible to test webhooks locally)
npm run dev # Start the n8n server in HTTP mode.
```
``` 
# Optionnal but recommended for local development with HTTPS and a tunel:
set WEBHOOK_URL=https://<your-tunnel-url>
mkcert -install # Install the local CA (Certificate Authority) in your system trust store.
npm run cert # Generate a local SSL certificate for localhost (creates cert.pem and key.pem).5
npm run dev:https # Start the n8n server in HTTPS mode using the generated certificate.
```

### Install via n8n (Recommended)

1. Open your n8n instance.
2. Go to **Settings** > **Community Nodes**.
3. Click on **Install**.
4. Enter the package name: `@lucca/n8n-nodes-lucca`.

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

Tested with n8n version 2.12.3.

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

This node uses the [`@devlikeapro/n8n-openapi-node`](https://github.com/devlikeapro/n8n-openapi-node) library to bridge n8n with the Lucca API.

**Why?**
The Lucca Public API aims to be comprehensive, eventually covering many different domains (Core HR, Leaves, Time, etc.). Developing and maintaining specific n8n operations for hundreds of endpoints manually is not feasible.

**How?**
We include the official Open API specification (Swagger) for Lucca in the repository. The `@devlikeapro/n8n-openapi-node` library parses this specification to generate:
1.  **Node Operations:** All API endpoints are automatically available as operations in the node.
2.  **UI Parameters:** Input fields for the node are created based on the API parameters and schema.

This approach ensures that the node stays up-to-date with the API definition and provides full coverage of the available features.

> [!IMPORTANT]
> **`@devlikeapro/n8n-openapi-node` is a build-time-only dependency — it is never loaded at runtime.**
>
> n8n Cloud does not allow community nodes to ship with runtime dependencies. To comply, the OpenAPI parsing happens at **build time**, not at run time:
>
> - **Build time** (`npm run generate`, run as part of `npm run build`): the script in
>   [`lib/build/generateOpenApiProperties.cts`](lib/build/generateOpenApiProperties.cts) parses the Lucca OpenAPI spec
>   with `@devlikeapro/n8n-openapi-node` and emits two static files — `nodes/Lucca/openApiProperties.json` and
>   `nodes/Lucca/parametersOptions.json`. These JSON files are generated artifacts (git-ignored) and are produced
>   fresh on every build.
> - **Run time** (inside n8n): `Lucca.node.ts` simply imports those pre-generated JSON files. Neither
>   `@devlikeapro/n8n-openapi-node` nor `openapi-types` is present in the published package — they live in
>   `devDependencies` only, so the shipped node has **zero runtime dependencies**.
>
> Consequently, the build script lives in `lib/build/` (outside `nodes/`) and uses the `.cts` extension so it is
> excluded from the n8n community-node lint rules, which forbid third-party imports and Node.js built-ins in node
> source. If you change the OpenAPI spec, re-run `npm run generate` (or `npm run build`) to regenerate the JSON.

