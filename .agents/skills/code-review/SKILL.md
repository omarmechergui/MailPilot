---
name: code-review
description: Use this skill for the code-review workflow.
---
---
description: 
---

# Workflow: Code Review

## Objective

Review MailPilot code changes for correctness, security, maintainability, architecture consistency, and regression risks.

Focus on actionable defects rather than stylistic preferences.

Do not modify code during the review unless the user explicitly requests fixes.

## Step 1 â€” Load Project Context

Before reviewing:

1. Read `AGENTS.md`.
2. Read the relevant rules in `.agent/rules/`.
3. Inspect the approved feature requirements and implementation plan, if available.
4. Inspect Git status.
5. Identify the intended changes using the Git diff.
6. Read the complete relevant functions and surrounding code.
7. Inspect related tests, schemas, and callers.

Do not assume that every changed line is a defect.

Preserve all uncommitted user changes.

## Step 2 â€” Review Correctness

Look for:

- Incorrect business logic.
- Missing edge-case handling.
- Incorrect conditions or calculations.
- Incorrect assumptions about input data.
- Missing null or undefined handling.
- Incorrect asynchronous behavior.
- Unhandled promise rejections.
- Incorrect API response handling.
- Inconsistent frontend and backend behavior.
- State-management defects.
- Incorrect database queries.
- Incorrect campaign or contact status transitions.

Trace the affected behavior through the relevant application layers.

Explain the concrete scenario in which each suspected defect occurs.

## Step 3 â€” Review Architecture

Check that:

- Frontend and backend responsibilities remain separated.
- React components do not contain unnecessary business logic.
- Express routes remain appropriately thin.
- Controllers coordinate requests and responses.
- Services contain reusable business logic.
- Zod schemas validate untrusted input.
- Prisma access follows the established data-access patterns.
- Shared utilities are reused when appropriate.
- New dependencies are justified.
- Existing project conventions remain consistent.

Do not recommend architectural rewrites without a concrete benefit or demonstrated problem.

## Step 4 â€” Review Authentication and Authorization

Check that:

- Protected routes require valid authentication.
- Authorization is enforced on the backend.
- Client-supplied identifiers cannot bypass access controls.
- JWT validation is correct.
- Authentication cookies are configured appropriately.
- Logout invalidates the application's authentication state.
- Login rate limiting remains effective.
- Public registration has not been introduced.
- Initial administrator setup cannot unexpectedly replace an existing administrator.
- Sensitive account information is not exposed.

Do not consider hidden frontend controls sufficient authorization.

## Step 5 â€” Review Input Validation and Data Handling

Check that:

- Request bodies, query parameters, and route parameters are validated.
- Invalid data is rejected consistently.
- Database queries do not trust unvalidated client input.
- Pagination and upload limits are enforced.
- CSV import handles duplicates and malformed records.
- CSV exports are protected against formula injection.
- Soft deletion preserves required historical records.
- Existing MongoDB documents remain compatible with schema changes.
- Prisma MongoDB limitations are respected.
- Sensitive data is not unnecessarily duplicated or exposed.

Verify assumptions against the actual schema and implementation.

## Step 6 â€” Review Email and Campaign Safety

For email-related changes, check that:

- SMTP credentials remain exclusively on the backend.
- SMTP configuration is not exposed through public API responses.
- Campaign sending requires explicit confirmation.
- Only eligible contacts are selected.
- Unsubscribed, archived, invalid, and blocked contacts are excluded.
- Recipient addresses are not exposed to other recipients.
- Duplicate or concurrent campaign execution is prevented.
- Retry behavior is bounded and appropriate.
- Uncertain SMTP outcomes are handled safely.
- SMTP acceptance is not misrepresented as confirmed delivery.
- Campaign history and recipient statuses remain consistent.
- Automated tests use Mailpit and test recipients.

Flag any path that could accidentally send real messages during testing.

## Step 7 â€” Review Error Handling and Logging

Check that:

- Expected failures are handled explicitly.
- API responses use appropriate HTTP status codes.
- Internal stack traces are not exposed in production.
- Logs contain useful diagnostic context without secrets.
- Passwords, JWTs, cookies, and SMTP credentials are never logged.
- Errors do not silently disappear.
- Failed database or email operations are not reported as successful.
- Partial operations leave the application in a recoverable state where possible.

## Step 8 â€” Review Reliability and Performance

Check for:

- N+1 database queries.
- Unnecessary repeated requests.
- Missing pagination.
- Unbounded loops or retries.
- Unsafe concurrent operations.
- Race conditions.
- Duplicate event handling.
- Memory-intensive CSV processing.
- Long-running synchronous HTTP requests.
- Incomplete handling of process interruptions during campaign execution.
- Unnecessary dependencies or expensive operations.

For Phase 1, respect the decision to avoid Redis and BullMQ. Identify reliability limitations of in-process campaign execution without silently introducing a new queue infrastructure.

## Step 9 â€” Review Tests

Check whether tests cover:

- The changed behavior.
- Important edge cases.
- Invalid input.
- Authentication and authorization.
- Database consistency.
- Failure handling.
- Relevant regressions.
- Email safety, where applicable.

Look for tests that are misleading, overly dependent on implementation details, or too heavily mocked to verify the required behavior.

Do not assume that tests pass without examining actual execution results.

If the task requests review only, do not run destructive tests or change the environment.

## Step 10 â€” Classify Findings

Classify actionable findings by severity:

### Critical
A severe vulnerability or defect that could cause major compromise, unauthorized access, or substantial data loss.

### High
A serious security, correctness, or reliability defect that should be fixed before release.

### Medium
A meaningful defect or maintainability problem with a realistic impact.

### Low
A minor issue with limited impact or a small improvement opportunity.

For each finding, include:

- Severity.
- File and relevant line numbers, when available.
- Description of the problem.
- Concrete failure scenario.
- Impact.
- Recommended correction.
- Relevant test or verification method.

Do not inflate severity or report speculative issues as confirmed vulnerabilities.

If no actionable issues are found, state that clearly and mention the scope and limitations of the review.

## Step 11 â€” Produce the Review Report

Use this structure:

### A. Review Scope
List the files, features, and diff reviewed.

### B. Findings
List actionable findings in descending severity order.

### C. Security Assessment
Summarize relevant security observations.

### D. Test Assessment
Describe test coverage and actual execution results, if tests were run.

### E. Regression Risks
Identify possible unintended effects.

### F. Recommended Actions
Prioritize the corrections that matter most.

### G. Review Conclusion
Choose one:

- **Approved:** No blocking issues were found within the reviewed scope.
- **Approved with follow-up items:** No blocking issues were found, but non-blocking improvements remain.
- **Changes required:** One or more blocking issues must be resolved before approval.
- **Inconclusive:** The available evidence was insufficient to reach a reliable conclusion.

## Rules

- Review actual code, not assumptions.
- Focus on demonstrable problems and actionable recommendations.
- Do not modify code during a review-only task.
- Do not commit, push, or merge changes unless explicitly requested.
- Do not expose secrets or personal data in the report.
- Distinguish confirmed defects from potential risks.
- Never claim comprehensive security or correctness based on a limited review.
- Follow all applicable MailPilot project rules.
