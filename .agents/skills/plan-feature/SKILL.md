---
name: plan-feature
description: Use this skill for the plan-feature workflow.
---
---
description: 
---

# Workflow: Plan Feature

## Objective

Analyze a requested MailPilot feature and produce an implementation plan before modifying application code.

Do not implement the feature during this workflow.

## Step 1 â€” Understand the Request

1. Restate the requested feature in clear, testable terms.
2. Identify the user problem it solves.
3. List the expected behavior.
4. Identify edge cases and failure scenarios.
5. Identify security and privacy implications.
6. Identify assumptions that need to be made.

If an essential requirement is missing, ask one concise clarification question. For nonessential details, choose sensible defaults and document them.

## Step 2 â€” Inspect the Existing Project

Before proposing changes:

1. Inspect the existing folder structure.
2. Read `AGENTS.md`.
3. Read relevant files in `.agent/rules/`.
4. Inspect related frontend pages and components.
5. Inspect relevant backend routes, controllers, services, middleware, and validators.
6. Inspect Prisma models and the current database design.
7. Inspect existing tests and package scripts.
8. Identify existing reusable utilities and patterns.

Do not assume that a file, endpoint, component, package, or database model exists without checking.

Do not duplicate existing functionality unnecessarily.

## Step 3 â€” Define Acceptance Criteria

Write clear acceptance criteria describing observable behavior.

Each criterion must be testable.

Include, where applicable:

- Successful behavior.
- Invalid input.
- Empty states.
- Authentication and authorization.
- Database consistency.
- Error handling.
- Loading and progress states.
- Accessibility.
- Security and privacy.
- Regression risks.

## Step 4 â€” Analyze the Architecture

Identify which application layers are affected:

- Frontend UI.
- Frontend API client.
- Backend route.
- Authentication and authorization middleware.
- Controller.
- Service and business logic.
- Zod validation.
- Prisma database models and queries.
- Email delivery service.
- Logging and error handling.
- Automated tests.
- Documentation.

Use only the layers that the feature actually needs.

Keep responsibilities separated. Do not place business logic directly in React components or route definitions.

## Step 5 â€” Analyze Database Changes

If the feature affects persisted data:

1. Inspect the existing Prisma schema.
2. Identify required model, field, index, relation, or constraint changes.
3. Check compatibility with Prisma's MongoDB connector.
4. Consider existing documents that may not contain newly introduced fields.
5. Consider uniqueness, optional values, deletion behavior, and historical records.
6. Define any required data migration or backfill.
7. Identify backup and rollback considerations.

Do not assume that adding a Prisma default automatically updates existing MongoDB documents.

Do not modify production data during planning.

If no database changes are needed, state that explicitly.

## Step 6 â€” Analyze API Changes

For each affected endpoint, define:

- HTTP method and route.
- Authentication requirements.
- Authorization rules.
- Request parameters and body.
- Zod validation.
- Successful response shape.
- Expected error responses.
- Database side effects.
- Relevant rate limits or request limits.

Reuse established API conventions unless a documented reason requires a change.

Avoid exposing internal errors or sensitive information.

## Step 7 â€” Analyze Security and Reliability

Check for:

- Authentication bypass.
- Missing authorization.
- Input validation gaps.
- Sensitive data exposure.
- CSRF and cookie implications.
- Injection risks.
- Unbounded requests or uploads.
- Duplicate operations.
- Race conditions.
- Partial database updates.
- Email retry and duplicate-delivery risks.
- Unsubscribe enforcement.
- Backup and export exposure.

For email-related features, explicitly consider whether the operation can accidentally send messages to real recipients.

## Step 8 â€” Prepare the Test Plan

Define the tests needed before implementation.

Include relevant:

- Unit tests.
- Backend API tests.
- Database integration tests.
- Frontend component tests.
- End-to-end tests.
- Security tests.
- Failure and regression tests.

For email functionality, use Mailpit and test recipients only.

Specify how each acceptance criterion will be verified.

## Step 9 â€” Identify Dependencies and Risks

List:

- Existing code that can be reused.
- New packages that may be necessary.
- Configuration changes.
- Environment variables.
- External services.
- Technical limitations.
- Potential regressions.
- Unresolved blockers.

Do not install packages or modify configuration during this workflow.

Prefer existing dependencies when they are sufficient.

## Step 10 â€” Produce the Implementation Plan

Return a structured plan with these sections:

### A. Feature Summary
Describe the goal and intended behavior.

### B. Current State
Summarize the relevant existing implementation based on inspected files.

### C. Acceptance Criteria
List testable conditions for completion.

### D. Files to Create or Modify
For every file, explain the intended change.

### E. Database Changes
Describe schema changes, existing-data concerns, and migration requirements, or state that none are needed.

### F. API Changes
List affected endpoints, validation, permissions, and response behavior, or state that none are needed.

### G. Security and Reliability
List the required safeguards.

### H. Test Plan
List tests and how they will be executed.

### I. Implementation Order
Provide a dependency-aware sequence of small steps.

### J. Risks and Assumptions
Identify known limitations, assumptions, and unresolved blockers.

### K. Definition of Done
State the conditions required to consider the feature complete.

## Rules

- Do not modify application code.
- Do not execute database writes or send emails.
- Do not claim that unexecuted tests passed.
- Do not invent files, functions, endpoints, or existing behavior.
- Clearly distinguish verified facts from assumptions.
- Follow all applicable rules in `.agent/rules/`.
- Keep the plan specific to the actual MailPilot codebase.
- Prefer the smallest safe implementation that satisfies the requirements.

## Handoff

End by asking for approval to proceed with implementation.

Wait for approval before making application changes.
