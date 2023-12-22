# webapp-next

User facing webapp

### env vars:

Mandatory:
- `NODE_ENV` - nodejs environment name
- `DB_URL` - mongodb connection uri e.g. `mongodb://docker_mongo:27017/test`
- `REDIS_HOST` - redis sever hostname
- `REDIS_PASS` - redis server password
- `JWT_SECRET` - secret used to sign JWTs
- `COOKIE_SECRET` - secret used to sign cookies
- `URL_APP` - url of the frontend webapp, e.g. `http://localhost:3000`
- `AGENT_BACKEND_SOCKET_TOKEN` - token to identify agent backend in socket session
- `AIRBYTE_WEB_URL` - http://localhost:8000
- `AIRBYTE_API_URL` - http://localhost:8006
- `AIRBYTE_ADMIN_WORKSPACE_ID` - Default/admin airbyte workspace ID
- `AIRBYTE_ADMIN_DESTINATION_ID` - Destination ID for existing destination to sync to
- `AIRBYTE_USERNAME` - Airbyte username (default: airbyte)
- `AIRBYTE_PASSWORD` - Airbyte username (default: password)

Optional:
- `DEBUG` - for debugging, uses [debug format](https://www.npmjs.com/package/debug). there is webapp:socket, webapp:http, webapp:middleware, webapp:context, webapp:db, or webapp:* for all.
- `PROJECT_ID` - GCP project id
- `GOOGLE_APPLICATION_CREDENTIALS` - if PROJECT_ID is set, the path to GCP service account
- `FROM_EMAIL_ADDRESS` - the email address to send emails from with SES, reads 2 secrets from GCP secret manager: `RAPTOR_APP_AMAZON_ACCESSKEYID` and `RAPTOR_APP_AMAZON_SECRETACCESSKEY`.
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_ACCOUNT_SECRET` - Stripe account secret
- `STRIPE_PRICE_ID` - ID of the Stripe price to create payment links for
- `NEXT_PUBLIC_POSTHOG_KEY` - Posthog public key
- `NEXT_PUBLIC_POSTHOG_HOST` - Posthog endpoint url
- `NEXT_PUBLIC_NO_PAYMENT_REQUIRED` - Set to any value to disable payment requirements for local testing
- `NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH` - Flag to enable Google oauth button on frontend
- `OAUTH_GOOGLE_CLIENT_ID` - Google oauth client id
- `OAUTH_GOOGLE_CLIENT_SECRET` - Google oauth client secret
- `NEXT_PUBLIC_ENABLE_GITHUB_OAUTH` - Flag to enable Github oauth button on frontend
- `OAUTH_GITHUB_CLIENT_ID` - Github oauth client id
- `OAUTH_GITHUB_CLIENT_SECRET` - Github oauth client secret
