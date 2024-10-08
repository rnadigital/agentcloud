#!/usr/bin/env bash


# Function to copy .env.example to .env
copy_env_example() {
	# Check if .env.example exists
	if [ ! -f ".env.example" ]; then
		echo ".env.example file does not exist."
		exit 1
	fi

	# Copy contents of .env.example to .env
	cp .env.example .env
	echo ".env file has been created with the contents of .env.example."
}

# Navigate to the ./webapp directory
cd ./webapp || { 
	echo "Failed to navigate to ./webapp. Directory does not exist."; 
	exit 1; 
}

copy_env_example

cd ../agent-backend || {
    echo "Failed to navigate to ../agent-backend. Directory may not exist";
    exit 1;
}

copy_env_example

cd ../vector-db-proxy || {
    echo "Failed to navigate to ../vector-db-proxy. Directory may not exist";
    exit 1;
}

copy_env_example