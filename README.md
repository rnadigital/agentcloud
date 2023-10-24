# agentcloud

https://www.agentcloud.dev/

Welcome to `agentcloud` repository! This project comprises two main components: 

1. **Agent Backend**: A Python application running autogen, communicating through socket.io.
2. **Webapp**: A UI built using next.js, tailwind, and an express custom server.

## Getting Started

To run this project up locally, you'll need docker-compose. Follow the steps below to get started:

1. **Environment Variables**: Before starting the services, ensure you fill out any necessary environment variables in the `docker-compose.yml` file. Make sure to enter your Open AI API  Secret in the `OPENAI_API_KEY` field.
2. **Start Services**: Simply run the following command:

```
docker-compose up
```
This will start both the agent backend and the webapp.

## License

This project is licensed under the Affero General Public License, version 3 only. Please refer to the [LICENSE](LICENSE) file for more details.

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

Thank you for exploring `agentcloud`!
