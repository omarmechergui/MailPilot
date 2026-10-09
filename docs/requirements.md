# MailPilot — Product Requirements Document

## 1. Project Overview

**Product name:** MailPilot

**Product type:** Single-administrator bulk email management application.

**Primary goal:** Provide a simple, secure dashboard for managing contacts, importing recipient lists, creating email campaigns, sending test emails, executing campaigns, and reviewing campaign history.

**Development approach:** Local development first, followed by production deployment after security and operational requirements are satisfied.

**Current phase:** Phase 1 — Core Application.

## 2. Product Goals

MailPilot must allow the administrator to:

1. Authenticate securely.
2. Manage email contacts.
3. Import contacts from CSV files.
4. Search, filter, paginate, archive, and export contacts.
5. Create and edit email campaigns.
6. Preview campaign content before sending.
7. Send test emails through Mailpit during development.
8. Send campaigns to eligible recipients after explicit confirmation.
9. Track recipient-level sending outcomes.
10. Review campaign history and export reports.
11. Archive campaigns without losing historical records.
12. Initiate a recoverable database backup manually.

The application must prioritize security, data integrity, predictable behavior, and ease of use.

## 3. Users and Access Control

### 3.1 Administrator

Phase 1 supports one administrator account.

The administrator can access all authorized application features, including contacts, campaigns, reports, and manual backups.

### 3.2 Authentication Requirements

- No public registration.
- Login form contains one identifier field labeled `Email or Username`.
- The administrator can authenticate using either an email address or username.
- Passwords are hashed using Argon2id.
- Authentication uses JWTs stored in HttpOnly cookies.
- Login attempts are rate-limited.
- Invalid credentials produce safe, generic error messages.
- Logout clears the authentication cookie.
- Protected backend endpoints enforce authentication.
- Initial administrator setup must be explicit and safe.
- Initial setup must not unexpectedly overwrite an existing administrator.

### 3.3 Session Security

- Never store authentication JWTs in localStorage or sessionStorage.
- Keep JWT signing secrets in backend environment configuration.
- Configure cookie security attributes appropriately for the deployment environment.
- Implement suitable CSRF protection for cookie-authenticated state-changing requests.
- Configure CORS using explicitly permitted origins.
- Do not expose administrator credentials through API responses or logs.

## 4. Technology Stack

### 4.1 Frontend

- Next.js App Router.
- React.
- JavaScript and JSX only; no TypeScript.
- Tailwind CSS.
- English-language user interface.
- Modern SaaS dashboard design.
- Light Mode only.
- Responsive and accessible layouts.

### 4.2 Backend

- Node.js.
- Express.
- JavaScript.
- Prisma ORM.
- MongoDB Atlas.

### 4.3 Email

- Nodemailer for SMTP communication.
- React Email for email templates.
- Mailpit for local email testing.

### 4.4 Validation and Testing

- Zod for runtime validation.
- Vitest for unit testing where appropriate.
- Supertest for backend API testing where appropriate.
- React Testing Library for frontend component testing.
- Playwright for important end-to-end workflows where appropriate.

### 4.5 Package Management

- Use pnpm as the official package manager.
- Do not use npm, Yarn, or Bun for project dependency management.
- Keep the appropriate pnpm lockfiles in Git.
- Inspect the existing package structure before deciding whether to introduce a pnpm workspace.
- Run scripts from the correct frontend or backend directory.

### 4.6 Infrastructure Scope

- Use the existing MongoDB Atlas account and cluster.
- Prefer a separate MailPilot database rather than sharing application data with unrelated projects.
- Use Mailpit for local email testing.
- Docker is not a Phase 1 prerequisite.
- Redis and BullMQ are excluded from Phase 1.
- Design the email service so a queue can be added later without rewriting campaign business logic.
- A production SMTP provider and sending domain will be configured later.

## 5. Application Interface

### 5.1 Design Requirements

- Modern SaaS dashboard.
- Light Mode only.
- English interface.
- Consistent typography, spacing, forms, tables, and navigation.
- Responsive behavior for desktop, tablet, and mobile.
- Accessible form labels, keyboard interactions, and status messages.
- Clear loading, empty, success, and error states.
- Confirmation dialogs for important or potentially destructive actions.
- Clear campaign sending progress and results.

### 5.2 Main Navigation

The application should provide the following sections:

- Dashboard.
- Contacts.
- Campaigns.
- Reports or campaign history.
- Settings, only for implemented administrative configuration.

Do not expose unsupported or placeholder features as if they were functional.

## 6. Dashboard

The dashboard should summarize the application's operational state using real persisted data.

Relevant information may include:

- Total contacts.
- Eligible active contacts.
- Unsubscribed and archived contact counts.
- Total campaigns.
- Draft campaigns.
- Recently completed campaigns.
- Failed recipient deliveries or sending attempts.

Metrics must be calculated from actual database records.

Do not use fabricated statistics or mock data in production-facing functionality.

## 7. Contact Management

### 7.1 Contact Creation

The administrator can manually create contacts.

Requirements:

- Validate email addresses.
- Detect duplicate email addresses.
- Validate supported contact fields.
- Display clear validation messages.
- Preserve a consistent email normalization strategy.

The contact model should support, at minimum, an email address, optional name, subscription status, archive or active state, and relevant timestamps.

Additional fields must be justified by an actual requirement.

### 7.2 Contact Listing

The Contacts page must support:

- Search by name or email.
- Filtering by subscription status.
- Filtering by active or archived state.
- Pagination.
- A default page size of 20.
- Clear empty states and error handling.

Filtering and pagination must be enforced correctly by the backend.

### 7.3 Contact Lifecycle

- Support soft deletion or archival rather than immediately destroying historical references.
- Preserve relevant campaign history when a contact is archived or removed.
- Archived contacts must be excluded from future campaign recipient selection.
- Unsubscribed contacts must be excluded from future campaign recipient selection.
- Restoring archived contacts may be supported if the implementation includes an explicit, tested restoration flow.

Do not permanently delete historical campaign records when changing contact status.

## 8. CSV Contact Import

The administrator can import contacts using a CSV file.

Requirements:

- Validate file type and content.
- Enforce reasonable file-size and row-count limits.
- Validate email addresses.
- Normalize supported fields consistently.
- Detect duplicates within the file and against existing contacts.
- Handle malformed rows safely.
- Provide a useful import summary.

The import report must distinguish:

- Accepted records.
- Duplicate records.
- Invalid records.
- Rejected records.

Provide row-level feedback when practical.

An import must not silently treat rejected records as successful.

CSV parsing and database writes must handle partial failures predictably.

## 9. CSV Export

Support CSV export for:

- Contacts.
- Campaign reports.

Requirements:

- Restrict exports to the authenticated administrator.
- Export only the fields required by the selected report.
- Prevent CSV formula injection.
- Avoid exposing credentials, tokens, SMTP settings, or unnecessary internal fields.
- Handle large datasets without unnecessary memory consumption.
- Report export failures clearly.

CSV export is not a substitute for a complete database backup.

## 10. Campaign Management

### 10.1 Campaign Lifecycle

Campaigns must support:

- Draft creation.
- Editing drafts.
- Content preview.
- Explicit confirmation before sending.
- Sending progress.
- Final sending status.
- Recipient-level status history.
- Campaign archival.

Campaigns should not be permanently deleted through ordinary archive actions.

Archived campaigns must retain their historical records.

### 10.2 Campaign Content

The administrator can compose a campaign using:

1. A simple subject and message editor.
2. Supported React Email templates.

Requirements:

- Email subject.
- HTML email content.
- Plain-text alternative.
- Preview before sending.
- Personalization placeholders, such as `{{name}}`.
- Safe handling of missing personalization values.
- Safe rendering of untrusted contact data.
- Draft saving.

The implementation must clearly distinguish trusted template markup from untrusted personalization values.

### 10.3 Test Email

- Support test emails during development.
- Use Mailpit for local testing.
- Verify rendered subject, sender, recipient, HTML, and plain-text content.
- Do not send automated test messages to real recipients.
- Keep SMTP credentials exclusively in backend environment configuration.

### 10.4 Campaign Sending

Phase 1 supports immediate sending only.

Campaign scheduling is out of scope.

Before execution:

1. Validate the campaign.
2. Resolve the eligible recipient list.
3. Display the intended campaign and recipient count.
4. Require explicit administrator confirmation.
5. Record the campaign execution state.
6. Prevent duplicate or concurrent execution.
7. Revalidate recipient eligibility immediately before sending.

Eligible recipients must exclude contacts that are unsubscribed, archived, invalid, blocked, or otherwise ineligible.

The backend is responsible for enforcing eligibility.

### 10.5 Sending Strategy

- Send sequentially, one recipient at a time.
- Do not use uncontrolled parallel bulk sending.
- Track recipient-level results.
- Store relevant attempt counts, timestamps, and error details.
- Apply a bounded retry policy for retryable failures.
- Retry automatically only when doing so is safe.
- Do not automatically retry uncertain SMTP outcomes if that could cause duplicate messages.
- Distinguish SMTP acceptance from confirmed inbox delivery.
- Report partial campaign failures accurately.

Because Phase 1 does not include Redis or BullMQ, the implementation must document how in-process campaign execution handles server interruption, restart, and recovery.

Do not claim durable background execution unless it is actually implemented and verified.

## 11. Subscription and Unsubscribe Handling

- Store subscription status explicitly.
- Exclude unsubscribed contacts from campaign execution.
- Enforce the status check in the backend immediately before sending.
- Do not rely on frontend filters to prevent sending.
- Preserve the relevant historical record of previous campaign activity.
- Implement an appropriate unsubscribe mechanism before sending real bulk email.
- Do not mark an unsubscribe request as successful until the status change is persisted.

Any public unsubscribe endpoint must be designed to avoid exposing or modifying unrelated contact records.

## 12. Campaign History and Reporting

Retain campaign history and recipient-level logs until the administrator explicitly deletes records through a supported administrative operation.

Store relevant information, including:

- Campaign identifier and metadata.
- Subject and applicable campaign content reference.
- Execution start and completion timestamps.
- Recipient identity reference.
- Recipient sending status.
- Attempt count.
- Attempt timestamps.
- Relevant SMTP response or error details.
- Archive status.

Avoid unnecessarily duplicating personal data.

### 12.1 Delivery Status Semantics

Statuses must distinguish what the application actually knows.

For example:

- Pending.
- Sending.
- Accepted by SMTP.
- Failed.
- Unknown outcome, where appropriate.

A provider-confirmed delivery status may be recorded when reliable delivery events are available.

Do not label SMTP acceptance as confirmed delivery.

### 12.2 Analytics Limitations

Advanced open tracking, click tracking, bounce analytics, and provider event processing are not required for Phase 1.

Only show these metrics if the required tracking or provider events are actually implemented and verified.

Open rates must be presented with appropriate limitations because email privacy features can make open tracking inaccurate.

## 13. SMTP Configuration

SMTP settings must remain in backend environment variables.

Expected configuration names:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Requirements:

- Validate required settings during startup or before use.
- Fail safely when configuration is missing or invalid.
- Use supported TLS settings appropriately.
- Never expose credentials to the frontend.
- Never commit real credentials to Git.
- Use placeholder values in example environment files.
- Use Mailpit in local development.

The real SMTP provider, sending domain, and production credentials will be selected and configured later.

## 14. Database and Data Integrity

- Use Prisma ORM with MongoDB Atlas.
- Do not introduce Mongoose.
- Respect Prisma's MongoDB connector limitations.
- Keep contact, campaign, and recipient history consistent.
- Define unique constraints and indexes where supported and required.
- Consider existing documents when introducing new fields.
- Do not assume Prisma defaults backfill existing MongoDB documents.
- Validate database changes against development or test data.
- Avoid destructive operations without explicit approval.

## 15. Manual Database Backup

Provide an administrator-initiated database backup.

Requirements:

- The operation must be explicit.
- It must produce a recoverable database backup, not merely a CSV export.
- The procedure must document what data is included.
- Backup files must be protected from public access.
- Credentials and connection strings must not appear in backup logs or public responses.
- Failures must be reported clearly.
- Restoration procedures must be documented.
- Do not claim that a backup is recoverable unless restoration has been verified.

Automatic scheduled backups are out of scope for Phase 1.

## 16. Security and Privacy

- Hash administrator passwords with Argon2id.
- Use JWT authentication through HttpOnly cookies.
- Enforce backend authorization.
- Apply login rate limiting.
- Validate untrusted inputs with Zod.
- Configure CSRF and CORS protections appropriately.
- Keep secrets outside source control.
- Protect CSV import and export.
- Prevent unsafe email personalization.
- Protect against duplicate campaign execution.
- Preserve unsubscribe enforcement.
- Restrict backup access.
- Avoid logging passwords, tokens, cookies, SMTP credentials, or unnecessary personal data.
- Use HTTPS in production.
- Do not expose development services such as Mailpit publicly.

## 17. Error Handling and Observability

- Use consistent API error responses.
- Validate all relevant inputs.
- Return appropriate HTTP status codes.
- Log useful diagnostic context without sensitive values.
- Distinguish validation errors, authorization failures, database errors, and SMTP errors.
- Record campaign and recipient failures accurately.
- Never claim success when an operation failed or its outcome is unknown.
- Provide enough information to investigate failures without exposing internal details.

## 18. Testing and Quality Requirements

- Add tests for important business logic.
- Test authentication and authorization.
- Test contact creation, duplicate detection, search, filtering, and pagination.
- Test CSV import and export.
- Test campaign drafts, previews, confirmation, and execution safety.
- Test recipient eligibility and unsubscribe enforcement.
- Test SMTP behavior with Mailpit.
- Test error handling and retry boundaries.
- Test important frontend workflows.
- Run relevant lint, test, and build commands before declaring a feature complete.
- Record tests that could not run and explain why.
- Never claim a test passed without executing it.

## 19. Phase 1 Exclusions

The following are explicitly out of scope for Phase 1:

- Public user registration.
- Multiple administrators or complex role management.
- Campaign scheduling.
- Redis and BullMQ.
- Automatic scheduled backups.
- Advanced email analytics without reliable event integration.
- Production sending before a provider and domain are configured.
- Mandatory Docker installation.
- Uncontrolled parallel campaign sending.
- Unverified claims of inbox delivery.

Future features must be documented separately rather than silently included in Phase 1.

## 20. Definition of Done

The Phase 1 application is ready for release consideration when:

- Administrator authentication works securely.
- Contact management and CSV import/export work correctly.
- Campaign drafts and previews work.
- Mailpit test delivery is verified.
- Campaign execution enforces eligibility and explicit confirmation.
- Recipient-level history is recorded accurately.
- Archiving preserves required history.
- Manual database backup and restoration are verified.
- Relevant security controls are implemented.
- Required tests and production build checks have passed.
- Known limitations and operational risks are documented.

A successful build alone does not mean the product is complete.

## 21. Requirements Change Policy

- Treat this document as the reference for Phase 1 product behavior.
- Update it when requirements change.
- Document material changes and their consequences.
- Do not silently remove agreed requirements.
- Ask for clarification only when a missing decision materially affects correctness, security, or scope.
- For nonessential decisions, choose a sensible default and document it.