# ProjectTrack Enterprise

This is an enterprise project management application for tracking tasks, projects, and deadlines. The application helps teams collaborate effectively and manage resources efficiently. Please note that this application contains intentional security vulnerabilities for educational purposes and should **NEVER** be deployed in a production environment or on a public server.

## Purpose

This application provides powerful project management capabilities for enterprise teams. While offering robust functionality, it also serves as an educational tool to demonstrate common security vulnerabilities in web applications. It contains intentional implementations of the OWASP Top 10 vulnerabilities and other common security issues.

## Vulnerabilities Included

This application intentionally includes the following vulnerabilities:

1. **SQL Injection**: Unsanitized user inputs in `product.routes.ts` and `api.routes.ts` where SQL queries use template literals with user input
2. **Cross-Site Scripting (XSS)**: Multiple components use `v-html` to render unsanitized user input (e.g., in `ProjectDetailView.vue` and `TasksView.vue`)
3. **Broken Authentication**: Both plaintext password storage and weak hashing in the user management system
4. **Sensitive Data Exposure**: User API endpoints expose sensitive data including password hashes and unredacted information
5. **Broken Access Control**: IDOR vulnerabilities in API routes where user IDs aren't properly validated against the authenticated user
6. **Security Misconfiguration**: Hardcoded credentials in `admin.routes.ts` and verbose error messages throughout the application
7. **Cross-Site Request Forgery (CSRF)**: Missing CSRF tokens in forms and API endpoints
8. **Command Injection**: Admin routes include a dangerous `/execute` endpoint using `child_process.execSync` with unsanitized input
9. **File Upload Vulnerabilities**: Multer configured without file type validation in `api.routes.ts` and `user.routes.ts`
10. **Insecure Direct Object References**: Routes like `/projects/:id` and `/tasks/:id` don't properly check ownership
11. **Insufficient Access Controls**: Many admin functions can be accessed without proper authorization checks
12. **Excessive Data Exposure**: API endpoints return complete objects with sensitive information

## Quick Start

### Using Docker (Recommended)

```bash
# Start the application with Docker Compose
docker-compose up

# Access the application at http://localhost:3001
```

### Manual Setup

#### Prerequisites

- Node.js (v18 or later)
- npm

#### Installation

```bash
# Install dependencies
npm ci

# Setup database, run migrations and seed data
npm run db:setup

# Build the application
npm run build

# Start the server
npm start

# OR for development with hot-reload:
npm run dev
```

Access the application at `http://localhost:3001`

## Development Commands

```bash
# Run database initialization, migrations and seeding
npm run db:setup

# Run with minimal data set
SEED_PROFILE=minimal npm run seed

# Run with full data set
SEED_PROFILE=full npm run seed

# Run tests
npm test

# Run end-to-end tests
npm run test:e2e
```

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

## Demo Scenarios

The following scenarios demonstrate how Amp can implement UI enhancements:

### Scenario 1: Improving Project Detail View Layout

**User Scenario:** Needs to improve the project detail view layout using Tailwind CSS. The current layout is cluttered and hard to grasp the most important information at first glance.

**Series of expected actions:**
1. Analyze the current ProjectDetailView component structure
2. Implement a streamlined header layout:
   - Align project title and action buttons in one row
   - Create visual hierarchy for quick project identification
3. Reorganize metadata presentation:
   - Display project owner, team members, and status in a grid layout
   - Segment information into distinct visual sections
   - Ensure critical information is visible without scrolling
4. Enhance timeline visibility:
   - Relocate timeline for better context with related information
   - Improve visualization of project milestones
   - Connect project metadata with timeline progression

**Business Value:** The agentic coding assistant drastically reduces development time by autonomously analyzing Vue component structures, identifying component relationships, and implementing Tailwind CSS patterns consistently across the application. It can trace data flow through the component hierarchy to ensure that state changes are properly reflected in the UI, eliminating hours of manual debugging and refactoring work that would typically be required for layout restructuring.

### Scenario 2: Implementing Pagination for List Views

**User scenario:** "Can you add pagination to our Projects and Tasks list views? We need to handle large datasets more efficiently."

**Series of expected actions:**
1. Examine the current list view implementations
2. Implement efficient large dataset navigation:
   - Create paginated interfaces for Projects and Tasks views
   - Add Previous/Next buttons and page number indicators
   - Ensure performance optimization for large data sets
3. Add customizable display density features:
   - Develop a records-per-page selector with options for 5, 10, or 20 items
   - Implement user preference storage between sessions
   - Ensure responsive design for different screen sizes

**Business Value:** The agentic assistant intelligently integrates pagination without disrupting existing functionality by analyzing API endpoints and data structures. It self-corrects implementation details when encountering edge cases in data handling, automatically recognizes state management patterns in the codebase, and generates proper TypeScript interfaces for new components. This eliminates multiple feedback cycles that would typically be required when implementing complex UI features, saving days of development and QA time.

### Scenario 3: Implementing API Service Tests

**User scenario:** "We need to create tests for our API services that verify both admin and non-admin functionality. Can you help implement these tests?"

**Series of expected actions:**
1. Analyze the current API service structure and authentication mechanisms
2. Identify endpoints with different permissions (admin vs non-admin)
3. Create test fixtures and mocks:
   - Generate test data for admin and regular users
   - Mock authentication tokens and sessions
   - Set up test database state
4. Implement comprehensive test suites:
   - Test authorization boundaries between admin and regular users
   - Verify proper error handling for unauthorized requests
   - Validate expected data structures in responses
5. Create test documentation that explains the testing approach

**Business Value:** The agentic coding assistant can traverse the codebase to map relationships between controllers, services, and middleware to create a comprehensive testing strategy. It automatically identifies security boundaries and permission checks, ensuring test coverage for critical authorization paths. When test failures occur, it can diagnose root causes by connecting error symptoms to underlying implementation details, reducing the debugging cycle significantly compared to manual troubleshooting.

### Scenario 4: Setting Up CI/CD and Automated PR Creation

**User scenario:** "We need to set up CI/CD with GitHub Actions for building and testing our app, and also create a workflow that uses the GitHub CLI to create PRs automatically."

**Series of expected actions:**
1. Analyze the project structure and build requirements
2. Create GitHub Actions workflow files:
   - Set up Node.js environment with proper caching
   - Configure build steps for the application
   - Implement test runs with proper reporting
   - Add vulnerability scanning for dependencies
3. Develop GitHub CLI automation script:
   - Create logic to determine when to create PRs
   - Generate meaningful PR descriptions based on changes
   - Set up proper branching strategy
   - Configure PR templates and labels
4. Implement end-to-end testing in the workflow
5. Create documentation for maintaining and extending the CI/CD pipeline

**Business Value:** The agentic coding assistant can examine the entire repository structure to identify the most appropriate CI/CD configuration, eliminating trial-and-error cycles. It understands build dependencies and test requirements without manual explanation, and can adapt workflows to accommodate project-specific needs. The assistant can generate complex GitHub Actions YAML with proper syntax on the first try and create GitHub CLI scripts that follow best practices, dramatically reducing the time typically spent debugging CI/CD configurations and eliminating the expertise gap for teams new to automated workflows.

## License

This project is licensed for educational use only.