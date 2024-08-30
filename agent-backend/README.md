# agent-backend

Python backend that is repsonsible to serve agents

### env vars:

Mandatory:
- `LOCAL` - `True` or `False`, whether the app is running locally, sets some default db url
- `MAX_THREADS` - 50
- `OAI_CONFIG_LIST` - path of open ai config list file
- `BASE_PATH` - base path of the app, only really used when in docker otherwise just "."
- `SOCKET_URL` - url of the frontend webapp (to connect with socketio) e.g. `http://webapp_next:3000/`
- `DB_URL` - mogodb connection uri e.g. `mongodb://docker_mongo:27017/test`
- `MONGO_DB_NAME` - mongodb db name
- `QDRANT_HOST` - hostname of qdrant
- `OPENAI_API_KEY` - open ai api key
- `MAX_RETRIES` - number of retries when connecting to webapp socketio
- `AGENT_BACKEND_SOCKET_TOKEN` - token to identify agent backend in socket session
- `GCS_BUCKET_NAME_PRIVATE` - name of the private GCS bucket e.g. `agentcloud-bucket-dev`
- `GCS_BUCKET_NAME` - name of the public GCS bucket e.g. `agentcloud-public-dev`
- `UPLOADS_BASE_PATH` - base path for uploads e.g. `/tmp`
- `GOOGLE_APPLICATION_CREDENTIALS` - path to Google application credentials file e.g. `keyfile.json`
- `PROJECT_ID` - Google Cloud project ID e.g. `agentcloud-dev`
- `STORAGE_PROVIDER` - storage provider e.g. `google`
- `UPLOADS_BASE_PATH` - base path for local uploads e.g. `/tmp`