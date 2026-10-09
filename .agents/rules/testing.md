---
trigger: always_on
---

# MailPilot — Testing Rules

## 1. Testing Principles

- Test every feature before declaring it complete.
- Never claim that a test passed unless it was actually executed and passed.
- Never replace real test execution with assumptions or code inspection alone.
- Prefer automated, repeatable tests.
- Test expected behavior, invalid input, failure cases, and security boundaries.
- Do not send real emails to real recipients during automated tests.
- Keep tests isolated from production data and services.
- Fix the root cause of failures instead of hiding them.

## 2. Testing Stack

Use the following tools where appropriate:

- Vitest for JavaScript unit and integration tests.
- Supertest for Express API testing.
- React Testing Library for frontend component behavior.
- Playwright for critical end-to-end browser workflows.
- Mailpit for local email delivery inspection.
- Zod for runtime validation of application inputs.

Before adding a testing dependency, inspect the existing project configuration and reuse installed tools where possible.

Do not introduce TypeScript into test files.

## 3. Unit Tests

Write unit tests for business logic that can be tested independently.

Prioritize:

- Email address validation.
- CSV row normalization and validation.
- Duplicate contact detection.
- Contact eligibility rules.
- Personalization variable replacement.
- Email HTML and plain-text generation.
- Retry eligibility and failure classification.
- Campaign status transitions.
- CSV formula-injection protection.
- Pagination and filtering utilities.

Unit tests must not require real SMTP delivery or production database access.

Mock external services only where mocking provides meaningful isolation.

## 4. Backend API Tests

Test Express endpoints using Supertest or the project's established equivalent.

For each important endpoint, verify:

- Correct HTTP status codes.
- Correct response structure.
- Valid input is accepted.
- Invalid input is rejected.
- Missing authentication is rejected.
- Invalid authentication is rejected.
- Unexpected server errors are handled safely.
- Sensitive information is not returned.
- Database changes match the intended behavior.

Test pagination boundaries, missing records, duplicate records, and invalid identifiers where relevant.

Do not assume that hiding a frontend button protects its corresponding API endpoint.

## 5. Authentication Tests

Verify all critical authentication behavior:

- Successful login using an email address.
- Successful login using a username.
- Incorrect password is rejected.
- Unknown account receives a generic failure response.
- Missing or malformed credentials are rejected.
- Expired or invalid JWTs are rejected.
- Protected endpoints reject unauthenticated requests.
- Logout clears the authentication cookie.
- Cookies have the expected security attributes for the active environment.
- Login rate limiting works.
- Public registration is unavailable.
- Initial administrator setup cannot overwrite an existing administrator unexpectedly.
- Passwords are hashed and never returned by API responses.

Never use real administrator credentials in committed tests.

## 6. Contact Management Tests

Verify:

- A valid contact can be created.
- Invalid email addresses are rejected.
- Duplicate email addresses are handled consistently.
- Search by name and email works.
- Subscription and archive filters work.
- Pagination works, with a default page size of 20.
- Archived contacts are excluded from campaign recipients.
- Unsubscribed contacts are excluded from campaign recipients.
- Invalid or blocked contacts are excluded.
- Soft deletion preserves relevant historical campaign records.
- CSV imports report accepted, duplicate, invalid, and rejected rows correctly.
- Large or malformed CSV files are handled safely.
- CSV exports are protected against formula injection.

Use a dedicated test database or an isolated test dataset.

## 7. Campaign and Email Tests

Verify:

- A campaign can be saved as a draft.
- The preview matches the selected content and template.
- HTML and plain-text versions are generated.
- Personalization placeholders are resolved safely.
- Missing personalization values are handled predictably.
- A test email can be sent to Mailpit.
- Real campaign sending requires explicit confirmation.
- Only eligible contacts are selected.
- Recipient addresses are not exposed to other recipients.
- Campaign history and recipient statuses are recorded.
- Campaigns cannot be executed concurrently or duplicated accidentally.
- Retry limits are respected.
- Permanent failures are not retried indefinitely.
- Uncertain SMTP outcomes are handled without unsafe automatic retries.
- Archiving a campaign preserves its history.

Tests must not send messages to real recipients.

## 8. SMTP and Mailpit Tests

Use Mailpit for local email testing.

Verify:

- The application can connect using the configured development SMTP settings.
- A test message appears in Mailpit.
- The expected subject, sender, recipient, HTML, and plain-text content are present.
- SMTP connection failures are handled correctly.
- Authentication failures are reported without exposing credentials.
- A successful SMTP acceptance is distinguished from confirmed inbox delivery.
- Test messages cannot accidentally be routed to real recipients.

If Mailpit is unavailable, report that the SMTP integration test could not run. Do not claim that delivery was verified.

## 9. Database and Prisma Tests

Verify:

- Prisma connects to the intended test database.
- Required models and constraints behave as expected.
- Unique contact email rules work correctly.
- Relations and historical records remain consistent.
- Soft deletion does not accidentally erase campaign history.
- Failed database operations produce safe errors.
- Test setup and cleanup do not affect development or production data.

Respect Prisma's MongoDB connector limitations.

Do not introduce unsupported relational migration assumptions or raw SQL workarounds.

Never run destructive tests against production data.

## 10. Frontend Tests

Use React Testing Library for meaningful UI behavior.

Verify:

- Login validation and error messages.
- Loading, empty, success, and error states.
- Contact search, filters, pagination, and archive actions.
- CSV import feedback and row-level error reporting.
- Campaign editing and preview behavior.
- Confirmation before sending a campaign.
- Sending progress and final campaign status.
- Accessible form labels and keyboard interaction.
- API failures are presented clearly.
- Sensitive configuration is never rendered in the browser.

Avoid tests that depend only on implementation details or fragile CSS selectors.

## 11. End-to-End Tests

Use Playwright for the most important complete workflows when the application environment supports it.

Recommended workflows:

1. Administrator login and logout.
2. Create, search, archive, and restore a contact where restoration is supported.
3. Import a CSV file containing valid, duplicate, and invalid records.
4. Create a draft campaign and preview it.
5. Send a test email and verify it in Mailpit.
6. Verify that unsubscribed and archived contacts are excluded from a campaign.
7. Review campaign history and export a report.
8. Verify that unauthenticated users cannot access protected pages.

Use dedicated test accounts, test data, and Mailpit. Never target real recipients.

## 12. Test Data and Environment

- Use separate environment configuration for testing.
- Use a dedicated test database or clearly isolated test records.
- Never run automated tests against production services or data.
- Keep test credentials out of version control.
- Clean up test records only when cleanup is safe and scoped.
- Make tests deterministic and repeatable.
- Do not rely on test execution order unless explicitly required.
- Avoid parallel tests that interfere with shared database state.
- Use mocks or controlled fixtures for failure scenarios.

## 13. Failure Investigation

When a test fails:

1. Explain what the failure means.
2. Identify the likely root cause.
3. Locate the failing code or configuration.
4. Present viable fixes and their trade-offs.
5. Select and implement the safest appropriate fix.
6. Re-run the failing test.
7. Run relevant regression tests.
8. Report any remaining failures or unverified behavior.

Do not delete meaningful tests, weaken assertions, skip checks, or mock away the actual problem just to obtain a green test result.

## 14. Required Checks Before Completion

For each feature:

- Run relevant unit tests.
- Run relevant API or integration tests.
- Run frontend tests where applicable.
- Run linting and build checks where configured.
- Check authorization and input validation.
- Check relevant failure cases.
- Review the actual test output.
- Record tests that could not run and explain why.

Do not claim full test coverage unless coverage was measured.

Do not claim end-to-end verification when only unit tests ran.

## 15. Completion Report

After testing a feature, report:

- Feature tested.
- Tests added or modified.
- Commands actually executed.
- Tests passed.
- Tests failed.
- Checks that could not run and why.
- Known limitations.
- Any remaining security or reliability concerns.

A feature is not fully verified simply because the application starts or the frontend renders.