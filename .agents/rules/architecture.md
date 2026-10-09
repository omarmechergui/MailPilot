---
trigger: always_on
---

# MailPilot — Architecture Rules

## 1. Architectural Principles

MailPilot uses a separated frontend/backend architecture.

- Frontend: Next.js, React, JavaScript, JSX, and Tailwind CSS.
- Backend: Node.js, Express, and JavaScript.
- Database: MongoDB Atlas accessed through Prisma ORM.
- Email delivery: Nodemailer over SMTP.
- Email templates: React Email.
- Validation: Zod.
- Local email testing: Mailpit.

The frontend must not access MongoDB directly or send SMTP messages directly. All protected business operations must pass through the backend API.

Keep business logic independent of HTTP handlers and UI components.

## 2. Top-Level Structure

```text
MailPilot/
├── .agent/
│   ├── rules/
│   └── workflows/
├── docs/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── styles/
│   └── package.json
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
│   │   └── app.js
│   ├── tests/
│   └── package.json
├── AGENTS.md
├── .gitignore
└── README.md
```

This is the target structure, not permission to overwrite an existing project. Inspect the repository before creating or moving files.

## 3. Frontend Responsibilities

The frontend is responsible for:

- Rendering the dashboard and navigation.
- Managing forms and client-side interaction.
- Providing contact management screens.
- Providing CSV import and export interfaces.
- Creating and editing campaigns.
- Previewing email templates.
- Displaying campaign history, analytics, and sending status.
- Showing loading, empty, success, and error states.
- Performing basic client-side validation for usability.

The frontend must not:

- Store SMTP credentials.
- Store administrator passwords.
- Connect directly to MongoDB.
- Decide whether a user is authorized.
- Treat client-side validation as a security boundary.
- Claim that an email was delivered based only on a successful HTTP response.

## 4. Backend Responsibilities

The backend is responsible for:

- Authentication and authorization.
- Validating all incoming requests.
- Enforcing contact eligibility and unsubscribe rules.
- Importing, searching, filtering, and exporting contacts.
- Creating and managing campaigns.
- Rendering email templates safely.
- Sending emails through the email service.
- Managing retry policy and campaign execution state.
- Recording sending attempts and campaign history.
- Providing accurate analytics.
- Initiating and reporting manual backups.
- Returning consistent, safe API responses.

The backend must enforce every security-sensitive rule independently of the frontend.

## 5. Backend Request Flow

Use the following logical request flow:

1. Request reaches an Express route.
2. Authentication middleware verifies the session when required.
3. Authorization middleware checks the permitted action.
4. Zod validates request parameters, query values, and body data.
5. Controller coordinates the request and response.
6. Service executes business logic.
7. Prisma accesses MongoDB when needed.
8. Controller returns a documented response.
9. Centralized error handling converts unexpected errors into safe responses.

Keep controllers thin. Avoid embedding complex database queries, email delivery logic, or business rules directly in route handlers.

## 6. Database Access

- Use a single appropriately configured Prisma client instance in the backend.
- Keep database access in services or dedicated data-access modules.
- Define explicit schemas for persisted entities.
- Review MongoDB and Prisma connector limitations before designing relations.
- Use stable identifiers and appropriate unique constraints where supported.
- Normalize email addresses consistently before duplicate checks.
- Design pagination and indexes based on actual query patterns.
- Avoid fetching all records when a paginated query is appropriate.
- Never expose database credentials to the frontend.

Do not assume relational transactions or migration behavior works identically with MongoDB.

## 7. Authentication Flow

1. The administrator submits an email-or-username identifier and password.
2. The backend validates the request.
3. The backend applies login rate limits.
4. The backend locates the configured administrator account.
5. Argon2id verifies the password hash.
6. The backend issues a signed JWT using a strong secret from environment configuration.
7. The JWT is placed in an appropriately configured HttpOnly cookie.
8. Protected requests validate the token and authorization state.
9. Logout clears the authentication cookie.

Do not store authentication tokens in localStorage.

Configure cookie settings, CSRF defenses, expiration, CORS, and proxy settings according to the deployment environment.

## 8. Email Delivery Architecture

Keep email delivery behind a dedicated service interface.

Suggested logical modules:

- `email.service.js`: sends a single message and normalizes transport results.
- `email-template.service.js`: renders templates and creates HTML/plain-text content.
- `campaign.service.js`: validates and coordinates campaign execution.
- `campaign-attempt.service.js`: records attempt outcomes and retry metadata.

Names may be adapted to the actual project, but responsibilities must remain separated.

The campaign execution flow is:

1. Load the campaign and verify its state.
2. Confirm explicit administrator approval.
3. Select eligible, active, subscribed contacts.
4. Mark the campaign as running using concurrency-safe logic.
5. Process recipients sequentially in Phase 1.
6. Send each message through the email service.
7. Record the attempt result.
8. Apply bounded retries only when the failure is safely retryable.
9. Continue to the next eligible recipient when safe.
10. Update final campaign statistics and status.
11. Make the result available in campaign history.

Prevent the same campaign from executing concurrently.

Do not treat an ambiguous SMTP timeout as proof that the message was not accepted. Avoid blind retries that could create duplicate emails.

## 9. Background Execution

Redis and BullMQ are not required in Phase 1.

The sending process must not depend on a single long-running browser request remaining open. Starting a campaign should create a durable campaign execution record and return an appropriate status. A backend-controlled execution mechanism should continue processing independently of the client connection.

Document the limitation of in-process background execution: a process restart can interrupt work unless execution state and recovery behavior are handled. Do not claim durable queue guarantees without implementing them.

Keep a clear boundary around campaign execution so a persistent queue can be added in a future phase.

## 10. Mailpit and SMTP Configuration

- Store SMTP host, port, username, password, sender address, and related settings in backend environment variables.
- Use Mailpit as the local SMTP sink during development and automated testing.
- Keep local and production SMTP configurations separate.
- Do not send real emails during automated tests.
- Validate required SMTP configuration before sending.
- Never return credentials in API responses.
- Do not expose the Mailpit management interface publicly.

## 11. API Conventions

- Use a consistent `/api` prefix.
- Use resource-oriented endpoints.
- Use appropriate HTTP methods and status codes.
- Validate request bodies, parameters, and query strings.
- Use a consistent response and error format.
- Apply pagination to list endpoints.
- Avoid exposing stack traces or internal exception details in production.
- Document authentication requirements for protected endpoints.
- Prevent CSV exports from becoming an unintended data-exposure endpoint.

The API design document must define the actual endpoints before implementation.

## 12. Logging and Error Handling

- Use centralized error handling.
- Log actionable diagnostic information.
- Do not log passwords, JWTs, SMTP credentials, or full secret-bearing configuration.
- Associate campaign attempts with the relevant campaign and recipient records.
- Distinguish validation failures, authentication failures, provider failures, and unexpected server errors.
- Preserve enough diagnostic detail to investigate failures without exposing sensitive information.
- Ensure a logging failure does not silently cause the application to report a successful email send.

## 13. Future Extensibility

Design clear interfaces for future additions, including:

- Redis and BullMQ.
- Production SMTP provider integration.
- Provider webhooks for bounces and delivery events.
- Open and click tracking.
- Scheduled campaigns.
- Contact segmentation.

These are future capabilities unless explicitly included in the current phase. Do not implement them prematurely.

## 14. Architecture Acceptance Criteria

The architecture is acceptable when:

- Frontend and backend responsibilities are clearly separated.
- The frontend cannot access database or SMTP secrets.
- Authentication and authorization are enforced by the backend.
- Database operations use Prisma.
- Email delivery is isolated behind a service.
- Campaign execution state and attempts are recorded.
- The same campaign cannot be run concurrently.
- Sending can continue without depending on an open browser request.
- The absence of Redis and BullMQ is documented.
- Tests verify important request, security, and email failure paths.