---
name: implement-feature
description: Use this skill for the implement-feature workflow.
---
---
description: 
---

# Workflow: Implement Feature

## Objective

Implement an approved MailPilot feature using small, controlled, testable changes.

Follow the approved implementation plan. Do not start implementation before the user approves the plan.

## Step 1 â€” Load Project Context

Before editing files:

1. Read `AGENTS.md`.
2. Read the relevant files in `.agent/rules/`.
3. Read the approved feature plan.
4. Inspect the current Git status.
5. Inspect all files relevant to the feature.
6. Check the existing implementation, dependencies, scripts, and tests.
7. Confirm that the current code still matches the approved plan.

Do not overwrite unrelated user changes.

If the working tree contains uncommitted changes, preserve them and avoid modifying unrelated files.

If the plan is outdated or a significant new blocker appears, stop and explain the issue before proceeding.

## Step 2 â€” Confirm the Implementation Scope

Identify:

- Acceptance criteria being implemented.
- Files to create or modify.
- Required configuration changes.
- Database changes.
- API changes.
- Security requirements.
- Tests required for verification.

Follow the smallest implementation that satisfies the approved requirements.

Do not add unrelated features or redesign existing modules without approval.

## Step 3 â€” Implement in Small Steps

Implement the feature in dependency order.

For each step:

1. Make one coherent group of changes.
2. Inspect the changed code.
3. Run the relevant targeted checks.
4. Resolve failures before moving to the next dependent step.
5. Keep the implementation consistent with existing project conventions.

Avoid unnecessarily large edits that make failures difficult to isolate.

Do not leave broken intermediate states when a step can be completed and verified independently.

## Step 4 â€” Frontend Implementation

When frontend changes are required:

- Use Next.js App Router.
- Use JavaScript and JSX, not TypeScript.
- Follow the established component structure.
- Reuse shared UI components and API utilities where appropriate.
- Use the existing styling approach and maintain the light-only design system.
- Implement loading, empty, success, and error states where relevant.
- Validate user input for usability, without relying on frontend validation for security.
- Ensure forms and interactive controls are accessible.
- Handle API errors without exposing sensitive backend details.
- Avoid storing authentication tokens in browser storage.
- Never expose SMTP credentials, JWT secrets, or database credentials to the frontend.

Do not introduce new styling frameworks or unnecessary UI libraries without justification.

## Step 5 â€” Backend Implementation

When backend changes are required:

- Use Node.js, Express, and JavaScript.
- Keep routes, controllers, services, validators, middleware, and utilities appropriately separated.
- Validate incoming data with Zod.
- Enforce authentication and authorization on protected endpoints.
- Keep business logic in services rather than route definitions.
- Use Prisma for database access.
- Follow existing API response and error-handling conventions.
- Avoid leaking internal exceptions or sensitive data.
- Add appropriate logging without recording secrets.
- Use bounded request sizes, upload limits, and pagination where relevant.

Never treat frontend restrictions as backend security controls.

## Step 6 â€” Database Implementation

If database changes are required:

1. Inspect the existing Prisma schema and data access patterns.
2. Confirm compatibility with Prisma's MongoDB connector.
3. Update models and indexes only as required.
4. Review the effect on existing documents.
5. Prepare the appropriate schema synchronization or backfill procedure.
6. Validate the change against a development or test database.
7. Verify that existing functionality remains compatible.

Do not assume Prisma defaults populate fields in existing MongoDB documents.

Do not run destructive operations against production data.

Do not introduce Mongoose or raw SQL as a workaround.

If a database change requires an unsafe or irreversible operation, stop and obtain explicit approval before proceeding.

## Step 7 â€” Email Implementation

When implementing email-related functionality:

- Keep SMTP access in the backend.
- Use the existing email service abstraction.
- Use React Email for supported templates.
- Generate HTML and plain-text versions.
- Use Mailpit for local test delivery.
- Keep SMTP configuration in backend environment variables.
- Never send test messages to real recipients.
- Require explicit confirmation before a real campaign send.
- Revalidate recipient eligibility immediately before sending.
- Exclude unsubscribed, archived, invalid, and blocked contacts.
- Prevent concurrent or duplicate campaign execution.
- Distinguish SMTP acceptance from confirmed delivery.
- Apply bounded retries only when retrying is safe.
- Preserve recipient-level status and useful diagnostic details.
- Keep the design extensible for a future queue without adding Redis or BullMQ in Phase 1.

Do not implement real bulk sending as part of an unrelated feature.

## Step 8 â€” Security Review

Before considering the implementation complete, verify:

- All protected endpoints enforce authentication.
- Authorization is checked on the backend.
- All relevant inputs are validated.
- Secrets remain server-side.
- Cookie and CSRF protections remain consistent.
- Database access does not expose unauthorized records.
- CSV import and export handle untrusted data safely.
- Email eligibility and unsubscribe rules cannot be bypassed.
- Error responses do not leak sensitive details.
- Relevant security tests have been added or updated.

Fix any security regression introduced by the feature.

## Step 9 â€” Automated Verification

Run the relevant commands supported by the current project:

- Targeted unit tests.
- Backend API and integration tests.
- Frontend tests.
- Linting.
- Build checks.
- Relevant end-to-end tests where the environment supports them.

Inspect the actual command output.

If a check fails:

1. Explain the failure.
2. Identify its root cause.
3. Locate the responsible code or configuration.
4. Evaluate viable fixes and trade-offs.
5. Apply the safest appropriate fix.
6. Rerun the failing check.
7. Run relevant regression tests.

Do not remove meaningful tests or weaken assertions simply to obtain passing results.

If a check cannot run because a dependency or service is unavailable, report that limitation accurately.

## Step 10 â€” Review the Final Changes

Review the diff and confirm:

- Only intended files changed.
- No secrets or credentials were added.
- No unrelated user changes were overwritten.
- No debugging code or temporary files remain.
- Error handling and validation are appropriate.
- Documentation reflects the implemented behavior.
- Acceptance criteria are satisfied.
- Tests reflect the intended behavior.

Do not automatically commit or push changes unless the user explicitly requests it.

## Step 11 â€” Definition of Done

A feature is complete only when:

- The approved acceptance criteria are implemented.
- Relevant security controls are in place.
- Relevant tests have been executed.
- Failures introduced by the implementation have been resolved.
- Existing behavior has been checked for regressions.
- Required documentation has been updated.
- Remaining limitations are documented.

A successful build alone does not prove that a feature works correctly.

## Final Report

After implementation, report:

### 1. Implemented
Summarize the actual functionality delivered.

### 2. Files Changed
List created, modified, and deleted files with a short explanation.

### 3. Database and API
Describe actual changes or explicitly state that none were required.

### 4. Verification
List commands actually executed and their real outcomes.

### 5. Security
Summarize the relevant safeguards and checks.

### 6. Limitations
Identify untested scenarios, unavailable services, and known issues.

### 7. Next Step
Recommend the next practical action without starting unrelated work.

Never claim completion for work that was not implemented or verified.
