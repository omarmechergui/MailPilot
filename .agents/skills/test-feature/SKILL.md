---
name: test-feature
description: Use this skill for the test-feature workflow.
---
---
description: 
---

# Workflow: Test Feature

## Objective

Systematically verify a MailPilot feature against its acceptance criteria, including expected behavior, failure scenarios, security requirements, and regression risks.

Testing must be based on actual execution and observable results.

## Step 1 â€” Load the Testing Context

Before running tests:

1. Read `AGENTS.md`.
2. Read `.agent/rules/testing.md`.
3. Read the relevant security, architecture, and coding rules.
4. Inspect the feature requirements and approved implementation plan.
5. Inspect the current implementation and related tests.
6. Check Git status and preserve unrelated user changes.
7. Identify the relevant package scripts and available test infrastructure.

Do not assume that a test framework, script, service, or test fixture exists. Inspect the project first.

## Step 2 â€” Define What Must Be Verified

Create a checklist from the feature's acceptance criteria.

Include the relevant categories:

- Expected behavior.
- Input validation.
- Authentication.
- Authorization.
- Database consistency.
- API response behavior.
- Frontend interaction.
- Loading, empty, success, and error states.
- Security and privacy.
- External service integration.
- Failure recovery.
- Regression prevention.

Each criterion must have a clear verification method.

Do not mark a criterion as passed based only on reading the source code.

## Step 3 â€” Prepare a Safe Test Environment

Before executing tests:

1. Identify the active environment.
2. Confirm the database target.
3. Confirm that credentials and secrets are appropriate for testing.
4. Check which external services are available.
5. Prepare isolated test data.
6. Confirm that automated tests cannot send messages to real recipients.
7. Identify any operation that could delete or modify important data.

Use a dedicated test database or an appropriately isolated test dataset.

Use Mailpit for local email tests.

Never run destructive tests against production data.

If the environment cannot be verified as safe, stop the relevant test and explain why.

## Step 4 â€” Run Tests in Increasing Scope

Run checks in this order where applicable:

1. Targeted unit tests.
2. Relevant backend API tests.
3. Database integration tests.
4. Frontend component tests.
5. Linting and static checks.
6. Build checks.
7. End-to-end tests.
8. Security and regression checks.

Adapt the order to the feature's dependencies.

Run focused tests first to identify failures quickly. Expand to broader tests after the targeted checks pass.

Use the actual commands defined in the project.

Do not invent package scripts or claim that a command ran when it did not.

## Step 5 â€” Verify Positive Scenarios

Check that valid operations produce the expected results.

Examples include:

- A valid administrator login succeeds.
- A valid contact can be created.
- A valid CSV row is imported.
- A campaign draft can be saved.
- An email preview renders correctly.
- A test message appears in Mailpit.
- A valid report can be exported.
- A permitted administrative action succeeds.

Verify the resulting database state or observable UI behavior when relevant.

## Step 6 â€” Verify Negative Scenarios

Test invalid inputs and expected failures.

Examples include:

- Invalid email addresses.
- Duplicate contacts.
- Missing required fields.
- Malformed CSV files.
- Unauthorized API requests.
- Invalid or expired authentication tokens.
- Missing database records.
- SMTP connection failures.
- Invalid template variables.
- Unsupported request payloads.
- Rate-limit violations.

Confirm that failures are handled safely and return appropriate responses.

Verify that failed operations do not leave inconsistent or unintended data behind.

## Step 7 â€” Verify Security Boundaries

For applicable features, check:

- Authentication is required where expected.
- Authorization is enforced by the backend.
- Invalid input cannot bypass validation.
- Secrets are not exposed in API responses or logs.
- Cookie and CSRF protections remain correct.
- Contact exports are restricted to authorized users.
- CSV exports handle formula injection safely.
- Archived, unsubscribed, invalid, and blocked contacts cannot be selected for sending.
- Campaign execution cannot be duplicated accidentally.
- Sensitive backup files are protected.

Do not attempt destructive security tests against production.

## Step 8 â€” Verify Email-Specific Behavior

For email and campaign features:

1. Use Mailpit and test recipients only.
2. Verify sender, recipient, subject, HTML, and plain-text content.
3. Verify personalization values.
4. Confirm that ineligible contacts are excluded.
5. Confirm that explicit confirmation is required before real campaign sending.
6. Verify recipient-level status and attempt records.
7. Test bounded retries and failure classification.
8. Check that uncertain SMTP outcomes are not retried unsafely.
9. Distinguish SMTP acceptance from confirmed inbox delivery.

Do not claim that a message reached an inbox simply because the SMTP server accepted it.

If Mailpit is unavailable, report that integration verification could not be completed.

## Step 9 â€” Investigate Failures

For every failed test:

1. Explain what the failure means.
2. Identify the likely root cause.
3. Locate the relevant code or configuration.
4. Separate confirmed findings from hypotheses.
5. Evaluate possible fixes and their trade-offs.
6. Apply an appropriate fix only when authorized by the current task and workflow.
7. Re-run the failing test.
8. Run relevant regression tests.

Do not weaken assertions, delete useful tests, or suppress errors simply to obtain a passing result.

If the problem cannot be safely resolved, report it rather than concealing it.

## Step 10 â€” Assess Coverage of Acceptance Criteria

Create a verification matrix:

| Acceptance criterion | Verification method | Result |
|---|---|---|
| Criterion 1 | Actual test or observable check | Passed / Failed / Blocked |
| Criterion 2 | Actual test or observable check | Passed / Failed / Blocked |

Use only the actual results.

- **Passed:** The relevant check was executed successfully.
- **Failed:** The check ran and did not meet expectations.
- **Blocked:** The check could not run because a dependency, service, or prerequisite was unavailable.
- **Not tested:** No verification was performed.

Do not treat blocked or untested criteria as passed.

## Step 11 â€” Report Test Results

Provide:

### A. Feature
Identify the feature and the behavior under test.

### B. Environment
Describe the relevant test environment and dependencies.

### C. Commands Executed
List the commands actually run.

### D. Results
Summarize passed, failed, blocked, and untested checks.

### E. Acceptance Criteria
Show the verification matrix.

### F. Defects Found
Explain failures, root causes where established, and required fixes.

### G. Security Findings
List relevant security issues and unresolved risks.

### H. Remaining Work
Identify what must happen before the feature can be considered verified.

## Definition of Done

A feature may be reported as verified only when:

- Its acceptance criteria have been checked.
- Relevant automated tests have run.
- Relevant failure scenarios have been tested.
- Applicable security requirements have been verified.
- Relevant regressions have been checked.
- Test outcomes are accurately documented.

If any critical criterion fails or remains blocked, explicitly state that the feature is not fully verified.

Passing tests provide evidence of correctness; they do not prove the complete absence of defects.
