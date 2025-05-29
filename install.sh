#!/usr/bin/env bash

# set -e
# set -o pipefail
# trap 'echo "An error occurred during installation. Exiting..."; exit 1; echo "Please forward relevant error logs to the Agentcloud team."' ERR SIGINT
# set -e
# set -o pipefail
# trap 'echo "An error occurred during installation. Exiting..."; exit 1; echo "Please forward relevant error logs to the Agentcloud team."' ERR SIGINT

# Get the width of the terminal
terminal_width=$(tput cols)

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    echo >&2 "docker compose is required but it's not installed. Aborting."
fi
command -v git >/dev/null 2>&1 || { echo >&2 "git is required but it's not installed. Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required but it's not installed. Aborting."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo >&2 "curl is required but it's not installed. Aborting."; exit 1; }
command -v sed >/dev/null 2>&1 || { echo >&2 "sed is required but it's not installed. Aborting."; exit 1; }

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

    -h, --help                       Display this help message.

    --kill-webapp-next               Kill webapp after startup (for developers)
    --kill-vector-db-proxy           Kill vector-db-proxy after startup (for developers)
    --kill-agent-backend             Kill agent-backend after startup (for developers)
    --minimal                        Don't run the agent-backend, vector-db-proxy, webapp or webapp-syncserver in docker (for developers)
"""
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
STRIPE_PRICING_TABLE_ID=""
STRIPE_PUBLISHABLE_KEY=""
export AIRBYTE_RABBITMQ_HOST=$(ip address | grep -v 127.0.0.1 | grep -F "inet " | awk '{print $2}' | cut -d'/' -f1 | head -n 1)

echo "Airbyte RabbitMQ Host: ${AIRBYTE_RABBITMQ_HOST}"

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
        --minimal) MINIMAL=1 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; usage; exit 1 ;;
    esac
    shift
done

echo "=> Starting airbyte"

# env to disable airbyte telemetry
DO_NOT_TRACK=1

if ! command -v abctl &> /dev/null; then
	echo "'abctl' command not found. Installing Airbyte..."
	curl -LsfS https://get.airbyte.com | bash -
else
	echo "'abctl' command is already installed."
fi

# Define the chart version to use
ABCTL_CHART_VERSION=

# Create values.yaml for disabling authentication
cat > values.yaml << EOL
global:
  auth:
    enabled: false
EOL

echo "=> Installing Airbyte with authentication disabled..."
if [[ -z "$ABCTL_CHART_VERSION" || "$ABCTL_CHART_VERSION" == "" ]]; then
    abctl local install --values ./values.yaml
else
    abctl local install --chart-version $ABCTL_CHART_VERSION --values ./values.yaml
fi

retry_curl() {
        local url=$1
        local data=$2
        while true; do
                curl "$url" -X POST -H 'content-type: application/json' --data-raw "$data" && break
                echo "Curl request failed. Retrying in 3 seconds..."
                sleep 3
        done
}

retry_curl 'http://localhost:8000/api/v1/instance_configuration/setup' '{"email":"example@example.org","anonymousDataCollection":true,"securityCheck":"skipped","organizationName":"example-org","initialSetupComplete":true,"displaySetupWizard":false}'

echo "=> Starting agentcloud backend..."


docker pull downloads.unstructured.io/unstructured-io/unstructured-api:latest || {
	clear
	echo "⚠️  Warning: Failed to pull the 'unstructured-api' image from the remote repository."
	echo "    Proceeding without the latest 'unstructured-api' image. Please check your network or the repository URL."
	sleep 1
}

docker tag downloads.unstructured.io/unstructured-io/unstructured-api:latest localhost:5000/unstructured-api || {
	clear
	echo "⚠️  Warning: Failed to tag the 'unstructured-api' image for local use."
	echo "    Proceeding without updating the image tag. Please ensure the image was pulled correctly."
	sleep 1
}

if [ "$MINIMAL" -eq 1 ]; then
	docker compose -f docker-compose.minimal.yml up --build -d
else
    docker compose up -d
fi

# At the end of the script, check the variables and kill containers if requested
if [ "$KILL_WEBAPP_NEXT" -eq 1 ]; then
    kill_container_by_service_name "webapp_next"
fi
if [ "$KILL_WEBAPP_NEXT" -eq 1 ]; then
    kill_container_by_service_name "webapp_syncserver"
fi
if [ "$KILL_VECTOR_DB_PROXY" -eq 1 ]; then
    kill_container_by_service_name "vector_db_proxy"
fi
if [ "$KILL_AGENT_BACKEND" -eq 1 ]; then
    kill_container_by_service_name "agent_backend"
fi