---
sidebar_position: 1
---

# Intro to Agent Cloud

The Agent Cloud platform is designed to enable developers/staff in companies to host, build and share their own private LLM based chatbots that can securely access their own data.

To achieve this we have built a scalable SaaS application that combines a few open source projects into one architecture.

## Architecture
The current stack as of Dec 2023 is listed below. Below are the core components that are used in the app.

<iframe width="100%" height="463" src="https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=Agentcloud%20architecture.drawio#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D166GrZaON9X8cy9G5Xdv4G5XsjMoJGRCF%26export%3Ddownload"></iframe>

### Web Application
The web app is built using Next JS, Tailwind CSS and communicates with the back end application via sockets to enable realtime streaming of LLM responses in the chat interface.

### Back End
The main web app back end is built using Python and primarly acts as a service that recieves LLM responses. This imports the Microsoft Autogen framework to enable Multi Agent Conversations.

### Databases


### RAG Retrieval
- Airbyte for ETL
- Qdrant as a Vector DB
- Rabbit MQ to



