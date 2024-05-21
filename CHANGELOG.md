### v1.2.0
 - Add support for ollama models.
 - Implement more advanced retrieval strategies for data sources. (raw, self query, multi query, time weighted)
 - First iteration of implementing plan limits and stripe handling.
 - Make new accounts be Enterprise plan by default when no stripe API key set (for OS users).
 - Make Airbyte setup handled from within webapp instead of install.sh
 - Add human input checkbox on tasks to choose whether a task requires human input
 - Update datasource tables and components to have a new embedding status progress bar.
 - Improve consistency of avatars in chat and make them work with the local storage provider.
 - Improve chat UX and add customer formatting for thoughts, tasks, and tool messages.
 - Add ability to input descriptions on datasource fields for self-query retrieval.
 - Add Docker volume and make Qdrant data persistent in docker-compose.
 - Various bug fixes and optimizations to improve overall performance and reliability.

### v1.1.0
 - Added support for CoreML, CUDA, ROCm to cater to diverse deployment environments.
 - Updated `docker-compose` configurations and `install.sh` script for better setup experience and development workflow. Includes more specific version locking for reliability and easier automation.
 - Implemented a fine-grained permission system.
 - Updated documentation to enhance clarity and user guidance.
 - Redesigned secret management using a factory/provider pattern for Google Secrets and local `.env` configurations.
 - Redesigned file storage using a factory/provider pattern for GCS or to simply store on local disk and share a volume between webapp & vector-db-proxy.
 - Added filename support for MongoDB models and optimized queries.
 - Updated Vector DB Proxy for better structure and maintainability, including production build optimizations.
 - Enhanced local storage handling and introduced thread utilization control.
 - Addressed ESLint warnings, updated configurations, and removed unused dependencies.
 - Enabled avatars for apps and agents, added markdown preview for app descriptions, and improved UI components.
 - Implemented Stripe functionalities for plan management and addon cross-selling.

### 0.5.0
 - Add RAG from file upload or connection to other data source via Airbyte
 - Add vectordb proxy
 - Change default team/org names on signup
 - Add ability to create new teams
 - Add ability to invite users to your team
 - Improve performance and reliability of session chat chunk appending

### 0.4.0
 - Add modal (and support for nested) creation of credentials, agents and groups for a much improved flow of starting a session
 - Fix single agent mode to correctly display the name of the single agent instead of "User Proxy"
 - Implement proper authentication check in sockets and a privileged connection to the agent backend

### v0.3.0
 - Option for single vs multi agent sessions
 - Function calls now support openapi and importing spec from copy/pasted file or URL
 - Update webapp tsconfig to use relative import paths for lib
 - Allow creating a new agent or group in a modal, with "create new" in dropdowns
 - Update AWS SES SDK to v3

### v0.0.4
 - Add OAuth login for Google and Github with Passport
 - Added function calls
   - Add custom functions on frontend or use builtin global functions
   - Code editor using monaco-editor (vscode)
   - Allow adding tools on frontend
 - Update autogen fork to v0.2.7
   - To allow function stuff
   - Various fixes for groups
   - Merge upstream autogen

### v0.0.1 - v0.0.3
 - Changelog didn't exist yet
