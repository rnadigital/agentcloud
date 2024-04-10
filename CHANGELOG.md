### v1.1.0
 - **Hardware Acceleration Support**: Added support for CoreML, CUDA, ROCm to cater to diverse deployment environments.
 - **Docker-Compose and Install Script Improvements**: Updated `docker-compose` configurations and `install.sh` script for better setup experience and development workflow. Includes more specific version locking for reliability and easier automation.
 - **Permission System**: Implemented a fine-grained permission system.
 - **README and Usage Examples**: Updated documentation to enhance clarity and user guidance.
 - **Secret Management Overhaul**: Redesigned secret management using a factory/provider pattern for Google Secrets and local `.env` configurations.
 - **Storage Backend Overhaul**: Redesigned file storage using a factory/provider pattern for GCS or to simply store on local disk and share a volume between webapp & vector-db-proxy.
 - **MongoDB Model Enhancements**: Added filename support for MongoDB models and optimized queries.
 - **Vector Database Proxy Updates**: Updated Vector DB Proxy for better structure and maintainability, including production build optimizations.
 - **Local Storage and Thread Utilization**: Enhanced local storage handling and introduced thread utilization control.
 - **Code Quality and Dependency Management**: Addressed ESLint warnings, updated configurations, and removed unused dependencies.
 - **Frontend Updates**: Enabled avatars for apps and agents, added markdown preview for app descriptions, and improved UI components.
 - **Stripe Subscription and Billing**: Implemented Stripe functionalities for plan management and addon cross-selling.

---

Legacy changelog:

### 1.0.0
 - TODO

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
