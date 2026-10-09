# MailPilot — AI Agent Instructions

## 1. Project Overview

MailPilot is a single-admin bulk email management application designed to manage contacts, create email campaigns, send emails, and track campaign results.

The initial target is approximately 100 contacts. The application must prioritize security, reliability, maintainability, and a clean user experience.

The application interface must be in English.

## 2. Mandatory Technology Stack

### Frontend
- Next.js with App Router.
- React.
- JavaScript and JSX only.
- Tailwind CSS.
- Modern SaaS design with Light Mode only.

### Backend
- Node.js.
- Express.js.
- JavaScript using ES modules where supported by the project configuration.

### Database
- MongoDB Atlas.
- Prisma ORM.
- Use the Prisma version and MongoDB capabilities compatible with the existing project setup.

### Email
- Nodemailer for SMTP communication.
- React Email for email templates.
- Mailpit for local email testing.

### Validation and Authentication
- Zod for input validation.
- Argon2id for password hashing.
- JWT authentication stored in an HttpOnly cookie.
- No public registration.

## 3. Project Structure

Keep the frontend and backend separated:

- `frontend/`: Next.js application.
- `backend/`: Express API, Prisma configuration, email services, and backend tests.
- `.agents/rules/`: Project rules and engineering standards.
- `.agents/skills/`: Reusable development workflows and skills.
- `docs/`: Requirements, technical specifications, architecture, database design, API design, and roadmap.
- `AGENTS.md`: Root-level agent instructions.

Do not move or rename existing files without a verified need and an explicit plan.

## 4. Core Application Requirements

MailPilot must support:

- A single administrator account.
- Login using either email or username and a password.
- Manual contact creation.
- CSV contact import with validation and an import summary.
- Duplicate email detection.
- Contact search, filtering, and pagination.
- Unsubscribe management and exclusion of unsubscribed contacts from campaigns.
- Simple email composition.
- React Email templates.
- Email preview and test sending through Mailpit.
- Personalization placeholders such as `{{name}}`.
- Campaign drafts, confirmation before sending, and campaign archiving.
- Immediate campaign sending without scheduling in Phase 1.
- Sequential email sending with bounded retries and complete attempt logs.
- Campaign history and detailed delivery-related status tracking.
- CSV exports for contacts and campaign reports.
- Manual database backup initiated by the administrator.
- Basic and advanced analytics where the necessary tracking evidence is available.

## 5. Security Requirements

- Never store plaintext passwords.
- Never commit secrets, credentials, tokens, or `.env` files.
- Validate all untrusted input on the backend.
- Enforce authorization on protected backend routes.
- Apply rate limiting to authentication endpoints.
- Use secure cookie settings appropriate to the environment.
- Protect against cross-site request forgery when required by the authentication and cookie configuration.
- Do not expose SMTP credentials or internal error details to the frontend.
- Do not allow unsubscribed, archived, invalid, or otherwise ineligible contacts to receive campaign emails.
- Require explicit confirmation before starting a campaign.
- Prevent concurrent campaign runs and avoid unsafe automatic retries when SMTP acceptance is uncertain.

## 6. Email Sending Rules

- Use Mailpit for development and automated email tests.
- Never send test campaigns to real recipients.
- Send to eligible recipients sequentially in Phase 1.
- Use a bounded retry policy; do not retry indefinitely.
- Record each sending attempt and its outcome.
- Distinguish SMTP acceptance from confirmed delivery.
- Do not claim that a message reached the inbox without reliable provider evidence.
- Keep sending logic isolated so a queue such as BullMQ can be added in a future phase.

Redis and BullMQ are explicitly out of scope for Phase 1.

## 7. Development Workflow

For every feature:

1. Inspect the existing project and relevant files.
2. Explain the requirement and identify dependencies.
3. Produce a concise implementation plan.
4. Identify files to create or modify.
5. Implement only the approved scope.
6. Run relevant tests and validation checks.
7. Review security, error handling, and regressions.
8. Summarize changes and report actual test results.

Never claim a test passed unless it was executed and its result was verified.

## 8. Error and Bug Investigation

When investigating a bug:

1. Explain what the error means.
2. Identify the evidence and root cause.
3. Point to the affected files and code paths.
4. Present viable fixes and their trade-offs.
5. Select the safest appropriate fix.
6. Implement the fix and run relevant tests.
7. Report remaining risks or unverified behavior.

Do not guess at a root cause when evidence is insufficient.

## 9. Code Quality

- Prefer simple, readable, maintainable implementations.
- Avoid unnecessary dependencies and abstractions.
- Keep business logic separate from HTTP handlers and UI components.
- Use consistent naming and predictable error handling.
- Avoid unrelated refactors.
- Do not silently change established architecture or requirements.
- Never disable tests or weaken validation merely to make a build pass.

## 10. Phase Completion

A phase is complete only when:

- Its acceptance criteria are satisfied.
- Relevant tests have been executed.
- Critical security checks have passed.
- No known blocking errors remain.
- Documentation reflects the implemented behavior.
- Any incomplete work is explicitly reported.

Do not start the next major phase while the current phase has unresolved blocking failures.

## 11. Reporting

At the end of each task, report:

- What changed.
- Files created or modified.
- Commands and tests executed.
- Actual test results.
- Known limitations.
- The next recommended step.

Do not fabricate files, test results, integrations, or capabilities.

## 12. Package Manager Rules

- Use `pnpm` as the official package manager for the entire MailPilot project.
- Use `pnpm install` to install dependencies.
- Use `pnpm add <package>` to add production dependencies.
- Use `pnpm add -D <package>` to add development dependencies.
- Use `pnpm remove <package>` to remove dependencies.
- Use `pnpm run <script>` or `pnpm <script>` to run package scripts.
- Use `pnpm exec <command>` to execute locally installed tools.
- Do not use npm, Yarn, or Bun for project dependency management.
- Do not generate or maintain `package-lock.json`, `yarn.lock`, or `bun.lock` files.
- Commit the appropriate pnpm lockfile to Git.
- Keep dependency versions and lockfile changes consistent.
- Respect the separate `frontend/` and `backend/` package configurations unless a pnpm workspace is explicitly introduced.
- Do not introduce a monorepo workspace configuration without first checking the existing project structure and documenting the decision.
- When a command fails, diagnose the cause before switching package managers.