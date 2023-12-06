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
- `OPENAI_API_KEY` - open ai api key
- `MAX_RETRIES` - number of retries when connecting to webapp socketio
- `AGENT_BACKEND_SOCKET_TOKEN` - token to identify agent backend in socket session
