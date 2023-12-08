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
