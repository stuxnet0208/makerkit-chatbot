# Next.js Chatbot SaaS Template

This application is a Chatbot SaaS App Demo bootstrapped with the Makerkit Next.js
Supabase kit.

This application **is a demo app** and **may have bugs and issues**.
If you plan on using it in a production environment, please **ensure you test
it thoroughly and fix any issues you may find**. 

The scope of this app is to show patterns and best practices for building a SaaS with Makerkit - and not to be a production-ready application.

## Details

This application is a demo application that allows you to create a Chatbot SaaS application.

Users can:
1. Create chatbots in an Organization (based on plan details)
2. Update the chatbot settings (e.g. name, description, etc.) and branding (e.g. colors, etc.)
3. Crawl websites and train the chatbot using OpenAI
4. Embed the chatbot on their website using a widget imported with a simple script tag

NB: this demo application is considered feature-complete, so it's unlikely more features will be added. However, I will fix bugs and issues as they are reported.

## Requirements (Chatbot SaaS)

To make the Chatbot SaaS template application work, you will need to:

1. Open an Upstash (QStash) account or replace the Task Queue with any other task queue service (e.g. AWS SQS, Google Cloud Tasks, Inngest, Trigger, etc.)
2. Open an Open AI account and create an API key
3. Open a Supabase account and create a project
4. Open a Stripe account and create a product

Additionally, you will setup the rest of the environment variables of the Core kit as described in the documentation.

#### Adding the required environment variables

To run the application, you will need to add the following environment variables:

```
## In the Next.js App

OPENAI_API_KEY=
NEXT_PUBLIC_CHATBOT_API_URL=/api/chat
NEXT_PUBLIC_WIDGET_HOSTING_URL=makerkit-chatbot.js

## In the Chatbot Widget

NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:3000/api/chat
WIDGET_CSS_URL=./makerkit-chatbot.css
CHATBOT_SDK_NAME=makerkit-chatbot.js
WIDGET_SETTINGS_ENDPOINT=http://localhost:3000/api/chatbot
```

These values work for development. For production, you will need to change them to point to absolute URLs based on where you're hosting the application.

For example, if you're hosting the application on `https://myapp.com`, you will need to change the values to:

```
## In the Next.js App
OPENAI_API_KEY=
NEXT_PUBLIC_CHATBOT_API_URL=https://myapp.com/api/chat
NEXT_PUBLIC_WIDGET_HOSTING_URL=https://myapp.com/makerkit-chatbot.js

## In the Chatbot Widget
NEXT_PUBLIC_CHATBOT_API_URL=https://myapp.com/api/chat
WIDGET_CSS_URL=https://myapp.com/makerkit-chatbot.css
CHATBOT_SDK_NAME=https://myapp.com/makerkit-chatbot.js
WIDGET_SETTINGS_ENDPOINT=https://myapp.com/api/chatbot
```

Please make sure not to use the .env files for production keys (OPENAI and QSTASH). Instead, use the environment variables provided by your hosting provider.
Locally, you can use the .env.local file - which is ignored by git and will not be pushed to the repository.

#### Additional Configuration

You can also change the following environment variables:

```
# The maximum number of documents returned by the retriever. Less results in faster response times.
# The default is 2.
CHATBOT_MAX_DOCUMENTS=2

# The similarity threshold for the retriever.
# The default is 0.8.
CHATBOT_SIMILARITY_THRESHOLD=0.8

# The OpenAI model to use for the Chatbot.
# The default is gpt-3.5-turbo.
OPENAI_MODEL=gpt-3.5-turbo
```

#### Indexing Chunk Size

By default, we index embeddings using chunks with length 1500. This is to make sure we don't hit the maximum context length.

If you use models that allow indexing a larger chunk size, you can tweak the settings using the following environment variable:

```
DOCUMENT_CHUNK_SIZE=4000
```

### Building the Chatbot Widget

To build the Chatbot Widget during development, run the following command:

```
npm run build:widget
```

This will create a `makerkit-chatbot.js` file in the `dist` folder.

To create a production build, run:

```
npm run build:widget:production
```

You can make this command part of your CI/CD pipeline to deploy the Chatbot Widget to a CDN.

#### Environment Variables

You need to update the file `packages/widget/.env` to update the environment variables for the Chatbot Widget. The production environment variables are instead in the file `.env.production`.


### Deploying the Chatbot Widget

You will need to deploy the Chatbot Widget to a CDN. You can use any CDN you prefer, such as Cloudflare Pages, Netlify, Vercel, etc.

Simply upload the `dist` folder to the CDN and make sure to set the correct headers for the files.

Then, update the `NEXT_PUBLIC_WIDGET_HOSTING_URL` environment variable to point to the URL of the Chatbot Widget.

### Testing a Chatbot Widget

Create an `index.html` in the `dist` folder and paste the Chatbot Widget code (you can find it in the `Publish` tab of the Chatbot). For example:

```html
<script data-chatbot='2' src='makerkit-chatbot.js'></script>
```

Make sure to change the `data-chatbot` attribute to the ID of the chatbot you want to test.

Then, open the file in your browser. You should see the chatbot widget.

To run a server locally, you can use:

```
npm run serve:widget
```

#### Adding a Plan to the Database

You are free to specify your own limitations in the DB.

To add a plan, you will insert a new row in the `plans` table. The `plans` table has the following information:

```sql
create table plans (
  name text not null,
  price_id text not null,
  max_documents bigint not null,
  max_messages bigint not null,
  max_chatbots bigint not null,
  primary key (price_id)
);
```

1. The `max_chatbots` is the number of chatbots the user can create
2. The `max_messages` is the number of AI-generated messages the chatbot will reply to. If exceeded, the chatbot will reply with a list of matching articles from the knowledge base
3. The `max_documents` is the number of documents the user can add to the knowledge base (or the number of pages the user can crawl)

The `price_id` is the ID of the Stripe Price. You can find it in the Stripe dashboard.

If the Price is an annual price, the SQL function checking the messages count will automatically divide the quota by 12.

## QStash Environment Variables

We use QStash to run the background tasks that are used to crawl websites and train the chatbot. We crawl 30 pages for each task. We automatically add delays between each task to be gentle with the websites we crawl.

To run the application, you will need to add the following environment variables:

```
QSTASH_TOKEN=
QSTASH_URL=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

You can grab these values from your Upstash QStash dashboard.

NB: You can change the Task Queue to any other service you prefer, such as AWS SQS, Google Cloud Tasks, Inngest, Trigger, etc. 
You will need to adjust the code accordingly.

### QStash endpoint

To test your queues locally, you need to run the QStash endpoint locally. You have various options, such as creating a tunnel with Ngrok, Cloudflare Tunnel, LocalCan, or even VSCode Port Forwarding.

In such case, your `QSTASH_URL` will be the URL of the tunnel. Assuming your tunnel URL is `https://next-supabase-chatbot.ngrok.com`, you will set the following environment variable:

```
QSTASH_URL=https://next-supabase-chatbot.ngrok.com/api/tasks/execute
```

As you can see, you will need to add `/api/tasks/execute` at the end of the URL, which points to the `execute` endpoint of the `tasks` API.

---

# Next.js Supabase SaaS Starter Kit (Core Kit documentation)

MakerKit is a SaaS starter project built with Next.js, Supabase and Tailwind CSS.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

This is a quick guide to get you started with the project. For more details, 
please refer to the [documentation](https://makerkit.dev/docs/next-supabase/introduction).

### Before you deploy to production

Many users try to deploy to production without going through the steps below.
The result is the application won't be working as expected.

**Important**: deploying to production (Vercel or other) will require you to 
fill the required environment variables. 

[Please refer to the documentation](https://makerkit.dev/docs/next-supabase/going-to-production-overview) to 
learn more.

**Failure to do so will result in your application not working as expected 
or not deploying at all**. Please ensure you have the required environment 
variables and keys before deploying to production.

### Requirements

Ensure you have the following installed:

- Node.js (LTS recommended)
- Git
- Docker

### Cloning the Repository

Clone this repository and name it according to your preferences (in the example below, we use `your-saas`):

```
git clone https://github.com/makerkit/next-supabase-saas-kit.git your-saas
```

Move to the folder just cloned:

```
cd your-saas
```

Set this repository as your upstream fork, so you can
pull updates when needed:

```
git remote add upstream https://github.com/makerkit/next-supabase-saas-kit
```

We recommend to watch to the repository, so you know when there's an update.
To pull the latest updates, use:

```
git pull upstream main
```

In case we change the same files, you will need to resolve the conflicts.

Alternatively, you can cherry-pick changes so to reduce the amount of
conflicts across the files.

### Installing the Node Modules

Install the Node modules with the following command:

```
npm i
```

### Supabase

First, run the Supabase stack:

```bash
npm run supabase:start
```

**NB**: this does not run your remote Supabase project, but a local instance
using Docker. This is useful for development and testing.

For production, you will need to copy your remote instance keys, and push 
the database migrations to your remote instance.

**Recommendation**: use the local instance for development, and the
production instance **when you're ready to deploy**. Please set up the local
instance first before attempting to use the production instance, so that you 
can test your application locally and familiarise with the product.

If you are planning to deploy Supabase to production right away, [please ensure you read this guide by Supabase first](https://supabase.com/docs/guides/cli/local-development#link-your-project).

#### Adding the Supabase Keys to the Environment Variables

We add the default Supabase keys to the environment variables, so we can run 
Supabase locally right away.

When running the command, we will see a message like this:

```bash
> supabase start

Applying migration 20221215192558_schema.sql...
Seeding data supabase/seed.sql...
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: ****************************************************
service_role key: ****************************************************
```

Only if the values above are different than the ones already setup in `.env.
development` and `.env.test`, we need to copy the `anon key` and 
`service_role key` values and add them to the `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=****************************************************
SUPABASE_SERVICE_ROLE_KEY=****************************************************
```

#### Database types (optional)

We provide the default database types for TypeScript. If you want to 
generate new types, you can do so with the following command:

```
npm run typegen
```

This is useful when you add/update new tables or columns to your database, 
so that the Supabase client can provide you with the correct types.

### Next.js Server

Then, run the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Use any of the above commands to start the Next.js server.

### Running the Stripe CLI

If you're testing Stripe, also run the Stripe server (requires Docker running):

```
npm run stripe:listen
```

Then, copy the printed webhook key and add it to your environment files.
This can also be used for running the E2E tests.

The environment variable name is `STRIPE_WEBHOOK_SECRET`.

```
STRIPE_WEBHOOK_SECRET=whsec_***********************
```

#### Signing In for the first time

You should now be able to sign in. To quickly get started, use the following credentials:

```
email = test@makerkit.dev
password = testingpassword
```

#### Email Confirmations

When signing up, Supabase sends an email confirmation to a testing account. You can access the InBucket testing emails [using the following link](http://localhost:54324/monitor), and can follow the links to complete the sign up process.

InBucket is an SMTP testing service that Supabase uses to send emails.

### After Creating your Supabase Project

Make sure to add the environment variables to the provider you're deploying.

### Running Tests

To customize the testing environment, add the required environment variables to 
your `.env.test` file.

#### Running E2E Stripe Tests

To run the Stripe tests and enable Stripe in development mode, you need to:

1. Enable the tests using the environment variable `ENABLE_STRIPE_TESTING` in
   `.env.test`
2. Have Docker installed and running in your local machine to run the Stripe
   CLI
3. Generate a webhook key and set the environment variable
   `STRIPE_WEBHOOK_SECRET` and the other required Stripe environment variables

The first two steps are only required to run the Cypress E2E tests for
Stripe. Generating a webhook key and running the Stripe CLI server is
always required for developing your Stripe functionality locally.

The variables should be added either in `.env.test` or as part of your CI 
environment. 

NB: The secret keys should not be added to the repository - even 
though these are test keys. Instead - please add them to your CI 
environment - such as Github Actions.

The test API keys should be added as secrets - while the variable 
ENABLE_STRIPE_TESTING should be added as a simple variable.

To generate a webhook key, run the following command:

```
npm run stripe:listen
```

If it worked, it will print the webhook key. Then, paste it into
your environment files as `STRIPE_WEBHOOK_SECRET`.

This key is also needed to run Stripe during development to receive the
Stripe webhooks to your local server.

```
ENABLE_STRIPE_TESTING=true
```

The Stripe tests work only using the Embedded Stripe Checkout.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
