#!/bin/bash

BIG_LOGO="""
\033[34m            ▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒
\033[34m           ▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
\033[34m          ▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
\033[34m          ▓▓▓▓▓ \033[97m ▒▒▒▒       ▒▒▒
\033[34m         ▓▓▓▓▓▓\033[97m ▒▒▒▒       ▒▒▒
\033[34m        ▓▓▓▓▓▓\033[97m ▒▒▒▒       ▒▒▒▒
\033[34m        ▓▓▓▓▓ \033[97m ▒▒▒▒      ▒▒▒▒
\033[34m       ▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒
\033[34m      ▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
\033[34m     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒ ▒▒▒▒▒▒
\033[34m     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒▒
\033[34m    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ \033[97m ▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒           ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒
\033[34m   ▓▓▓▓▓▓         \033[97m ▒▒▒▒▒▒▒ ▒▒▒▒▒▒           ▒▒▒▒▒▒▒           ▒▒▒▒▒▒     ▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒ ▒▒▒▒▒▒ ▒▒▒▒▒
\033[34m   ▓▓▓▓▓ \033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒           ▒▒▒▒▒▒     ▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒  ▒▒▒▒▒
\033[34m  ▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒           ▒▒▒▒▒▒      ▒▒▒▒▒▒ ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒
\033[34m ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
\033[34m▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ \033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 
\033[34m▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ \033[97m ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒\033[0m
"""

echo -e "$BIG_LOGO"

# get git hash of current repo for footer
export SHORT_COMMIT_HASH=$(git rev-parse --short HEAD)
echo "=> Welcome to Agentcloud! (rev-$SHORT_COMMIT_HASH)"

# ask for CGP/GCS stuff
read -p "Enter your GCP project ID: " PROJECT_ID
export PROJECT_ID
read -p "Enter the file path of your GCP service account json: " SERVICE_ACCOUNT_JSON_PATH
cp $SERVICE_ACCOUNT_JSON_PATH webapp/keyfile.json
read -p "Enter the GCS bucket name to use: " GCS_BUCKET_NAME
export GCS_BUCKET_NAME
read -p "Enter your OpenAI API key: " OPENAI_API_KEY
export OPENAI_API_KEY

clear
echo -e "$BIG_LOGO"
echo "=> Starting rabbitmq, qdrant and vector_db_proxy"

# startup rqbbitmq, qdrant, and vector proxy in advance
docker-compose up rabbitmq -d
docker-compose up qdrant -d
# docker-compose up vector_db_proxy -d

clear
echo -e "$BIG_LOGO"
echo "=> Starting airbyte"

# clone and install airbyte
if [ ! -d "airbyte" ] ; then
	git clone --depth=1 https://github.com/airbytehq/airbyte.git
fi
cd airbyte
./run-ab-platform.sh -b
cd ..

# bypass airbyte setup sceeen
INSTANCE_CONFIGURATION=`curl 'http://localhost:8000/api/v1/instance_configuration/setup' -X POST -H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: http://localhost:8000/setup' -H 'content-type: application/json' -H 'x-airbyte-analytic-source: webapp' -H 'Origin: http://localhost:8000' -H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' -H 'Connection: keep-alive' \
	--data-raw '{"email":"localhost@localhost.localdomain","anonymousDataCollection":false,"securityCheck":"succeeded","organizationName":"localhost","initialSetupComplete":true,"displaySetupWizard":false}'`
export AIRBYTE_ADMIN_WORKSPACE_ID=`echo $INSTANCE_CONFIGURATION | jq -r '.defaultWorkspaceId'`
CREATED_DESTINATION=`curl 'http://localhost:8000/api/v1/destinations/create' --compressed -X POST -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: http://localhost:8000/workspaces/7b1abeef-4c09-4cad-b23d-539bc236c597/destination/new-destination/e06ad785-ad6f-4647-b2e8-3027a5c59454' -H 'content-type: application/json' -H 'x-airbyte-analytic-source: webapp' -H 'Origin: http://localhost:8000' -H 'DNT: 1' -H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' -H 'Connection: keep-alive' \
             --data-raw '{"name":"RabbitMQ","destinationDefinitionId":"e06ad785-ad6f-4647-b2e8-3027a5c59454","workspaceId":"7b1abeef-4c09-4cad-b23d-539bc236c597","connectionConfiguration":{"routing_key":"key","username":"guest","password":"guest","exchange":"agentcloud","port":5672,"host":"0.0.0.0","ssl":false}}'`
export AIRBYTE_ADMIN_DESTINATION_ID=`echo $CREATED_DESTINATIO | jq -r '.destinationId'`

clear
echo -e "$BIG_LOGO"
echo "=> Starting agentcloud backend..."

docker-compose up
