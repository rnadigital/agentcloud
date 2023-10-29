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

Optional:
- `PROJECT_ID` - GCP project id
- `GOOGLE_APPLICATION_CREDENTIALS` - if PROJECT_ID is set, the path to GCP service account
- `FROM_EMAIL_ADDRESS` - the email address to send emails from with SES, reads 2 secrets from GCP secret manager: `RAPTOR_APP_AMAZON_ACCESSKEYID` and `RAPTOR_APP_AMAZON_SECRETACCESSKEY`.
