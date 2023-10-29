# agentcloud

https://www.agentcloud.dev/

Welcome to `agentcloud` repository! This project comprises two main components: 

1. **Agent Backend**: A Python application running autogen, communicating through socket.io.
2. **Webapp**: A UI built using next.js, tailwind, and an express custom server.

## Getting Started

To run this project up locally, you'll need docker-compose. Follow the steps below to get started:

1. **Environment Variables**: Before starting the services, ensure you fill out any necessary environment variables in the `docker-compose.yml` file.
  - [webapp env vars](webapp/README.md)
  - [agent backend env vars](agent-backend/README.md)
2. **Start Services**: Simply run the following command:

```
docker-compose up
```
This will start both the agent backend and the webapp.

## Current Workflow

1. A task is passed to the `team-generation` team
2. Based on the task, the `team-generation` team creates the *ideal* team to undertake the task (so, we are utilising Autogen to formulate the team)
3. The user can give feedback to Autogen to augment the team if they wish
4. Once the user is happy with the team, they type exit  (it's a bit unintuitive, we know; we're working on changing it), which ends the team generation step and immediately initiates `task-execution`
  using the newly formulated team, the task is then undertaken using standard Autogen workflow

## License

This project is licensed under the Affero General Public License, version 3 only. Please refer to the [LICENSE](LICENSE) file for more details.

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

Thank you for exploring `agentcloud`!
