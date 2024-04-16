![AgentCloud Logo](https://github.com/rnadigital/agentcloud/assets/47853125/2ac68e33-16cd-47ea-b59e-2446b8d3711e)

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
  <a href="https://youtu.be/POLdnrjsy9c?si=o88WMNHXEYkIiW0k" target="_blank">
       <img src="https://github.com/rnadigital/agentcloud/blob/master/webapp/public/images/agent-cloud-introduction-RAG-google-gigquery-youtube.png">
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

Note: By default, vector-db-proxy `cargo build`'s without the `--release` flag, for faster builds during development.
      To change this, set RELEASE=true` in your env before running install i.e `RELEASE=true ./install.sh ...`.

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

- **For Windows**: (Coming soon...)

## License

This project is licensed under the GNU Affero General Public License, version 3 only.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the list of changes in each version.

## Contributions & Feedback

If you wish to contribute or provide feedback, please follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

We welcome contributions and feedback from the community. Thank you for exploring `agentcloud`!
