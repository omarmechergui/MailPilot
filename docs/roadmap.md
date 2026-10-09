# MailPilot — Development Roadmap

## 1. Purpose

This roadmap defines the implementation phases for MailPilot.

Development must proceed incrementally. Each phase must be implemented, tested, reviewed, and approved before moving to the next phase.

The roadmap follows these principles:

- Implement only approved requirements.
- Prefer small, verifiable changes.
- Use pnpm exclusively for package management.
- Use JavaScript and JSX, not TypeScript.
- Keep frontend and backend responsibilities separate.
- Prioritize security and data integrity.
- Never send real emails during development tests.
- Document limitations and unfinished work honestly.

## 2. Project Constraints

The following decisions apply to every phase:

- Frontend: Next.js App Router, React, JavaScript/JSX, Tailwind CSS.
- Backend: Node.js, Express, JavaScript.
- Database: MongoDB Atlas with Prisma ORM.
- Email: Nodemailer, React Email, and Mailpit for local testing.
- Validation: Zod.
- Package manager: pnpm only.
- Authentication: one administrator, Argon2id, JWT in an HttpOnly cookie.
- Interface: English, modern SaaS, light theme only.
- No public registration.
- No Mongoose.
- No Redis or BullMQ in Phase 1.
- No campaign scheduling in Phase 1.
- No automatic scheduled backups in Phase 1.

Do not change the approved stack without documenting the reason and obtaining approval.

---

## 3. Phase 0 — Requirements and Project Foundation

### Objectives

Establish a clear project specification and prepare the repository before implementing application features.

### Tasks

- Review `AGENTS.md`.
- Review all applicable `.agents/rules/` files.
- Review the approved `.agents/skills/`.
- Review `docs/requirements.md`.
- Review `docs/technical-specification.md`.
- Review `docs/database-design.md`.
- Review `docs/api-design.md`.
- Review this roadmap.
- Inspect the actual project directory and existing files.
- Verify Node.js and pnpm.
- Verify access to the existing MongoDB Atlas cluster.
- Confirm the development environment and environment variable strategy.
- Establish `.gitignore` and sanitized `.env.example` files.
- Decide how Mailpit will run locally without making Docker mandatory.
- Verify the actual conventions supported by the selected coding agent.

### Acceptance Criteria

- Documentation is consistent.
- The actual repository structure is understood.
- No secrets are committed.
- pnpm is the only package manager used.
- Required environment variables are documented.
- The development workflow is reproducible.

### Gate

Do not begin feature implementation until the project foundation and repository structure have been reviewed.

---

## 4. Phase 1 — Application Skeleton and Database Connectivity

### Objectives

Create a working frontend and backend with a verified database connection.

### Tasks

- Initialize the Next.js frontend if it does not already exist.
- Initialize the Express backend if it does not already exist.
- Configure JavaScript and JSX.
- Configure Tailwind CSS.
- Configure frontend and backend scripts using pnpm.
- Add centralized environment configuration.
- Configure Express middleware and error handling.
- Add a minimal health endpoint.
- Configure Prisma for MongoDB Atlas.
- Verify database connectivity using the installed Prisma version.
- Implement a minimal, verified database access test.
- Add basic unit and API test infrastructure.
- Document how to run both applications locally.

### Acceptance Criteria

- Frontend starts successfully.
- Backend starts successfully.
- The health endpoint behaves as documented.
- Prisma can communicate with the intended MongoDB database.
- Database errors are handled safely.
- Automated tests run using pnpm.
- No production secrets appear in the repository or logs.

### Gate

Do not implement authentication until the application skeleton and database connection are verified.

---

## 5. Phase 2 — Secure Administrator Authentication

### Objectives

Implement the single-administrator authentication workflow.

### Tasks

- Design and implement the administrator model.
- Create a controlled administrator initialization process.
- Hash passwords with Argon2id.
- Implement email-or-username login.
- Implement JWT authentication using an HttpOnly cookie.
- Configure cookie options, CORS, and CSRF protection as appropriate.
- Add login rate limiting.
- Implement current-administrator retrieval.
- Implement logout.
- Add protected backend middleware.
- Implement password change if included in the approved requirements.
- Build the login page.
- Add authentication-aware frontend navigation.
- Test authentication failures and unauthorized requests.

### Acceptance Criteria

- Public registration does not exist.
- The initial administrator is created safely.
- Login works with either email or username.
- Passwords are never stored in plaintext.
- JWTs are not exposed to frontend JavaScript.
- Protected API endpoints reject unauthenticated requests.
- Logout clears authentication state correctly.
- Rate limiting and relevant security tests pass.

### Gate

Do not proceed until authentication, authorization, and session security have passed review.

---

## 6. Phase 3 — Contact Management

### Objectives

Implement contact creation, listing, filtering, and lifecycle management.

### Tasks

- Implement the contact database model.
- Define email normalization and duplicate policies.
- Implement contact creation.
- Implement contact listing and pagination.
- Implement search by name and email.
- Implement contact updates.
- Implement archive and restore.
- Implement soft deletion.
- Implement subscription state management.
- Enforce contact eligibility rules in backend services.
- Build the Contacts interface.
- Add loading, empty, error, and success states.
- Add unit and API tests.

### Acceptance Criteria

- Contacts can be created and updated.
- Duplicate email handling is consistent.
- Search and filters behave correctly.
- Pagination works on the server.
- Archived and deleted contacts are excluded from campaign eligibility.
- Unsubscribed and blocked contacts cannot receive campaigns.
- Historical campaign references will not depend on a contact remaining active.
- All relevant tests pass.

### Gate

Do not implement campaign sending until contact eligibility rules are reliable and tested.

---

## 7. Phase 4 — CSV Import and Export

### Objectives

Enable safe bulk contact management.

### Tasks

- Define supported CSV headers.
- Implement CSV parsing and upload validation.
- Apply file-size and row-count limits.
- Normalize and validate email addresses.
- Detect duplicates within imported files.
- Detect conflicts with existing contacts.
- Define and implement import behavior for archived or soft-deleted contacts.
- Produce a detailed import report.
- Implement contact CSV export.
- Protect exports against spreadsheet formula injection.
- Build import preview and result interfaces.
- Add tests for malformed files and invalid rows.

### Acceptance Criteria

- Valid rows are imported according to the approved policy.
- Invalid and duplicate rows are reported.
- Existing data is not silently overwritten.
- Import results contain accurate counts.
- Export files use safe CSV formatting.
- Upload limits are enforced.
- All relevant tests pass.

### Gate

Do not proceed until imports are repeatable, predictable, and safe.

---

## 8. Phase 5 — Email Infrastructure and Template Rendering

### Objectives

Build and verify email generation and SMTP transport independently of full campaign execution.

### Tasks

- Configure Mailpit for local SMTP testing.
- Implement centralized SMTP configuration.
- Validate required environment variables.
- Implement the email transport service using Nodemailer.
- Implement reusable email templates using React Email.
- Generate HTML and plain-text output.
- Implement supported personalization placeholders.
- Define safe handling for missing personalization values.
- Implement preview rendering.
- Implement a controlled test-send operation.
- Add SMTP failure classification.
- Add tests using Mailpit or a mock transport.

### Acceptance Criteria

- Mailpit receives local test messages.
- Templates render valid HTML and plain text.
- Personalization behaves predictably.
- Missing values do not break rendering.
- SMTP credentials remain server-side.
- SMTP errors are handled and sanitized.
- Automated tests never send to real recipients.
- Test-send does not start an actual campaign.

### Gate

Do not enable actual campaign sending until the email transport and rendering tests pass.

---

## 9. Phase 6 — Campaign Management

### Objectives

Implement campaign drafting, editing, previewing, and recipient preparation.

### Tasks

- Implement the campaign database model.
- Define valid campaign states and transitions.
- Implement campaign creation.
- Implement campaign listing and filtering.
- Implement campaign details and editing.
- Implement HTML and plain-text preview.
- Support approved content editor and React Email template workflows.
- Implement recipient eligibility checks.
- Define the campaign recipient snapshot.
- Implement explicit send confirmation.
- Build the campaign interface.
- Add tests for invalid transitions and invalid campaign content.

### Acceptance Criteria

- Campaigns can be saved as drafts.
- Drafts can be edited according to lifecycle rules.
- Preview does not send email.
- Eligible recipients are selected using backend rules.
- Recipient snapshots preserve historical information.
- Invalid campaigns cannot start sending.
- Repeated send requests cannot create duplicate campaign executions.

### Gate

Do not proceed until campaign preparation and recipient selection are reliable.

---

## 10. Phase 7 — Sequential Campaign Execution

### Objectives

Implement controlled campaign sending and durable recipient-level tracking.

### Tasks

- Implement campaign execution orchestration.
- Persist recipient records before or as required by the execution protocol.
- Implement sequential sending.
- Persist recipient statuses and attempt counts.
- Classify SMTP acceptance and delivery failures.
- Implement a bounded retry policy.
- Handle ambiguous SMTP submission outcomes.
- Prevent duplicate concurrent execution.
- Define interrupted-process behavior.
- Implement safe recovery or explicit administrator review for interrupted campaigns.
- Update campaign summary counters consistently.
- Implement campaign status and recipient-log endpoints.
- Test process interruption and recovery behavior.

### Acceptance Criteria

- Eligible recipients are processed sequentially.
- Each recipient has an auditable status.
- SMTP acceptance is not presented as confirmed mailbox delivery.
- Retry limits are enforced.
- Ambiguous outcomes are not blindly retried.
- Repeated requests do not start duplicate sends.
- Process interruptions do not silently lose recipient state.
- Failed recipients are visible in reports.
- Tests verify both successful and failed sending paths.

### Gate

Campaign sending must pass a security and reliability review before it is used with real recipients.

---

## 11. Phase 8 — Unsubscribe and Campaign Reports

### Objectives

Complete subscription enforcement and provide meaningful campaign history.

### Tasks

- Implement a secure unsubscribe token mechanism.
- Implement the documented unsubscribe workflow.
- Ensure unsubscribed contacts are excluded from future sends.
- Implement campaign recipient history.
- Implement campaign summary reporting.
- Implement recipient-status filtering.
- Implement campaign report CSV export.
- Protect report exports against formula injection.
- Implement campaign archival.
- Preserve historical recipient information.
- Test unsubscribe and reporting behavior.

### Acceptance Criteria

- Unsubscribe actions are authenticated by a safe token or equivalent mechanism.
- An email address alone cannot authorize unsubscribe changes.
- Unsubscribed contacts are excluded from future campaigns.
- Archived campaigns retain their history.
- Reports distinguish acceptance, failure, skipped recipients, and ambiguous outcomes.
- Historical data remains meaningful after contact updates.
- Tests pass.

### Gate

Do not declare campaign functionality complete until unsubscribe enforcement and recipient history are verified.

---

## 12. Phase 9 — Dashboard, Operational Settings, and Backup

### Objectives

Complete the administrative dashboard and essential operational features.

### Tasks

- Implement dashboard summary metrics.
- Implement campaign activity summaries.
- Implement non-secret SMTP configuration status.
- Implement SMTP connection testing.
- Implement manual database backup.
- Document backup storage and access controls.
- Implement protected backup status and download workflows as appropriate.
- Document and test database restoration in a safe environment.
- Add operational error states.
- Add audit records for sensitive operations where required.

### Acceptance Criteria

- Dashboard metrics use consistent definitions.
- SMTP status does not expose credentials.
- Backup creates a recoverable database artifact.
- Backup files are protected.
- Restoration is documented and verified in a safe test environment.
- Sensitive operations are access-controlled.
- Errors are visible without exposing secrets.

### Gate

Do not declare the administrative tool production-ready without a verified recovery procedure.

---

## 13. Phase 10 — UI Polish, Integration, and End-to-End Testing

### Objectives

Validate the complete application and improve usability.

### Tasks

- Review responsive layouts.
- Verify the light theme and English interface.
- Review accessibility and keyboard navigation.
- Check all loading, empty, error, and success states.
- Verify frontend/backend integration.
- Run unit tests.
- Run API tests.
- Run relevant component tests.
- Run selected end-to-end tests.
- Test Mailpit integration.
- Check authentication and authorization boundaries.
- Review CSV import/export safety.
- Review campaign duplicate-execution protection.
- Review secret handling and logging.
- Fix verified defects.
- Update documentation.

### Acceptance Criteria

- Critical user journeys work end-to-end.
- No known critical security defects remain.
- Required automated tests pass.
- Blocked and untested cases are documented.
- UI behavior is consistent across key pages.
- No real email recipients are used in automated tests.
- The setup instructions are reproducible.

### Gate

The application cannot be declared ready based on visual inspection alone. Functional, security, and data-integrity checks are required.

---

## 14. Phase 11 — Production Preparation

### Objectives

Prepare the application for a controlled production deployment.

This phase starts only after the administrator approves the deployment scope.

### Tasks

- Select a production hosting strategy.
- Acquire and configure a sending domain if required.
- Select a production SMTP provider.
- Configure SPF, DKIM, and DMARC according to the chosen provider and domain.
- Configure HTTPS and secure cookies.
- Set production CORS origins.
- Review environment variables and secret storage.
- Verify database access restrictions.
- Establish a backup and recovery procedure.
- Configure safe operational logging.
- Verify unsubscribe and suppression behavior.
- Review provider sending limits and recipient consent requirements.
- Perform a controlled production smoke test.

### Acceptance Criteria

- Production secrets are securely configured.
- HTTPS and cookie settings are correct.
- Sending-domain authentication is configured where applicable.
- The SMTP provider is tested.
- Backup restoration has been verified.
- The deployment has passed a controlled smoke test.
- No real bulk send occurs without explicit administrator approval.

---

## 15. Out of Scope for Phase 1

The following are not part of the initial implementation unless separately approved:

- Redis.
- BullMQ.
- Scheduled campaign sending.
- Automatic scheduled backups.
- Multiple administrator accounts.
- Public user registration.
- Advanced open-rate and click tracking.
- Provider-dependent bounce processing without an appropriate integration.
- Complex drag-and-drop email design.
- Multi-tenant organizations.
- Billing and subscriptions.
- Unnecessary microservices.
- Unapproved technology substitutions.

---

## 16. Definition of Done for Every Phase

A phase is complete only when:

1. Its approved tasks are implemented.
2. Acceptance criteria are verified.
3. Relevant automated tests are executed.
4. Security and data integrity are reviewed.
5. Known limitations are documented.
6. Documentation reflects the actual implementation.
7. No unrelated changes have been introduced.
8. The completion report distinguishes verified behavior from assumptions.
9. Blocking issues are resolved or explicitly approved for deferral.
10. The phase gate result is recorded.

### Allowed Gate Results

- `PASS`: All mandatory criteria are satisfied.
- `PASS WITH APPROVED DEFERRALS`: Remaining non-blocking items have explicit approval.
- `FAIL`: One or more mandatory criteria are not satisfied.
- `BLOCKED`: Required access, configuration, or external dependency is unavailable.

Do not start the next phase when the current phase has a `FAIL` or `BLOCKED` result without an explicit decision on how to proceed.

---

## 17. Implementation Reporting

At the end of every phase, report:

- Phase name.
- Files created or modified.
- Features implemented.
- Commands executed.
- Tests executed and their actual results.
- Security checks completed.
- Known issues.
- Deferred items.
- Manual setup still required.
- Gate result.
- Recommended next action.

Never report a test as passed unless it was actually executed and passed.
