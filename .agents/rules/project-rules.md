---
trigger: always_on
---

# MailPilot — Project Rules

## 1. Project Identity

- Project name: MailPilot.
- Application type: Single-admin bulk email management platform.
- Interface language: English only.
- Design style: Modern SaaS.
- Theme: Light Mode only.
- Initial capacity target: Approximately 100 contacts.
- Development priority: Security, correctness, simplicity, and maintainability.

## 2. Fixed Technology Decisions

### Frontend
- Next.js App Router.
- React.
- JavaScript and JSX.
- Tailwind CSS.
- Do not introduce TypeScript.
- Use reusable UI components and consistent layouts.

### Backend
- Node.js and Express.js.
- JavaScript.
- Keep routes, controllers, services, middleware, and validation schemas logically separated.

### Database
- MongoDB Atlas.
- Prisma ORM.
- Do not replace Prisma with Mongoose.
- Do not assume MongoDB supports relational database features identically.
- Review Prisma's MongoDB limitations before implementing relations, transactions, or migrations.
- Never reset or overwrite an existing database without explicit authorization.

### Email
- Nodemailer for SMTP.
- React Email for reusable email templates.
- Mailpit for local development and test email capture.

### Supporting Libraries
- Zod for input validation.
- Argon2id for password hashing.
- JWT for authentication.
- A suitable Express rate-limiting middleware for authentication protection.

## 3. Infrastructure Scope

### Phase 1
- Use the existing MongoDB Atlas account and cluster.
- Prefer a separate database for MailPilot within the existing cluster.
- Use local Mailpit for email testing.
- Keep SMTP configuration in backend environment variables.
- Do not require a purchased domain during local development.
- Do not introduce Redis or BullMQ.
- Do not require Docker for the initial development workflow.

### Future Phase
Redis and BullMQ may be considered when reliable background queues, larger sending volumes, or persistent job processing become necessary.

The initial architecture must isolate email delivery logic so queue integration can be added later without rewriting the entire application.

## 4. Authentication and Administration

- There is exactly one administrator account in Phase 1.
- There is no public registration.
- Login accepts either the administrator's email or username in one identifier field.
- Passwords must be hashed using Argon2id.
- Use an HttpOnly authentication cookie.
- Configure Secure, SameSite, expiration, and CSRF protections appropriately for the deployment environment.
- Verify JWTs on protected backend requests.
- Apply login rate limiting.
- Do not hardcode administrator credentials.
- Provide a safe initial administrator setup process.
- Do not expose secrets in API responses or logs.

## 5. Contacts

- Support manual contact creation.
- Support CSV import.
- Validate email syntax and required fields.
- Normalize email addresses consistently.
- Detect duplicates within imports and against existing contacts.
- Return an import summary containing accepted, duplicate, invalid, and rejected rows.
- Support contact search by name and email.
- Support filters for subscription and active/archive status.
- Use pagination, with 20 records per page by default.
- Soft-deleted contacts must not be eligible for new campaigns.
- Unsubscribed contacts must never receive campaign emails.
- Keep historical campaign records intact when contacts are archived.

## 6. Campaigns

- Support draft creation and editing.
- Support a simple subject-and-message editor.
- Support reusable React Email templates.
- Support preview before sending.
- Support personalization placeholders such as `{{name}}`.
- Generate HTML and plain-text email versions.
- Support test sending through Mailpit during development.
- Target all eligible active contacts in Phase 1.
- Do not introduce contact segmentation in Phase 1.
- Require a clear confirmation step before sending.
- Support immediate sending only; scheduling is out of scope.
- Support campaign archiving without deleting campaign history or logs.
- Prevent duplicate or concurrent execution of the same campaign.

## 7. Email Delivery

- Process recipients sequentially in Phase 1.
- Use bounded retries for retryable failures only.
- Use a documented maximum attempt count.
- Do not retry indefinitely.
- Do not blindly retry when it is unclear whether SMTP already accepted the message.
- Record each attempt, its timestamp, and its outcome.
- Record safe diagnostic details for failures without leaking credentials or sensitive data.
- Continue processing eligible recipients after a recipient-specific failure when safe.
- Distinguish attempted, SMTP-accepted, failed, bounced, delivered, opened, and clicked states where applicable.
- Never report SMTP acceptance as confirmed inbox delivery.

## 8. Analytics and History

- Preserve campaign history and sending logs until the administrator explicitly deletes them.
- Record campaign metadata, recipient outcomes, attempts, timestamps, and relevant error information.
- Provide basic campaign statistics.
- Provide open, click, bounce, and unsubscribe metrics only when reliable tracking or provider evidence exists.
- Document the limitations of open tracking, including privacy-related inaccuracies.
- Do not fabricate delivery or engagement statistics.

## 9. Import, Export, and Backup

### CSV Import
- Validate the file type, size, headers, and row contents.
- Handle malformed rows safely.
- Provide an understandable import summary.

### CSV Export
- Support contact export.
- Support campaign report export.
- Exclude secrets and internal-only credentials.
- Apply eligibility and privacy rules consistently.
- Protect exported data from CSV formula injection.

### Manual Backup
- Allow the administrator to initiate a database backup.
- Define clearly what data the backup contains.
- Prefer a recoverable backup format over treating CSV exports as a complete backup.
- Report success or failure accurately.
- Protect backup files and avoid exposing database credentials.
- Do not implement automated scheduling in Phase 1.

## 10. Interface Rules

- English interface only.
- Modern SaaS design.
- Light Mode only.
- Consistent spacing, typography, forms, tables, dialogs, and status indicators.
- Provide loading, empty, success, and error states.
- Confirm destructive actions.
- Make important sending status and errors easy to understand.
- Avoid unnecessary animations and visual complexity.
- Provide accessible labels, keyboard navigation, and clear focus states.

## 11. Quality and Change Control

- Inspect existing files before making changes.
- Do not overwrite user work without review.
- Avoid unrelated refactoring.
- Avoid adding dependencies without a concrete reason.
- Validate data on the backend even when frontend validation exists.
- Test important success and failure paths.
- Keep documentation aligned with actual behavior.
- Clearly identify assumptions and unresolved decisions.
- Do not claim unimplemented features are complete.

## 12. Definition of Done

A feature is complete only when its acceptance criteria are met, relevant tests have been executed, important error paths are handled, security implications are reviewed, and the actual outcome is documented.