---
name: phase-gate
description: Use this skill for the phase-gate workflow.
---
---
description: 
---

# Workflow: Phase Gate

## Objective

Evaluate whether a MailPilot development phase is ready to be considered complete and whether work can safely proceed to the next phase.

A phase is complete only when its defined requirements have been implemented and verified with evidence.

## Step 1 â€” Load Phase Context

Before evaluating a phase:

1. Read `AGENTS.md`.
2. Read all relevant files in `.agent/rules/`.
3. Read `docs/roadmap.md`.
4. Read the requirements and technical specification relevant to the phase.
5. Inspect the approved phase plan.
6. Inspect the current implementation and Git status.
7. Identify the phase acceptance criteria and required deliverables.

Do not assume that a phase is complete because its planned files exist.

## Step 2 â€” Check Scope and Deliverables

For every planned deliverable, determine whether it is:

- Not started.
- In progress.
- Implemented but not verified.
- Verified.
- Blocked.
- Deferred with explicit approval.

Inspect the actual code, configuration, database models, documentation, and tests as applicable.

Distinguish implemented functionality from placeholder screens, mock data, incomplete integrations, and future improvements.

Do not describe a partially implemented feature as complete.

## Step 3 â€” Check Functional Acceptance Criteria

Evaluate every acceptance criterion against observable evidence.

Verify relevant behavior through:

- Automated tests.
- API requests and responses.
- Frontend interaction.
- Database state.
- External service integration.
- Manual verification where automation is not practical.

Use the actual results.

A successful application startup does not prove that every feature works.

## Step 4 â€” Check Architecture and Code Quality

Confirm that:

- The agreed frontend and backend architecture is respected.
- JavaScript and JSX are used instead of TypeScript.
- Frontend and backend responsibilities remain separated.
- Prisma is used for database access.
- MongoDB connector limitations are respected.
- Zod validates relevant inputs.
- Business logic is located in appropriate services.
- Configuration and secrets are handled correctly.
- Temporary debugging code and unintended files are removed.
- Documentation reflects the actual implementation.

Identify significant technical debt that affects the next phase.

Do not require unrelated refactoring as a condition of completion unless it is necessary for correctness, security, or maintainability.

## Step 5 â€” Check Security

Verify relevant security requirements, including:

- Authentication and authorization.
- Password hashing and JWT handling.
- HttpOnly cookie configuration.
- CSRF and CORS protections.
- Backend input validation.
- Secret management.
- Database access restrictions.
- CSV import and export safety.
- Contact privacy.
- Campaign confirmation and recipient eligibility.
- SMTP credential protection.
- Backup access protection.

Critical security defects block phase completion.

Do not claim that the system is completely secure based solely on passing automated tests.

## Step 6 â€” Check Testing and Build Status

Run the relevant commands available in the project:

- Unit tests.
- Backend API and integration tests.
- Frontend tests.
- Linting.
- Production build.
- Database-related checks.
- End-to-end tests where the environment supports them.

Record actual commands and results.

Classify checks as:

- Passed.
- Failed.
- Blocked.
- Not run.

Do not treat blocked or untested checks as passed.

Investigate failures introduced by the phase. Distinguish them from pre-existing failures and document the evidence.

## Step 7 â€” Check External Dependencies

Identify any external service required for the phase, such as:

- MongoDB Atlas.
- Mailpit.
- An SMTP provider.
- A browser test environment.
- A required build or test dependency.

If a service is unavailable, determine whether the affected acceptance criterion can be verified another way.

If reliable verification is impossible, record the criterion as blocked or unverified.

Do not fabricate integration results or require a future production service prematurely when the current phase only needs a local development substitute.

## Step 8 â€” Check Data Safety and Recoverability

Where relevant, verify:

- Existing data remains compatible with schema changes.
- Required backfills have completed.
- Destructive changes were not performed without authorization.
- Historical campaign records remain consistent.
- Backup and restore requirements are satisfied when included in the phase.
- Test execution did not affect production data.

If a phase requires a recoverable backup, confirm that the backup procedure is documented and that restoration has been verified when required by the acceptance criteria.

Do not claim that an untested backup is recoverable.

## Step 9 â€” Evaluate Blockers

Classify outstanding issues:

### Blocking
An unmet required acceptance criterion, critical or high-impact defect, failed mandatory test, unsafe data operation, or unresolved dependency preventing reliable completion.

### Non-blocking
A documented improvement that does not prevent the phase from meeting its required behavior, security, reliability, and quality criteria.

### Deferred
An item intentionally assigned to a later phase and documented in the roadmap.

Do not silently move unfinished requirements into a future phase merely to pass the gate.

Obtain approval before changing agreed scope or accepting a material security or data-integrity risk.

## Step 10 â€” Produce the Phase Gate Report

Use the following structure:

### A. Phase
Identify the phase and its intended outcome.

### B. Deliverables
List the deliverables and their actual status.

### C. Acceptance Criteria
Show each criterion and its evidence-based result.

### D. Verification
List the commands executed and actual outcomes.

### E. Security
Summarize relevant checks and unresolved findings.

### F. Blockers
List all blocking issues and what is required to resolve them.

### G. Non-Blocking Items
List follow-up work, technical debt, and approved deferrals.

### H. Readiness Decision
Choose one:

- **PASS:** Required acceptance criteria are satisfied, mandatory checks passed, and no blocking issues remain.
- **PASS WITH APPROVED DEFERRALS:** Required criteria are satisfied and remaining scope changes have explicit approval.
- **FAIL:** One or more required criteria or mandatory checks failed.
- **BLOCKED:** Verification cannot be completed because a required dependency, decision, or environment is unavailable.

### I. Next Action
Specify the smallest practical step required to proceed safely.

## Rules

- Never mark a phase complete without evidence.
- Never claim that a test, build, migration, or integration succeeded unless it actually did.
- Never conceal blocking issues.
- Never silently change scope or weaken acceptance criteria.
- Never perform destructive production operations as part of the gate.
- Do not commit, push, or merge automatically.
- Preserve unrelated user changes.
- Follow all applicable MailPilot rules and approved requirements.
- Do not start the next phase automatically after reporting the gate result.

## Completion Policy

A PASS means the defined phase requirements have been verified within the documented scope. It does not guarantee that the entire application is defect-free.

After reporting the result, wait for the user's instruction before beginning the next phase.
