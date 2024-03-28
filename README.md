![agentcloud-full-black-bg-trans](https://github.com/rnadigital/agentcloud/assets/47853125/3efbf8bc-9d3b-445f-8c0b-5e7899300616)
# agentcloud

https://www.agentcloud.dev/
Watch our Intro video here
https://youtu.be/POLdnrjsy9c

Welcome to `agentcloud` repository! This project comprises three main components: 

1. **Agent Backend**: A Python application running crewai, communicating LLM messages through socket.io
2. **Webapp**: A UI built using next.js, tailwind, and an express custom server.
3. **Vector Proxy:** A Rust application which communicates with Qdrant vector Database

## Getting Started

To run this project up locally, clone this repo and run Docker.
For now there is a reliance on GCP for Bucket storage to store files. (We will add AWS S3, Local Disk in future releases.)
Follow the steps below to get started:

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
    --openai-api-key KEY             Specify your OpenAI API key.
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
