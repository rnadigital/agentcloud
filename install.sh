#!/usr/bin/env bash

set -e
set -o pipefail
trap 'echo "An error occurred during installation. Exiting..."; exit 1; echo "Please forward relevant error logs to the Agentcloud team."' ERR SIGINT

# Get the width of the terminal
terminal_width=$(tput cols)

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    echo >&2 "docker compose is required but it's not installed. Aborting."
fi
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

Note: By default, vector-db-proxy \`cargo build\`'s without the \`--release\` flag, for faster builds during development.
      To change this, set \RELEASE=true\` in your env before running install i.e \`RELEASE=true ./install.sh ...\`.

Options:

    -h, --help                       Display this help message.

    --kill-webapp-next               Kill webapp after startup (for developers)
    --kill-vector-db-proxy           Kill vector-db-proxy after startup (for developers)
    --kill-agent-backend             Kill agent-backend after startup (for developers)
    --minimal                        Don't run the agent-backend, vector-db-proxy, webapp or webapp-syncserver in docker (for developers)

    --project-id ID                  (OPTIONAL) Specify a GCP project ID (for Secret Manager, GCS, etc)
    --service-account-json PATH      (OPTIONAL) Specify the file path of your GCP service account json.
    --gcs-bucket-name NAME           (OPTIONAL) Specify the GCS bucket name to use.
    --gcs-bucket-location LOCATION   (OPTIONAL) Specify the GCS bucket location.

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
        --project-id) PROJECT_ID="$2"; shift ;;
        --service-account-json) SERVICE_ACCOUNT_JSON_PATH="$2"; shift ;;
        --gcs-bucket-name) GCS_BUCKET_NAME="$2"; shift ;;
        --gcs-bucket-location) GCS_BUCKET_LOCATION="$2"; shift ;;
        --stripe-pricing-table-id) STRIPE_PRICING_TABLE_ID="$2"; shift ;;
        --stripe-publishable-key) STRIPE_PUBLISHABLE_KEY="$2"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; usage; exit 1 ;;
    esac
    shift
done

# 
# initialize_environment() {
# 	# Initialize variables with defaults or arguments
# 	PROJECT_ID="${PROJECT_ID:-}"
# 	SERVICE_ACCOUNT_JSON_PATH="${SERVICE_ACCOUNT_JSON_PATH:-}"
# 	GCS_BUCKET_NAME="${GCS_BUCKET_NAME:-}"
# 	GCS_BUCKET_LOCATION="${GCS_BUCKET_LOCATION:-}"
# 	# Check and ask for missing variables
# 	[ -z "$PROJECT_ID" ] && read -p "Enter your GCP project ID: " PROJECT_ID
# 	[ -z "$SERVICE_ACCOUNT_JSON_PATH" ] && read -p "Enter the file path of your GCP service account json: " SERVICE_ACCOUNT_JSON_PATH
# 	[ -z "$GCS_BUCKET_NAME" ] && read -p "Enter the GCS bucket name to use: " GCS_BUCKET_NAME
# 	[ -z "$GCS_BUCKET_LOCATION" ] && read -p "Enter the GCS bucket location: " GCS_BUCKET_LOCATION
# 	export PROJECT_ID
# 	export SERVICE_ACCOUNT_JSON_PATH
# 	export GCS_BUCKET_LOCATION
# 	export GCS_BUCKET_NAME
# }
# 
# initialize_environment

if [ -z "$SERVICE_ACCOUNT_JSON_PATH" ]; then
	echo "The \$SERVICE_ACCOUNT_JSON_PATH variable is not set, continuing with local disk storage and .env secret providers."
elif [ ! -f "$SERVICE_ACCOUNT_JSON_PATH" ]; then
	echo "The file at \$SERVICE_ACCOUNT_JSON_PATH does not exist."
else
    cp "$SERVICE_ACCOUNT_JSON_PATH" webapp/keyfile.json
    cp "$SERVICE_ACCOUNT_JSON_PATH" agent-backend/keyfile.json
    cp "$SERVICE_ACCOUNT_JSON_PATH" vector-db-proxy/keyfile.json
fi

echo "=> Starting airbyte"

# Define the target version
AIRBYTE_TARGET_VERSION="v0.63.9"

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
./run-ab-platform.sh -b &
sleep 0.1
print_logo
wait
cd ..

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
	docker compose up --build -d
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
