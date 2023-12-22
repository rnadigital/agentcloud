#!/bin/bash

echo """
            ▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒
           ▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
          ▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
          ▓▓▓▓▓  ▒▒▒▒       ▒▒▒
         ▓▓▓▓▓▓ ▒▒▒▒       ▒▒▒
        ▓▓▓▓▓▓ ▒▒▒▒       ▒▒▒▒
        ▓▓▓▓▓  ▒▒▒▒      ▒▒▒▒
       ▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒
      ▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒ ▒▒▒▒▒▒
     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒▒
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒           ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒
   ▓▓▓▓▓▓          ▒▒▒▒▒▒▒ ▒▒▒▒▒▒           ▒▒▒▒▒▒▒           ▒▒▒▒▒▒     ▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒ ▒▒▒▒▒▒ ▒▒▒▒▒
   ▓▓▓▓▓  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒           ▒▒▒▒▒▒     ▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒  ▒▒▒▒▒
  ▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒           ▒▒▒▒▒▒           ▒▒▒▒▒▒      ▒▒▒▒▒▒ ▒▒▒▒▒▒    ▒▒▒▒▒▒  ▒▒▒▒▒▒    ▒▒▒▒▒
 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
"""

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
# TODO: setup qdrand destination and set AIRBYTE_ADMIN_DESTINATION_ID
export AIRBYTE_ADMIN_DESTINATION_ID=......

#docker-compose up
