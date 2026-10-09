---
name: debug
description: Use this skill for the debug workflow.
---
---
description: 
---

# Workflow: Debug and Fix

## Objective

Diagnose and resolve MailPilot bugs systematically, using evidence rather than guesses.

The goal is to fix the root cause while minimizing regressions and preserving existing functionality.

## Step 1 â€” Understand the Failure

Before changing code:

1. Read the complete error message.
2. Identify when the error occurs.
3. Determine the expected behavior.
4. Determine the actual behavior.
5. Identify the affected feature and user workflow.
6. Record reproduction steps.
7. Collect relevant browser console output, server logs, network responses, and test failures when available.

Explain the error in clear, beginner-friendly language.

Do not immediately change code based on a partial error message.

## Step 2 â€” Reproduce the Bug

Attempt to reproduce the failure using the smallest reliable sequence of steps.

Check:

- Browser console.
- Network requests and HTTP responses.
- Frontend terminal output.
- Backend terminal output.
- Prisma or database errors.
- Environment configuration.
- Relevant test output.
- Recent changes in the affected code.

If the issue cannot be reproduced, inspect the evidence and clearly distinguish confirmed facts from hypotheses.

Never claim that a bug was reproduced if it was not.

## Step 3 â€” Inspect the Relevant Code

Read the actual implementation before proposing a fix.

Inspect relevant:

- Frontend pages and components.
- API client functions.
- Express routes and middleware.
- Controllers and services.
- Zod schemas.
- Prisma models and database queries.
- Authentication and authorization logic.
- Email sending and campaign execution code.
- Tests and configuration.

Trace the data flow from the original input to the point where the failure occurs.

Do not invent missing functions, files, endpoints, or database fields.

## Step 4 â€” Identify the Root Cause

Explain:

1. What the error means.
2. Why it happened.
3. Where the problem originates.
4. Which conditions trigger it.
5. Why the current implementation fails.
6. Whether the issue is isolated or affects other features.

Classify the cause when useful:

- Incorrect logic.
- Invalid or unexpected input.
- Frontend state or rendering issue.
- API contract mismatch.
- Authentication or authorization failure.
- Database or Prisma issue.
- Missing environment configuration.
- External service failure.
- Concurrency or duplicate execution.
- Regression from a recent change.
- Dependency or build configuration problem.

Separate verified root causes from likely causes that still need confirmation.

## Step 5 â€” Propose Possible Fixes

Before modifying code, identify viable solutions.

For each meaningful option, describe:

- How it addresses the cause.
- Advantages.
- Disadvantages.
- Security implications.
- Regression risk.
- Whether it requires database or configuration changes.

Prefer the smallest safe fix that addresses the actual root cause.

Avoid broad rewrites when a targeted correction is sufficient.

If a fix requires a destructive database operation, a security-sensitive architecture change, or an irreversible action, explain the risk and obtain explicit approval before proceeding.

## Step 6 â€” Select the Best Fix

Choose the option that best balances:

- Correctness.
- Security.
- Maintainability.
- Compatibility with the existing architecture.
- Regression risk.
- Implementation complexity.

Explain why it is preferred.

Do not choose a workaround that merely hides the error while leaving the underlying defect in place.

## Step 7 â€” Implement the Fix

Before editing:

1. Read `AGENTS.md`.
2. Read the applicable rules in `.agent/rules/`.
3. Inspect Git status.
4. Preserve unrelated user changes.
5. Identify the minimum files that need modification.

Then:

- Implement the targeted correction.
- Add or update a regression test.
- Preserve existing API contracts unless a change is necessary and documented.
- Validate inputs at the correct boundary.
- Handle expected failures explicitly.
- Avoid unnecessary dependencies or unrelated refactoring.

Do not disable meaningful validation, remove failing tests, or suppress errors just to make the application appear functional.

## Step 8 â€” Verify the Fix

Run the smallest relevant test first.

Then run broader checks appropriate to the affected feature:

- Regression tests.
- Related unit tests.
- Backend API tests.
- Frontend tests.
- Linting.
- Build checks.
- Integration tests.
- End-to-end tests where available.

Check both the original failure and nearby failure scenarios.

For email-related bugs, use Mailpit and test recipients only. Never use real recipients to reproduce a development bug.

For database-related bugs, use a development or isolated test database.

Do not execute destructive commands against production.

## Step 9 â€” Check for Regressions

Verify that:

- The original problem is resolved.
- Related functionality still works.
- Error handling remains correct.
- Authentication and authorization remain enforced.
- No secrets or personal data are exposed.
- No unintended database changes occurred.
- No unrelated files were modified.
- Relevant existing tests still pass.

If a test fails, determine whether it is caused by the fix, an existing issue, or an unavailable dependency.

## Step 10 â€” Report the Outcome

Provide a clear report containing:

### A. Error Meaning
Explain the failure in simple terms.

### B. Root Cause
Describe the confirmed cause and the evidence supporting it.

### C. Location
List the relevant files and functions.

### D. Possible Solutions
Summarize the options and trade-offs considered.

### E. Selected Fix
Explain the chosen approach and why it is appropriate.

### F. Changes Made
List the actual code and configuration changes.

### G. Verification
List commands executed and their actual results.

### H. Remaining Risks
Identify unresolved issues and checks that could not run.

### I. Next Step
Give the next practical action if anything remains.

## Rules

- Never guess when the relevant evidence can be inspected.
- Never claim a test passed unless it was actually executed.
- Never claim a bug is fixed without verifying the relevant behavior.
- Never overwrite unrelated user changes.
- Never expose secrets in diagnostic output.
- Never use destructive production operations as a debugging shortcut.
- Follow the established MailPilot architecture and security rules.
- Explain technical findings in beginner-friendly language.
- Keep the final report concise but specific.
