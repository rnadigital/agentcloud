# agentcloud

https://www.agentcloud.dev/

Welcome to `agentcloud` repository! This project comprises two main components: 

1. **Agent Backend**: A Python application running autogen, communicating through socket.io.
2. **Webapp**: A UI built using next.js, tailwind, and an express custom server.

## Getting Started

To get this project up and running, we utilize docker-compose. Follow the steps below to get started:

1. **Environment Variables**: Before starting the services, ensure you fill out any necessary environment variables in the `docker-compose.yml` file.
2. **Start Services**: Simply run the following command:

```
docker-compose up
```
This will start both the agent backend and the webapp.

## License

This project is licensed under the Affero General Public License, version 3 only. Please refer to the `LICENSE` file for more details.

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in `CONTRIBUTING.md`.

Thank you for exploring `agentcloud`!
