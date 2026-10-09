# MailPilot — Database Design

## 1. Purpose

This document defines the logical database model for MailPilot.

The database uses MongoDB Atlas with Prisma ORM. The design must preserve campaign history, enforce application-level business rules, and remain compatible with the installed Prisma MongoDB connector.

This is the logical design. Before implementation, verify every field, index, relation, and operation against the actual Prisma schema and MongoDB connector capabilities.

## 2. Database Principles

- Use MongoDB Atlas with a dedicated MailPilot database.
- Use Prisma ORM exclusively for application database access.
- Do not use Mongoose.
- Use JavaScript throughout the application.
- Store timestamps consistently in UTC.
- Use MongoDB ObjectIds through Prisma-supported ID mappings.
- Validate input and business rules in the backend.
- Use soft deletion or archiving when historical references must remain available.
- Never store plaintext administrator passwords.
- Never store SMTP passwords in application collections.
- Never store JWTs or session cookies in the database unless a separately approved security design requires it.
- Create indexes based on real query patterns.
- Do not assume that Prisma schema defaults backfill existing MongoDB documents.
- Do not assume that MongoDB provides relational foreign-key enforcement.
- Do not implement database changes without checking compatibility with the installed Prisma version.

## 3. Collections

The initial logical model includes:

1. `Admin`
2. `Contact`
3. `Campaign`
4. `CampaignRecipient`
5. `AuditEvent` — optional, but recommended for sensitive administrative operations.

Avoid adding collections that do not support a defined requirement.

## 4. Admin

### Purpose

Stores the single administrator account.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | Primary identifier |
| `username` | String | Required; normalized and unique |
| `email` | String | Required; normalized and unique |
| `passwordHash` | String | Required; Argon2id hash |
| `createdAt` | DateTime | Required |
| `updatedAt` | DateTime | Required |
| `lastLoginAt` | DateTime or null | Updated after successful login |

### Rules

- Public registration is not allowed.
- Only the controlled initialization process can create the initial administrator.
- Do not allow multiple administrator accounts through normal application workflows.
- Enforce username and email uniqueness at the database level where supported.
- Normalize email addresses and usernames consistently before checking uniqueness.
- Never return `passwordHash` in API responses.
- Password changes must use the approved password hashing procedure.
- Do not silently create or reset administrator credentials during normal application startup.

## 5. Contact

### Purpose

Stores contact information and subscription eligibility.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | Primary identifier |
| `email` | String | Required; normalized |
| `emailNormalized` | String | Canonical lookup and duplicate-detection value |
| `name` | String or null | Optional display name |
| `status` | Enum or String | Explicit contact state |
| `isSubscribed` | Boolean | Controls subscription eligibility |
| `isBlocked` | Boolean | Excludes blocked addresses |
| `archivedAt` | DateTime or null | Non-null means archived |
| `deletedAt` | DateTime or null | Non-null means soft-deleted |
| `source` | String or null | Optional origin, such as manual or CSV |
| `createdAt` | DateTime | Required |
| `updatedAt` | DateTime | Required |
| `unsubscribedAt` | DateTime or null | Records the unsubscribe timestamp |

The implementation may simplify overlapping fields if it establishes one clear, consistent model. Do not maintain redundant state without a documented reason.

### Contact States

The implementation must define supported states explicitly. A possible model includes:

- `ACTIVE`
- `INVALID`
- `BLOCKED`

Subscription and archive state are separate eligibility dimensions.

A contact is eligible for campaign sending only when all required conditions are satisfied:

- The contact is active.
- The contact is not archived.
- The contact is not soft-deleted.
- The email address passes the application's validity checks.
- The contact is subscribed.
- The contact is not blocked.

The backend must evaluate eligibility immediately before delivery.

### Email Normalization

Normalize email addresses consistently for duplicate detection.

Do not apply provider-specific transformations, such as removing dots or plus-addressing suffixes, because those transformations may change the meaning of an address for different providers.

### Duplicate Policy

The system must define how duplicate addresses are handled.

- CSV duplicates must be detected within the uploaded file.
- Existing contact conflicts must be reported.
- Do not silently create duplicate active contacts.
- Define a unique database constraint or another concurrency-safe strategy for the normalized email field.
- Test concurrent contact creation to verify that duplicate prevention works.

If soft-deleted contacts retain their email address, document how re-importing that address behaves. Do not permanently erase historical records just to reuse an address.

## 6. Campaign

### Purpose

Stores campaign configuration, content, and aggregate execution state.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | Primary identifier |
| `name` | String | Required |
| `subject` | String | Required |
| `contentType` | Enum or String | Defines editor or template mode |
| `htmlContent` | String or null | HTML content or rendered template source |
| `textContent` | String or null | Plain-text content |
| `templateKey` | String or null | Optional identifier for an approved template |
| `status` | Enum or String | Explicit campaign lifecycle state |
| `totalRecipients` | Integer | Campaign recipient snapshot count |
| `sentCount` | Integer | Count of successful SMTP acceptances |
| `failedCount` | Integer | Count of final failures |
| `createdAt` | DateTime | Required |
| `updatedAt` | DateTime | Required |
| `startedAt` | DateTime or null | Execution start time |
| `completedAt` | DateTime or null | Execution completion time |
| `archivedAt` | DateTime or null | Archive timestamp |
| `deletedAt` | DateTime or null | Optional explicit deletion timestamp |

The final implementation may use additional counters when necessary, but report definitions must remain consistent with recipient-level records.

### Campaign States

Use an explicitly validated lifecycle, such as:

- `DRAFT`
- `SENDING`
- `COMPLETED`
- `COMPLETED_WITH_FAILURES`
- `FAILED`

An interrupted campaign must have a documented recovery behavior. If an additional state is necessary, define its transitions before implementation.

### Rules

- Only drafts can be edited freely.
- A campaign must be validated before sending.
- Campaign sending must not start twice because of repeated requests.
- Archived campaigns must not be offered as ordinary active campaigns.
- Archiving must preserve recipient history and reporting.
- Permanent deletion must be explicit and must follow a documented policy.
- Historical reports must not depend on the current state of a contact.
- Store only the data necessary to render the campaign, operate it, and preserve its history.

## 7. CampaignRecipient

### Purpose

Stores a durable recipient-level record for each campaign recipient.

This collection is essential because contacts may later be archived, unsubscribed, updated, or soft-deleted.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | Primary identifier |
| `campaignId` | ObjectId | References the campaign |
| `contactId` | ObjectId or null | Optional reference to the original contact |
| `emailAtSend` | String | Historical email address used for this recipient |
| `nameAtSend` | String or null | Historical personalization name, if needed |
| `status` | Enum or String | Explicit recipient delivery state |
| `attemptCount` | Integer | Number of actual submission attempts |
| `createdAt` | DateTime | Recipient record creation |
| `updatedAt` | DateTime | Last status update |
| `lastAttemptAt` | DateTime or null | Last attempt timestamp |
| `acceptedAt` | DateTime or null | Time SMTP accepted the message |
| `failedAt` | DateTime or null | Time final failure was recorded |
| `nextAttemptAt` | DateTime or null | Optional retry timestamp |
| `lastErrorCode` | String or null | Sanitized machine-readable failure code |
| `lastErrorMessage` | String or null | Sanitized diagnostic detail |

The exact field set may be adjusted when the delivery implementation is designed.

### Recipient States

Define states that distinguish at least:

- `PENDING`
- `SENDING`
- `ACCEPTED_BY_SMTP`
- `FAILED`
- `SKIPPED`
- `UNKNOWN`

Use `UNKNOWN` or an equivalent state when the application cannot determine whether the SMTP server accepted a message.

Do not automatically treat an ambiguous outcome as a definite failure and retry it blindly.

### Historical Snapshot

At campaign start, create recipient records for the selected recipients.

Store the recipient email address used by the campaign independently of future contact updates.

The contact reference is useful for navigation and administration, but the historical record must remain meaningful if that contact is removed.

### Uniqueness

Prevent more than one recipient record for the same logical campaign recipient.

Evaluate a unique compound index for `campaignId` and `emailAtSend`, or another stable recipient identity that fits the chosen duplicate policy.

Verify how email normalization and historical addresses interact with the selected index.

## 8. AuditEvent

### Purpose

Records sensitive administrative actions when an audit trail is required.

### Suggested Fields

| Field | Type | Rules |
|---|---|---|
| `id` | ObjectId | Primary identifier |
| `actorId` | ObjectId or null | Administrator reference |
| `action` | String | Required action name |
| `entityType` | String | Affected resource type |
| `entityId` | String or null | Affected resource identifier |
| `createdAt` | DateTime | Required |
| `metadata` | JSON-compatible data or null | Sanitized non-secret details |

### Potential Events

- Administrator initialization.
- Login success or failure, subject to safe logging policy.
- Contact import.
- Campaign send initiation.
- Campaign archival.
- Backup creation or restoration.
- Sensitive configuration changes.

Never store passwords, authentication tokens, SMTP credentials, or complete sensitive request payloads in audit records.

Do not treat this collection as a substitute for secure operational logs.

## 9. Relationships

The logical relationships are:

- One administrator performs administrative actions.
- A campaign has many campaign recipient records.
- A contact can appear in many campaign recipient records.
- A campaign recipient can reference a contact, but historical recipient information must survive contact deletion.
- Audit events may reference the administrator and affected resources.

MongoDB and Prisma do not provide the same automatic referential integrity behavior as a relational database with enforced foreign keys.

Implement required relationship checks and deletion behavior explicitly in the backend.

Do not assume that removing a document automatically cascades to all related documents.

## 10. Indexing Strategy

Evaluate and create indexes that support actual queries.

### Admin

- Unique normalized username.
- Unique normalized email.

### Contact

- Unique normalized email, subject to the chosen soft-delete policy.
- Indexes for status and subscription filters where useful.
- Indexes for archive and deletion filters where useful.
- Search indexes only if the chosen search implementation requires them.

### Campaign

- Index on status and creation timestamp for campaign listings.
- Index on archive state and creation timestamp if required.

### CampaignRecipient

- Index on campaign ID and status.
- Unique compound index for campaign ID and recipient identity.
- Indexes for retry eligibility if retry scheduling is implemented.

### AuditEvent

- Index on creation timestamp.
- Index on entity type and entity ID where useful.

Avoid creating every proposed index automatically. Verify supported index definitions, query plans, and write overhead.

## 11. Pagination and Query Rules

- Default contact page size: 20.
- Enforce a maximum page size.
- Validate all filters and sort parameters.
- Use server-side pagination.
- Avoid fetching every campaign recipient to display a simple summary.
- Keep list responses limited to required fields.
- Use aggregation or stored counters only when their consistency rules are documented.
- Ensure dashboard metrics and campaign reports use consistent definitions.

For approximately 100 contacts, prefer a straightforward implementation, but keep database operations safe and efficient.

## 12. MongoDB and Prisma Implementation Notes

Before writing `schema.prisma`:

1. Inspect the installed Prisma version.
2. Verify MongoDB connector requirements.
3. Define ObjectId fields and ID mappings correctly.
4. Confirm how each relation is represented and queried.
5. Verify supported compound and unique indexes.
6. Review transaction requirements for campaign initialization and state changes.
7. Decide how the application handles partially completed multi-document operations.
8. Test schema behavior against the actual Atlas database.
9. Verify existing documents rather than relying on schema defaults to populate missing fields.
10. Document any connector limitations that affect implementation.

Do not copy a PostgreSQL or MySQL schema into this project unchanged.

## 13. Data Integrity and Recovery

- Validate state transitions in services.
- Prevent duplicate campaign execution.
- Persist recipient status changes during execution.
- Keep historical campaign records when contacts are archived or soft-deleted.
- Handle partial failures explicitly.
- Protect database backups.
- Verify backup restoration in an isolated test environment.
- Do not claim backup integrity without a successful restoration test.

## 14. Privacy and Data Minimization

- Store only contact fields required by the application.
- Restrict contact and campaign history access to the administrator.
- Never expose password hashes through APIs.
- Avoid unnecessary personal data in logs.
- Do not store SMTP credentials in the database.
- Apply the documented retention and deletion rules.
- Ensure CSV exports do not expose unintended internal fields.

## 15. Database Design Acceptance Criteria

The database design is ready for implementation when:

1. Every collection supports a documented requirement.
2. Required fields and nullable fields are defined.
3. Unique identifiers and duplicate policies are clear.
4. Campaign recipient history survives contact changes.
5. Delivery states distinguish SMTP acceptance from confirmed delivery.
6. Archiving and soft deletion have explicit behavior.
7. Indexes support actual application queries.
8. Prisma and MongoDB compatibility has been verified.
9. Partial failures and interrupted campaigns have a defined handling strategy.
10. Backup and restoration requirements are documented.
