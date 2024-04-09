![agentcloud-full-black-bg-trans](https://github.com/rnadigital/agentcloud/assets/47853125/3efbf8bc-9d3b-445f-8c0b-5e7899300616)
# agentcloud

https://www.agentcloud.dev/

**🎥 Watch our [Intro video here](https://youtu.be/POLdnrjsy9c)**

**👨‍💻 See our [docs here](https://docs.agentcloud.dev)**

Welcome to `agentcloud` repository! An AI App builder platform for companies (like OAI GPTs) with some extra goodies.

This project comprises three main components: 
1. **Agent Backend**: A Python application running crewai, communicating LLM messages through socket.io, enabling single + multi agent apps.
2. **Webapp**: A UI built using next.js, tailwind, and an express custom server which can communicate with Airbyte an ETL platform to extract data from hundreds of connectors.
3. **Vector Proxy:** A Rust application which can split, chunk and locally embed and store embeddings in a local vector Database Qdrant.

You can read more about Agent Cloud [high level concepts here](https://docs.agentcloud.dev/documentation/get-started/introduction).

## Getting Started
Access a [detailed guide here](https://docs.agentcloud.dev/documentation/get-started/quickstart)

To run this project up locally, clone this repo and run Docker.
1. **Start Services**: Simply run the following command:

Mac & Linux:
```
chmod +x install.sh && ./install.sh
```

The script will install agentcloud and bring it up on [http://localhost:3000](http://localhost:3000).

```
~$ ./install.sh --help

Usage: ./install.sh [options]

Note: By default, vector-db-proxy `cargo build`'s without the `--release` flag, for faster builds during development.
      To specify a different dockerfile (i.e the non dev one), do `VECTOR_PROXY_DOCKERFILE=Dockerfile ./install.sh ...`

Options:

    -h, --help                       Display this help message.

    --kill-webapp-next               Kill webapp after startup (for developers)
    --kill-vector-db-proxy           Kill vector-db-proxy after startup (for developers)
    --kill-agent-backend             Kill agent-backend after startup (for developers)

    --project-id ID                  (OPTIONAL) Specify a GCP project ID (for Secret Manager, GCS, etc)
    --service-account-json PATH      (OPTIONAL) Specify the file path of your GCP service account json.
    --gcs-bucket-name NAME           (OPTIONAL) Specify the GCS bucket name to use.
    --gcs-bucket-location LOCATION   (OPTIONAL) Specify the GCS bucket location.

```

Windows:

(Coming soon...)

## License

This project is licensed under the GNU Affero General Public License, version 3 only.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

Thank you for exploring `agentcloud`!
