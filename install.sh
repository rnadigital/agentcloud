#!/usr/bin/env bash

# Get the width of the terminal
terminal_width=$(tput cols)

command -v docker-compose >/dev/null 2>&1 || { echo >&2 "docker-compose is required but it's not installed. Aborting."; exit 1; }
command -v git >/dev/null 2>&1 || { echo >&2 "git is required but it's not installed. Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required but it's not installed. Aborting."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo >&2 "curl is required but it's not installed. Aborting."; exit 1; }

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
    echo """Usage: $0 [options]
Options:
--kill-webapp-next               Kill webapp after startup (for developers)
--kill-vector-db-proxy           Kill vector-db-proxy after startup (for developers)
--kill-agent-backend             Kill agent-backend after startup (for developers)
--project-id ID                  Specify the GCP project ID.
--service-account-json PATH      Specify the file path of your GCP service account json.
--gcs-bucket-name NAME           Specify the GCS bucket name to use.
--gcs-bucket-location LOCATION   Specify the GCS bucket location.
--openai-api-key KEY             Specify your OpenAI API key.
--stripe-pricing-table-id ID     Stripe pricing table ID.
--stripe-publishable-key KEY      Stripe publishable API key.
-h, --help                       Display this help message."""
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
STRIPE_PRICING_TABLE_ID=""
STRIPE_PUBLISHABLE_KEY=""

# Initialize variables to indicate whether to kill specific containers
KILL_WEBAPP_NEXT=0
KILL_VECTOR_DB_PROXY=0
KILL_AGENT_BACKEND=0

# Function to kill a Docker container by service name (remains the same)
kill_container_by_service_name() {
    local service_name=$1
    local container_id=$(docker ps -q -f name="$service_name")
    if [ -n "$container_id" ]; then
        echo "Killing container $container_id of service $service_name..."
        docker kill "$container_id"
        if [ $? -eq 0 ]; then
            echo "$service_name container killed successfully."
        else
            echo "Failed to kill $service_name container."
        fi
    else
        echo "No running container found for service $service_name."
    fi
}

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --kill-webapp-next) KILL_WEBAPP_NEXT=1 ;;
        --kill-vector-db-proxy) KILL_VECTOR_DB_PROXY=1 ;;
        --kill-agent-backend) KILL_AGENT_BACKEND=1 ;;
        --project-id) PROJECT_ID="$2"; shift ;;
        --service-account-json) SERVICE_ACCOUNT_JSON_PATH="$2"; shift ;;
        --gcs-bucket-name) GCS_BUCKET_NAME="$2"; shift ;;
        --gcs-bucket-location) GCS_BUCKET_LOCATION="$2"; shift ;;
        --openai-api-key) OPENAI_API_KEY="$2"; shift ;;
        --stripe-pricing-table-id) STRIPE_PRICING_TABLE_ID="$2"; shift ;;
        --stripe-publishable-key) STRIPE_PUBLISHABLE_KEY="$2"; shift ;;
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
cp "$SERVICE_ACCOUNT_JSON_PATH" webapp/keyfile.json
cp "$SERVICE_ACCOUNT_JSON_PATH" agent-backend/keyfile.json
cp "$SERVICE_ACCOUNT_JSON_PATH" vector-db-proxy/keyfile.json

print_logo "=> Starting airbyte"

# Define the target version
AIRBYTE_TARGET_VERSION="v0.57.1"

# Clone and install airbyte
if [ ! -d "airbyte" ]; then
    git clone --depth=1 --branch "$AIRBYTE_TARGET_VERSION" https://github.com/airbytehq/airbyte.git
else
    # Change to the airbyte directory to check the version
    cd airbyte

    # Check if the current tag matches the target version
    CURRENT_VERSION=$(git tag --points-at HEAD)
    if [ "$CURRENT_VERSION" == "$AIRBYTE_TARGET_VERSION" ]; then
        echo "Airbyte is up-to-date on $AIRBYTE_TARGET_VERSION."
        cd ..
    else
        echo "Warning: You have an outdated version of Airbyte ($CURRENT_VERSION). The target version is $AIRBYTE_TARGET_VERSION."
        # Ask user if they want to delete the outdated version and re-clone
        read -p "Would you like to delete the existing version and re-clone? (y/n): " user_response
        if [[ "$user_response" == "y" ]]; then
            # Move up a directory, delete the outdated version, and re-clone
            cd ..
            rm -rf airbyte
            git clone --depth=1 --branch "$AIRBYTE_TARGET_VERSION" https://github.com/airbytehq/airbyte.git
        fi
    fi

fi

cd airbyte
./run-ab-platform.sh -b
cd ..

print_logo "=> Starting rabbitmq and vector_db_proxy"

# startup rqbbitmq, qdrant, and vector proxy in advance
docker_up vector_db_proxy

# bypass airbyte setup sceeen
INSTANCE_CONFIGURATION=$(curl 'http://localhost:8000/api/v1/instance_configuration/setup' -X POST \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' \
	--data-raw '{"email":"example@example.org","anonymousDataCollection":false,"securityCheck":"succeeded","organizationName":"example","initialSetupComplete":true,"displaySetupWizard":false}')

WORKSPACES_LIST=$(curl 'http://localhost:8006/v1/workspaces' \
    -H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==')

export AIRBYTE_ADMIN_WORKSPACE_ID=$(echo $WORKSPACES_LIST | jq -r '.data[0].workspaceId')
echo $INSTANCE_CONFIGURATION
echo $WORKSPACES_LIST
echo $AIRBYTE_ADMIN_WORKSPACE_ID

# create rabbitmq destination
CREATED_DESTINATION=$(curl 'http://localhost:8000/api/v1/destinations/create' --compressed -X POST \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' \
	--data-raw '{"name":"RabbitMQ","destinationDefinitionId":"e06ad785-ad6f-4647-b2e8-3027a5c59454","workspaceId":"'"$AIRBYTE_ADMIN_WORKSPACE_ID"'","connectionConfiguration":{"routing_key":"key","username":"guest","password":"guest","exchange":"agentcloud","port":5672,"host":"0.0.0.0","ssl":false}}')

export AIRBYTE_ADMIN_DESTINATION_ID=$(echo $CREATED_DESTINATION | jq -r '.destinationId')

# set the webhook urls for airbyte webhooks back to the webapp
UPDATED_WEBHOOK_URLS=$(curl 'http://localhost:8000/api/v1/workspaces/update' --compressed -X POST \
	-H 'content-type: application/json' \
	-H 'Authorization: Basic YWlyYnl0ZTpwYXNzd29yZA==' \
	--data-raw '{"workspaceId":"'"$AIRBYTE_ADMIN_WORKSPACE_ID"'","notificationSettings":{"sendOnFailure":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnSuccess":{"notificationType":["slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnConnectionUpdate":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnConnectionUpdateActionRequired":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnSyncDisabled":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnSyncDisabledWarning":{"notificationType":["customerio","slack"],"slackConfiguration":{"webhook":"http://webapp_next:3000/webhook/sync-successful"}},"sendOnBreakingChangeWarning":{"notificationType":["customerio"]},"sendOnBreakingChangeSyncsDisabled":{"notificationType":["customerio"]}}}')

print_logo "=> Starting agentcloud backend..."

docker compose up --build -d

# At the end of the script, check the variables and kill containers if requested
if [ "$KILL_WEBAPP_NEXT" -eq 1 ]; then
    kill_container_by_service_name "webapp_next"
fi
if [ "$KILL_VECTOR_DB_PROXY" -eq 1 ]; then
    kill_container_by_service_name "vector_db_proxy"
fi
if [ "$KILL_AGENT_BACKEND" -eq 1 ]; then
    kill_container_by_service_name "agent_backend"
fi
