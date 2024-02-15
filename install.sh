#!/usr/bin/env bash

# Get the width of the terminal
terminal_width=$(tput cols)

command -v docker-compose >/dev/null 2>&1 || { echo >&2 "docker-compose is required but it's not installed. Aborting."; exit 1; }
command -v git >/dev/null 2>&1 || { echo >&2 "git is required but it's not installed. Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required but it's not installed. Aborting."; exit 1; }
if ! docker info &> /dev/null; then
    echo "Docker daemon is not running. Aborting."
    exit 1
fi

print_logo() {
    clear
    if [ "$terminal_width" -gt 120 ]; then
        echo -e """
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
$1
"""
    else
        echo """-= AgentCloud =-
$1"""
    fi
}


# Function to show usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "    --project-id ID                  Specify the GCP project ID."
    echo "    --service-account-json PATH      Specify the file path of your GCP service account json."
    echo "    --gcs-bucket-name NAME           Specify the GCS bucket name to use."
    echo "    --gcs-bucket-location LOCATION   Specify the GCS bucket location."
    echo "    --openai-api-key KEY             Specify your OpenAI API key."
    echo "    -h, --help                       Display this help message."
}

docker_up() {
    if [ $# -eq 1 ]; then
        local service_name=$1
        docker compose up "$service_name" --build -d
        if [ $? -ne 0 ]; then
            echo "Couldn't start docker services, ensure the docker daemon is running then try again"
            exit 1
            # We could start the docke rservice but then we have to cater to multiple init systems
            # docker_up $1
		fi
    else
        echo "Usage: docker_up <service_name>"
    fi
}

print_logo

usage
echo
# get git hash of current repo for footer
export SHORT_COMMIT_HASH=$(git rev-parse --short HEAD)
echo "=> Welcome to Agentcloud! (rev-$SHORT_COMMIT_HASH)"

# Initialize variables
PROJECT_ID=""
SERVICE_ACCOUNT_JSON_PATH=""
GCS_BUCKET_NAME=""
GCS_BUCKET_LOCATION=""
OPENAI_API_KEY=""

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --project-id) PROJECT_ID="$2"; shift ;;
        --service-account-json) SERVICE_ACCOUNT_JSON_PATH="$2"; shift ;;
        --gcs-bucket-name) GCS_BUCKET_NAME="$2"; shift ;;
        --gcs-bucket-location) GCS_BUCKET_LOCATION="$2"; shift ;;
        --openai-api-key) OPENAI_API_KEY="$2"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; usage; exit 1 ;;
    esac
    shift
done

initialize_environment() {
	# Initialize variables with defaults or arguments
	PROJECT_ID="${PROJECT_ID:-}"
	SERVICE_ACCOUNT_JSON_PATH="${SERVICE_ACCOUNT_JSON_PATH:-}"
	GCS_BUCKET_NAME="${GCS_BUCKET_NAME:-}"
	GCS_BUCKET_LOCATION="${GCS_BUCKET_LOCATION:-}"
	OPENAI_API_KEY="${OPENAI_API_KEY:-}"
	# Check and ask for missing variables
	[ -z "$PROJECT_ID" ] && read -p "Enter your GCP project ID: " PROJECT_ID
	[ -z "$SERVICE_ACCOUNT_JSON_PATH" ] && read -p "Enter the file path of your GCP service account json: " SERVICE_ACCOUNT_JSON_PATH
	[ -z "$GCS_BUCKET_NAME" ] && read -p "Enter the GCS bucket name to use: " GCS_BUCKET_NAME
	[ -z "$GCS_BUCKET_LOCATION" ] && read -p "Enter the GCS bucket location: " GCS_BUCKET_LOCATION
	[ -z "$OPENAI_API_KEY" ] && read -p "Enter your OpenAI API key: " OPENAI_API_KEY
	export PROJECT_ID
	export SERVICE_ACCOUNT_JSON_PATH
	export GCS_BUCKET_LOCATION
	export GCS_BUCKET_NAME
	export OPENAI_API_KEY
}

initialize_environment
print_logo "=> Starting airbyte"

# clone and install airbyte
if [ ! -d "airbyte" ] ; then
	git clone --depth=1 https://github.com/airbytehq/airbyte.git
fi
cd airbyte
./run-ab-platform.sh -b
cd ..

print_logo "=> Starting rabbitmq and vector_db_proxy"

# startup rqbbitmq, qdrant, and vector proxy in advance
docker_up vector_db_proxy

# bypass airbyte setup sceeen
INSTANCE_CONFIGURATION=$(curl 'http://localhost:8000/api/v1/instance_configuration/setup' -X POST \
	-H 'Accept: */*' \
	-H 'Accept-Language: en-US,en;q=0.5' \
	-H 'Accept-Encoding: gzip, deflate, br' \
	-H 'Referer: http://localhost:8000/setup' \
	-H 'Content-Type: application/json' \
	-H 'x-airbyte-analytic-source: webapp' \
	-H 'Origin: http://localhost:8000' \
	-H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' \
	-H 'Connection: keep-alive' \
	--data-raw '{"email":"localhost@localhost.localdomain","anonymousDataCollection":false,"securityCheck":"succeeded","organizationName":"localhost","initialSetupComplete":true,"displaySetupWizard":false}')

export AIRBYTE_ADMIN_WORKSPACE_ID=$(echo $INSTANCE_CONFIGURATION | jq -r '.defaultWorkspaceId')

# create rabbitmq destination
CREATED_DESTINATION=$(curl 'http://localhost:8000/api/v1/destinations/create' --compressed -X POST \
	-H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0' \
	-H 'Accept: */*' \
	-H 'Accept-Language: en-US,en;q=0.5' \
	-H 'Accept-Encoding: gzip, deflate, br' \
	-H 'Referer: http://localhost:8000/workspaces/7b1abeef-4c09-4cad-b23d-539bc236c597/destination/new-destination/e06ad785-ad6f-4647-b2e8-3027a5c59454' \
	-H 'Content-Type: application/json' \
	-H 'x-airbyte-analytic-source: webapp' \
	-H 'Origin: http://localhost:8000' \
	-H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' \
	-H 'Connection: keep-alive' \
	--data-raw '{"name":"RabbitMQ","destinationDefinitionId":"e06ad785-ad6f-4647-b2e8-3027a5c59454","workspaceId":"'"$AIRBYTE_ADMIN_WORKSPACE_ID"'","connectionConfiguration":{"routing_key":"key","username":"guest","password":"guest","exchange":"agentcloud","port":5672,"host":"0.0.0.0","ssl":false}}')

export AIRBYTE_ADMIN_DESTINATION_ID=$(echo $CREATED_DESTINATION | jq -r '.destinationId')

# set the webhook urls for airbyte webhooks back to the webapp
UPDATED_WEBHOOK_URLS=$(curl 'http://localhost:8000/api/v1/workspaces/update' --compressed -X POST \
	-H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0' \
	-H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' \
	-H 'Accept-Encoding: gzip, deflate, br' \
	-H 'Referer: http://localhost:8000/workspaces/8eb14cdb-7d9a-435d-b4c6-9c53b0ca99b6/settings/notifications' \
	-H 'content-type: application/json' \
	-H 'x-airbyte-analytic-source: webapp' \
	-H 'Origin: http://localhost:8000' \
	-H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' \
	-H 'Connection: keep-alive' \
	--data-raw '{"workspaceId":"8eb14cdb-7d9a-435d-b4c6-9c53b0ca99b6","notificationSettings":{"sendOnFailure":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnSuccess":{"notificationType":["slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnConnectionUpdate":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnConnectionUpdateActionRequired":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnSyncDisabled":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnSyncDisabledWarning":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnBreakingChangeWarning":{"notificationType":["customerio"]},"sendOnBreakingChangeSyncsDisabled":{"notificationType":["customerio"]}}}')

print_logo "=> Starting agentcloud backend..."

docker compose up --build -d
