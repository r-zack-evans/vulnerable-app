# ProjectTrack Enterprise

This is an enterprise project management application for tracking tasks, projects, and deadlines. The application helps teams collaborate effectively and manage resources efficiently. Please note that this application contains intentional security vulnerabilities for educational purposes and should **NEVER** be deployed in a production environment or on a public server.

## Purpose

This application provides powerful project management capabilities for enterprise teams. While offering robust functionality, it also serves as an educational tool to demonstrate common security vulnerabilities in web applications. It contains intentional implementations of the OWASP Top 10 vulnerabilities and other common security issues.

## Vulnerabilities Included

This application intentionally includes the following vulnerabilities:

1. **SQL Injection**: Unsanitized user inputs used in SQL queries
2. **Cross-Site Scripting (XSS)**: Both reflected and stored XSS vulnerabilities
3. **Broken Authentication**: Weak password storage, insecure session management
4. **Sensitive Data Exposure**: Plaintext storage of sensitive information
5. **Broken Access Control**: IDOR vulnerabilities, missing authorization checks
6. **Security Misconfiguration**: Insecure default settings, verbose error messages
7. **Cross-Site Request Forgery (CSRF)**: Missing CSRF tokens
8. **Insecure Deserialization**: Unsafe handling of serialized data
9. **Using Components with Known Vulnerabilities**: Intentionally using vulnerable dependencies
10. **Insufficient Logging & Monitoring**: Lack of audit trails and logging
11. **File Upload Vulnerabilities**: Missing file type validation and path traversal issues
12. **Command Injection**: Unsanitized user input passed to system commands

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd vulnerable-app
   npm install
   ```

3. Build the application:
   ```
   npm run build
   ```

4. Start the server:
   ```
   npm start
   ```

   Or for development mode:
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

## Warning

**This application contains serious security vulnerabilities** and should only be used for educational purposes in a controlled environment. DO NOT:

- Deploy this application on a public network
- Use real personal data with this application
- Use production credentials or API keys with this application
- Connect this application to any production database or service

## Key Features

1. **Project Management** - Create, track, and manage enterprise projects
2. **Task Tracking** - Organize tasks with priorities, assignments, and deadlines
3. **Team Collaboration** - Assign team members to projects and tasks
4. **Progress Monitoring** - Track project completion status in real-time
5. **Resource Allocation** - Manage team resources and availability
6. **Reporting Tools** - Generate insightful reports on project performance
7. **Client Management** - Track client information and project stakeholders

## Security Exercise Ideas

1. Identify all instances of SQL injection and propose fixes
2. Find and remediate all XSS vulnerabilities
3. Implement proper authentication with password hashing
4. Add CSRF protection to all forms
5. Implement proper input validation and sanitization
6. Add proper access controls to admin functions
7. Secure the file upload functionality
8. Implement secure session management
9. Add input validation to prevent command injection

## License

This project is licensed for educational use only.