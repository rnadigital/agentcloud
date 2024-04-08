![AgentCloud Logo](https://github.com/rnadigital/agentcloud/blob/master/webapp/public/agentcloud-full-white-bg-trans.png)

# AgentCloud
<div align="center">
  <p>AgentCloud is an open-source platform enabling companies to build and deploy private LLM chat apps (like ChatGPT), empowering teams to securely interact with their data.</p>
</div>

<p align="center">
  <br />
  <a href="https://docs.agentcloud.dev/documentation/get-started/quickstart" rel="dofollow"><strong>Explore our docs »</strong></a>
  <br />

  <br/>
    <a href="https://docs.agentcloud.dev/documentation/get-started/quickstart">Get Started with AgentCloud</a>
    ·
    <a href="https://docs.agentcloud.dev/documentation/get-started/quickstart">Run Locally</a>
    ·
    <a href="https://docs.agentcloud.dev/documentation/get-started/demo-chat-rag-bigquery">Demo - RAG Google Bigquery</a>
    ·
    <a href="https://discord.gg/82BWMRHVpy">Join Our Discord Community</a>
    ·
    <a href="https://www.agentcloud.dev/blog">Read our Blog</a>
  </p>

<br />

<p align="center">
  <a href="https://www.youtube.com/watch?v=vLpi6NPOXwU" target="_blank">
       <img src="https://github.com/rnadigital/agentcloud/blob/master/assets/agent-cloud-introduction-RAG-google-gigquery-youtube.png">
  </a>
</p>

<p align="center">

</p>

## Introduction

Welcome to `agentcloud`. This project comprises three main components: 

1. **Agent Backend**: A Python application running crewai, communicating LLM messages through socket.io
2. **Webapp**: A UI built using next.js, tailwind, and an express custom server.
3. **Vector Proxy:** A Rust application which communicates with Qdrant vector Database

## Getting Started

To run this project locally, follow these steps:

1. **Clone the repository**: `git clone https://github.com/rnadigital/agentcloud.git`
2. **Install Docker**: [Install Docker](https://docs.docker.com/get-docker/)
3. **Start Services**:
   - **For Mac & Linux**: Run the following command:
     ```
     chmod +x install.sh && ./install.sh
     ```

   - Follow the prompts or provide command-line arguments as needed.

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

- **For Windows**: (Coming soon...)

***For now there is a reliance on GCP for Bucket storage to store files. (We will add AWS S3, Local Disk in future releases.)***

For more detailed installation instructions, please refer to our [Installation Guide](https://docs.agentcloud.dev/documentation/get-started/quickstart).


## License

This project is licensed under the GNU Affero General Public License, version 3 only.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the list of changes in each version.

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

We welcome contributions and feedback from the community. Thank you for exploring `agentcloud`!
