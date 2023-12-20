![agentcloud-full-black-bg-trans](https://github.com/rnadigital/agentcloud/assets/47853125/3efbf8bc-9d3b-445f-8c0b-5e7899300616)
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

Mac & Linux:
```
SHORT_COMMIT_HASH=$(git rev-parse --short HEAD) docker-compose up --build
```

Windows:
```
$SHORT_COMMIT_HASH = $(git rev-parse --short HEAD)
docker-compose up
```

This will start both the agent backend and the webapp.

## License

This project is licensed under the GNU Affero General Public License, version 3 only.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

Thank you for exploring `agentcloud`!
