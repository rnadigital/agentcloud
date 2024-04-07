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

The script will prompt for some details, or you can pass them as command line arguments:

```
~$ ./install.sh --help
Usage: ./install.sh [options]
Options:
    --project-id ID                  Specify the GCP project ID.
    --service-account-json PATH      Specify the file path of your GCP service account json.
    --gcs-bucket-name NAME           Specify the GCS bucket name to use.
    --gcs-bucket-location LOCATION   Specify the GCS bucket location.
    -h, --help                       Display this help message.
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
