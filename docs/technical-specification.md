# MailPilot — Technical Specification

## 1. Purpose

This document defines the technical architecture, application components, communication patterns, security boundaries, and implementation constraints for MailPilot.

All implementation decisions must comply with this specification and the approved requirements in `docs/requirements.md`.

If a technical detail is not explicitly defined, choose the simplest secure, maintainable solution that fits the existing architecture. Document significant decisions.

---

## 2. Technology Stack

### Frontend

- Next.js App Router
- React
- JavaScript and JSX only
- Tailwind CSS
- Responsive, accessible SaaS interface
- English interface
- Light theme only

### Backend

- Node.js
- Express.js
- JavaScript only
- REST API
- Zod for request validation
- Prisma ORM

### Database

- MongoDB Atlas
- A dedicated MailPilot database within the existing Atlas cluster
- Prisma MongoDB connector
- No Mongoose

### Email

- Nodemailer for SMTP transport
- React Email for reusable email templates
- Mailpit for local email testing
- HTML and plain-text email output

### Package Management

- pnpm exclusively
- No npm, Yarn, or Bun for dependency management
- Keep the relevant `pnpm-lock.yaml` files committed and synchronized

### Testing

- Vitest for unit and integration tests
- Supertest for Express API tests
- React Testing Library for component tests
- Playwright for selected end-to-end tests
- Mailpit for local email verification

Before adding a dependency, inspect the existing package configuration and choose a compatible version.

---

## 3. High-Level Architecture

MailPilot uses a separate frontend and backend.

```text
Browser
   |
   v
Next.js Frontend
   |
   | HTTPS / JSON REST API
   | HttpOnly authentication cookie
   v
Express Backend
   |
   +---- Authentication and Authorization
   |
   +---- Contacts and CSV Import
   |
   +---- Campaign Management
   |
   +---- Campaign Execution Service
   |          |
   |          v
   |      Email Service
   |          |
   |          v
   |       SMTP Server
   |
   +---- Reporting and Export
   |
   +---- Backup and Recovery
   |
   v
Prisma ORM
   |
   v
MongoDB Atlas
```

Mailpit replaces a real external SMTP provider during local development and email tests.

The frontend must never connect directly to MongoDB or contain SMTP credentials.

---

## 4. Repository Structure

Maintain the following target structure. Inspect the actual repository before creating or moving files.

```text
MailPilot/
├── .agents/
│   ├── rules/
│   └── skills/
├── docs/
│   ├── requirements.md
│   ├── technical-specification.md
│   ├── database-design.md
│   ├── api-design.md
│   └── roadmap.md
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── hooks/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── pnpm-lock.yaml
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── jobs/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── package.json
│   └── pnpm-lock.yaml
├── AGENTS.md
├── .gitignore
└── README.md
```

This is a target structure, not permission to reorganize an existing project blindly.

Do not introduce a pnpm workspace unless it is explicitly approved after inspecting the repository. Frontend and backend may maintain separate package configurations.

---

## 5. Frontend Architecture

### 5.1 Responsibilities

The frontend is responsible for:

- Displaying the dashboard and navigation.
- Collecting and validating form input for usability.
- Calling the backend REST API.
- Displaying contacts, campaigns, reports, and import results.
- Providing campaign composition and preview interfaces.
- Showing loading, empty, success, and error states.
- Confirming destructive or consequential actions.
- Displaying authentication and authorization errors appropriately.

The backend remains the authority for validation, authentication, authorization, and business rules.

### 5.2 Suggested Application Routes

```text
/login
/dashboard
/contacts
/contacts/import
/campaigns
/campaigns/new
/campaigns/[id]
/reports
/settings
```

Adjust route names only when there is a clear reason.

Because MailPilot has one administrator and no public registration, do not implement public sign-up pages.

### 5.3 Component Organization

Organize reusable interface elements separately from feature-specific components.

```text
frontend/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── feedback/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── contacts/
│   ├── campaigns/
│   ├── reports/
│   └── settings/
├── lib/
│   ├── api.js
│   └── utils.js
└── tests/
```

Use JavaScript and JSX. Do not introduce TypeScript files.

Avoid unnecessary client-side state libraries until actual complexity justifies them.

### 5.4 API Client

Centralize API communication in a reusable client.

The API client must:

- Use a configurable backend base URL.
- Include credentials when communicating with the API.
- Handle JSON responses consistently.
- Handle non-success HTTP responses.
- Avoid exposing server secrets.
- Avoid storing authentication JWTs in localStorage or sessionStorage.

Authentication must use the configured HttpOnly cookie.

---

## 6. Backend Architecture

### 6.1 Responsibilities

The backend is responsible for:

- Authentication and session security.
- Authorization of protected operations.
- Request validation.
- Contact management and import.
- Campaign creation and execution.
- Email rendering and SMTP delivery.
- Recipient-level status tracking.
- Reporting and CSV export.
- Backup and recovery operations.
- Centralized error handling and operational logging.

### 6.2 Application Layers

Use the following separation:

**Routes**
- Define HTTP endpoints.
- Apply appropriate middleware.
- Connect endpoints to controllers.

**Middleware**
- Authenticate requests.
- Enforce authorization.
- Apply rate limits.
- Validate security-related request conditions.
- Handle cross-origin and CSRF protections where applicable.

**Controllers**
- Translate HTTP requests into service calls.
- Return consistent HTTP responses.
- Avoid embedding complex business logic.

**Services**
- Implement business rules.
- Coordinate database access and other services.
- Keep campaign execution and email delivery separate from HTTP handling.

**Validators**
- Define Zod schemas for request bodies, query parameters, and relevant path parameters.

**Utilities**
- Provide small reusable helpers with clear responsibilities.

**Configuration**
- Load environment variables.
- Validate required configuration during startup.
- Fail safely when mandatory configuration is missing.

Do not place the entire application inside route handlers or a single large controller.

### 6.3 Express Application

Separate application initialization from server startup.

- `app.js` configures Express, middleware, routes, and error handling.
- `server.js` validates runtime configuration and starts the HTTP server.

This separation makes automated testing easier.

---

## 7. Authentication and Security Architecture

### 7.1 Administrator Model

MailPilot has one administrator account.

- No public registration.
- Login accepts an email address or username and a password.
- Passwords are hashed with Argon2id.
- Authentication uses a JWT in an HttpOnly cookie.
- Protected API routes require a valid authenticated administrator.

### 7.2 Initial Administrator

Provide a safe, explicitly controlled initialization process.

- Do not create a default administrator with a known password.
- Do not expose a public administrator-creation endpoint.
- Never reset or replace administrator credentials silently at startup.
- Require validated configuration or an explicit initialization command.
- Prevent unintended creation of additional administrator accounts.

### 7.3 Cookie and Request Security

Configure cookie options according to the deployment environment:

- `HttpOnly: true`
- `Secure: true` in HTTPS production deployments
- An appropriate `SameSite` policy
- A deliberate expiration period
- A narrow cookie path and suitable scope

Configure CORS with explicit trusted origins when cross-origin requests are required.

Use appropriate CSRF protection for cookie-authenticated state-changing operations, especially when the frontend and backend have different origins or the selected cookie policy requires it.

Never assume CORS alone is CSRF protection.

### 7.4 Authorization

Enforce authentication and authorization on the backend.

The frontend hiding a button is not authorization.

Apply authentication checks to all protected endpoints, including exports, campaign sending, settings, and backups.

### 7.5 Rate Limiting

Apply stricter rate limits to login and other abuse-sensitive endpoints.

Avoid exposing detailed information that allows an unauthenticated person to enumerate accounts or infer internal system state.

---

## 8. Database Architecture

### 8.1 Database Access

Use Prisma as the database access layer and MongoDB Atlas as the database.

- Do not use Mongoose.
- Do not introduce a second ORM.
- Do not use raw SQL.
- Use Prisma-supported operations and MongoDB-compatible query patterns.
- Keep database access inside backend services or dedicated data-access modules.

### 8.2 MongoDB and Prisma Constraints

Before designing or changing the schema, verify compatibility with the installed Prisma version and its MongoDB connector.

Pay particular attention to:

- MongoDB ObjectId fields and Prisma ID mappings.
- Required fields and existing document compatibility.
- Embedded documents versus separate collections.
- Unique constraints and indexes.
- Relation emulation and referential integrity.
- MongoDB transaction requirements and deployment support.
- The absence of relational database features that may be assumed by generic ORM examples.

Do not assume that a relational migration, foreign-key constraint, or transaction pattern works identically with MongoDB.

For existing collections, verify real stored documents instead of assuming Prisma defaults have populated them.

### 8.3 Data Model

The detailed data model belongs in `docs/database-design.md`.

At a minimum, evaluate the following entities:

- Administrator
- Contact
- Campaign
- CampaignRecipient
- ApplicationSetting, only if a persistent setting is genuinely required
- AuditEvent, if needed for sensitive administrative actions

Campaign recipient records must preserve the historical relationship between a campaign and each recipient even when the contact is later archived or soft-deleted.

### 8.4 Indexing and Pagination

Define indexes for frequently queried fields and unique business identifiers.

Contact listing must use server-side pagination, with a default page size of 20.

Validate page numbers, page sizes, sorting, and filters. Avoid loading the entire contact collection for routine dashboard operations.

---

## 9. Contact Management Architecture

The Contact Service handles:

- Manual contact creation.
- Contact updates.
- Contact search and filtering.
- CSV import.
- CSV export.
- Archiving and soft deletion.
- Subscription and unsubscribe state.
- Duplicate detection.

### 9.1 Contact Eligibility

A contact can receive a campaign only if the backend confirms that the contact is:

- Active and not archived.
- Valid for email sending.
- Subscribed.
- Not blocked.
- Not otherwise excluded by an applicable suppression rule.

Recheck eligibility immediately before attempting delivery, not only when the campaign is created.

### 9.2 CSV Import

The import pipeline should:

1. Validate file type and size.
2. Parse CSV safely.
3. Validate required headers and row structure.
4. Normalize and validate email addresses.
5. Detect duplicates within the uploaded file.
6. Detect conflicts with existing contacts.
7. Apply explicit import rules.
8. Return a detailed summary.

Report accepted, duplicate, invalid, and rejected rows.

Never silently import invalid addresses or overwrite existing data without an explicit rule.

### 9.3 CSV Export

Escape CSV values correctly and protect spreadsheet users from formula injection.

Apply authentication and authorization before generating an export.

---

## 10. Campaign Architecture

### 10.1 Campaign Lifecycle

Use explicit campaign states, with allowed transitions defined in the business logic.

The initial lifecycle should support concepts equivalent to:

- Draft
- Sending
- Completed
- Completed with failures
- Failed

Additional states such as cancellation or interruption recovery must be implemented only with well-defined behavior.

Do not let arbitrary API requests change a campaign directly into any state.

### 10.2 Campaign Creation

A campaign contains, at minimum:

- Name
- Subject
- Email content or selected template
- Sender configuration reference
- Creation and update timestamps
- Status
- Recipient totals and relevant counters

The campaign recipient snapshot must preserve the intended recipient and delivery history.

Store only the data needed for historical reporting and operational recovery.

### 10.3 Campaign Preview

Before sending, render and preview:

- HTML output
- Plain-text output
- Subject
- Supported personalization values
- A representative recipient preview

Validate or safely handle missing personalization values.

Do not interpret arbitrary template input as executable server-side code.

### 10.4 Send Confirmation

Require an explicit confirmation before starting a campaign.

The backend must independently validate the campaign and its eligible recipients before accepting the send request.

Prevent repeated clicks or duplicate API requests from accidentally starting multiple concurrent executions of the same campaign.

---

## 11. Email Delivery Architecture

### 11.1 Separation of Responsibilities

Use separate services for:

- Template rendering.
- SMTP transport configuration.
- Individual email delivery.
- Campaign orchestration.
- Recipient status tracking.
- Retry decisions.

The Campaign Service must not contain all SMTP implementation details.

The SMTP transport must be replaceable without rewriting campaign business logic.

### 11.2 SMTP Configuration

Read SMTP credentials exclusively from backend environment variables.

Expected configuration includes:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Validate configuration before attempting to send.

Never return SMTP credentials through an API response or expose them to the frontend.

### 11.3 Development with Mailpit

Use Mailpit as the local SMTP destination.

- Use a development-only SMTP configuration.
- Do not use real recipient lists during automated tests.
- Verify message output through Mailpit.
- Never assume a message delivered to Mailpit was delivered to an actual mailbox.

Docker is not a Phase 1 prerequisite. Document a practical installation and configuration method for the development environment in the project setup documentation.

### 11.4 Sequential Sending

Phase 1 sends emails sequentially, one recipient at a time.

For each recipient:

1. Confirm the recipient is eligible.
2. Render personalized HTML and plain-text content.
3. Attempt SMTP submission.
4. Record the attempt and outcome.
5. Apply retry policy where appropriate.
6. Continue to the next recipient according to campaign execution rules.

Do not launch an uncontrolled number of simultaneous SMTP requests.

### 11.5 Retry Policy and Delivery Ambiguity

Automatically retry only when the failure classification supports a retry.

Use a small, documented retry limit.

Distinguish:

- A definite SMTP rejection.
- A temporary SMTP failure.
- A connection failure before submission.
- An ambiguous outcome where the server may have accepted the message but the connection failed before the application received confirmation.
- An SMTP acceptance response.

Do not blindly retry ambiguous submissions, because doing so can produce duplicate emails.

SMTP acceptance is not proof of final mailbox delivery.

### 11.6 Execution Without a Queue

Redis and BullMQ are excluded from Phase 1.

The campaign execution implementation must therefore account for:

- Process restarts.
- Server crashes.
- Interrupted campaigns.
- Duplicate execution prevention.
- Persisted recipient statuses.
- Safe recovery or explicit marking of interrupted campaigns.

Do not claim durable background execution merely because an asynchronous function was started in the backend.

Document the recovery strategy and its limitations before enabling campaign sending.

### 11.7 Unsubscribe

Provide a secure unsubscribe mechanism and enforce the resulting suppression state for future campaigns.

An unsubscribe action must not depend solely on a frontend page or a hidden UI state.

Validate unsubscribe requests safely, avoid exposing unnecessary contact information, and preserve the relevant historical campaign records.

---

## 12. Campaign Logs and Reporting

Maintain recipient-level records with relevant information, including:

- Campaign identifier.
- Recipient identifier or appropriate historical recipient reference.
- Recipient email address at send time.
- Current delivery status.
- Attempt count.
- Attempt timestamps.
- SMTP response classification.
- Sanitized error details.
- Final submission result.

Define statuses precisely. In particular, do not equate `sent` or SMTP acceptance with confirmed mailbox delivery.

Reports should derive totals from consistent stored states and avoid double-counting retries.

Keep campaign history unless the administrator explicitly deletes a campaign according to the documented retention behavior.

Advanced open, click, bounce, and delivery analytics are out of scope unless the necessary tracking or provider event data is available and reliable.

---

## 13. API Architecture

Use a versioned API prefix:

`/api/v1`

Organize endpoints by feature, with consistent request and response formats.

The detailed endpoint definitions belong in `docs/api-design.md`.

The API should cover:

- Authentication
- Dashboard summaries
- Contacts
- CSV import and export
- Campaigns
- Campaign preview
- Campaign send confirmation and execution
- Campaign reports and recipient logs
- Unsubscribe
- Administrative backup and recovery operations

### API Rules

- Validate incoming data with Zod.
- Return appropriate HTTP status codes.
- Use a consistent error response format.
- Do not expose stack traces or secrets in production responses.
- Enforce authentication and authorization server-side.
- Apply pagination to collection endpoints.
- Avoid sending unnecessary database fields to the client.
- Protect expensive operations such as imports, exports, and backups.
- Make campaign-send requests safe against accidental duplicate execution.

---

## 14. Error Handling and Logging

Use centralized Express error handling.

Separate validation errors, authentication failures, authorization failures, missing resources, conflicts, rate limits, external service failures, and unexpected server errors.

Logs must:

- Include useful timestamps and contextual identifiers.
- Avoid passwords, JWTs, session cookies, SMTP credentials, and unnecessary personal data.
- Sanitize external error details.
- Preserve enough diagnostic information to investigate failed campaigns.
- Avoid returning internal stack traces to clients.

Do not silently swallow database, SMTP, or campaign execution failures.

---

## 15. Backup and Recovery

Provide an administrator-initiated database backup workflow.

The implementation must:

- Use a documented, MongoDB-compatible backup method.
- Create a recoverable backup rather than relying only on CSV exports.
- Protect backup files and avoid public exposure.
- Avoid logging credentials or sensitive backup contents.
- Report backup success or failure accurately.
- Include a documented restoration procedure.
- Verify recovery in a safe test environment before considering the feature complete.

Do not implement a custom MongoDB dump format when a reliable supported backup mechanism is available.

Automatic scheduled backups are outside Phase 1.

---

## 16. Environment Configuration

Maintain separate environment files for frontend and backend where appropriate.

Backend configuration may include:

- Database connection string.
- JWT secret.
- Authentication configuration.
- SMTP configuration.
- Frontend origin and CORS configuration.
- Port and environment mode.
- Backup configuration if required.

Frontend public environment variables may contain only values intended to be visible to the browser, such as the API base URL.

Rules:

- Never commit real secrets.
- Keep `.env` files out of Git.
- Provide sanitized `.env.example` files.
- Validate required configuration during startup.
- Never use production credentials in local tests.
- Do not log connection strings or secret values.

---

## 17. Testing Architecture

### Unit Tests

Test individual functions and services, including:

- Contact eligibility.
- Email validation and normalization.
- CSV row classification.
- Campaign state transitions.
- Recipient selection.
- Retry classification.
- Template personalization.
- CSV formula-injection protection.

### API Tests

Test:

- Authentication and protected routes.
- Invalid input.
- Missing or expired authentication.
- Unauthorized requests.
- Pagination and filtering.
- Duplicate contact handling.
- Campaign creation and send confirmation.
- Duplicate send prevention.
- Unsubscribe enforcement.
- Error responses.

### Email Tests

Use Mailpit or a controlled mock transport.

Test:

- HTML and plain-text generation.
- Personalization.
- SMTP acceptance and rejection.
- Temporary and permanent failure classification.
- Retry limits.
- Ambiguous SMTP outcomes.
- Recipient-level status persistence.
- Recovery from interrupted execution.

Automated tests must never send emails to real recipients.

### End-to-End Tests

Test critical user workflows such as administrator login, contact import, campaign creation, preview, test sending, and campaign reporting.

### Test Reporting

Report actual test results.

Distinguish between passed, failed, blocked, and not-tested cases.

Never claim a feature or test works without verification.

---

## 18. Implementation Constraints

The following are mandatory:

- JavaScript and JSX only.
- Next.js App Router for the frontend.
- Express for the backend.
- Prisma for database access.
- MongoDB Atlas as the database.
- Nodemailer for SMTP.
- React Email for reusable templates.
- Zod for validation.
- pnpm exclusively for package management.
- Mailpit for local email testing.
- No Mongoose.
- No public registration.
- No SMTP secrets in the frontend.
- No real recipient sending during development tests.
- No Redis or BullMQ in Phase 1.
- No campaign scheduling in Phase 1.
- No automatic backup scheduling in Phase 1.

Any proposed exception must be explained and approved before implementation.

---

## 19. Definition of Technical Completion

The technical implementation is complete only when:

1. The feature satisfies the approved requirements.
2. The architecture and security rules are respected.
3. Database behavior is verified against the actual MongoDB and Prisma setup.
4. Relevant tests have been executed.
5. Errors and failure states are handled.
6. Secrets and sensitive data are protected.
7. Documentation is updated.
8. No unrelated changes have been introduced.
9. Known limitations are documented.
10. The implementation report accurately states what was changed and what was verified.
