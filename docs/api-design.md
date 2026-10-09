# MailPilot — API Design

## 1. Purpose

This document defines the REST API contract between the MailPilot frontend and backend.

The backend uses Node.js and Express. The frontend uses Next.js App Router and communicates with the backend through JSON REST endpoints.

All endpoints must comply with the project requirements, technical specification, database design, and security rules.

## 2. API Conventions

### Base URL

Development example:

`http://localhost:5000/api/v1`

The actual port and URL must be configurable through environment variables.

### Content Types

- JSON requests use `Content-Type: application/json`.
- CSV imports use `multipart/form-data`.
- CSV exports return downloadable CSV files.
- Database backups use a protected download mechanism or a documented server-side backup workflow.

### Authentication

Protected endpoints require the administrator's valid authentication cookie.

- Cookie: HttpOnly JWT cookie.
- The browser must include credentials when calling the backend.
- The frontend must not read the JWT directly.
- Do not store JWTs in localStorage or sessionStorage.
- Apply CSRF protections where required by the cookie and deployment configuration.

### Response Format

Successful JSON responses should follow a consistent structure.

Example:

```json
{
  "success": true,
  "data": {
    "id": "resource-id"
  }
}
```

Paginated responses should include pagination metadata.

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Error responses should follow a consistent structure.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": []
  }
}
```

Production responses must never expose stack traces, credentials, secrets, or internal database details.

## 3. HTTP Status Codes

Use appropriate HTTP status codes.

- `200 OK`: Successful request.
- `201 Created`: Resource created.
- `202 Accepted`: An operation was accepted for processing but has not necessarily finished.
- `204 No Content`: Successful operation with no response body, when appropriate.
- `400 Bad Request`: Malformed or invalid request.
- `401 Unauthorized`: Missing or invalid authentication.
- `403 Forbidden`: Authenticated request not permitted.
- `404 Not Found`: Resource does not exist or should not be disclosed.
- `409 Conflict`: Duplicate or incompatible state transition.
- `413 Content Too Large`: Upload exceeds the configured limit.
- `415 Unsupported Media Type`: Unsupported request format.
- `422 Unprocessable Content`: Well-formed request that fails business validation, where appropriate.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unexpected server error.
- `502 Bad Gateway` or `503 Service Unavailable`: Appropriate external service or availability failure.

Choose one consistent validation-error convention rather than mixing status codes arbitrarily.

## 4. Authentication API

All authentication endpoints must use strict validation and rate limiting.

### 4.1 Login

`POST /auth/login`

Authentication: Public endpoint, rate-limited.

Request:

```json
{
  "identifier": "admin@example.com",
  "password": "example-password"
}
```

The `identifier` field accepts either the administrator's email or username.

Responsibilities:

- Validate request fields.
- Normalize the identifier according to the documented username/email policy.
- Verify the Argon2id password hash.
- Apply login rate limits.
- Return a generic authentication failure message.
- Set the JWT in a correctly configured HttpOnly cookie.
- Never return the password hash or JWT in the JSON response.

Successful response:

```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "admin-id",
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

### 4.2 Get Current Administrator

`GET /auth/me`

Authentication: Required.

Returns the authenticated administrator's safe public fields.

### 4.3 Logout

`POST /auth/logout`

Authentication: Required.

Responsibilities:

- Clear the authentication cookie using compatible cookie options.
- Return a consistent success response.
- Apply the required CSRF protections.

### 4.4 Change Password

`POST /auth/change-password`

Authentication: Required.

Responsibilities:

- Validate the current and new passwords.
- Verify the current password.
- Hash the new password using Argon2id.
- Apply the password policy.
- Invalidate or rotate authentication state when required by the chosen security design.

Do not implement public password-reset or registration endpoints unless the requirements are explicitly changed.

## 5. Dashboard API

### 5.1 Dashboard Summary

`GET /dashboard/summary`

Authentication: Required.

Returns summary metrics, such as:

- Total active contacts.
- Subscribed contacts eligible for sending.
- Unsubscribed contacts.
- Archived contacts.
- Total campaigns.
- Draft campaigns.
- Completed campaigns.
- Failed recipient count.
- Recent campaign activity.

Metric definitions must be consistent with the database design.

Do not count SMTP acceptance as confirmed mailbox delivery.

## 6. Contacts API

All contact management endpoints require authentication.

### 6.1 List Contacts

`GET /contacts`

Supported query parameters:

- `page`
- `pageSize`
- `search`
- `status`
- `subscription`
- `archived`
- `sortBy`
- `sortOrder`

Requirements:

- Default page size: 20.
- Enforce a maximum page size.
- Validate all filters.
- Search by email or name.
- Exclude archived and soft-deleted contacts by default.
- Include archived contacts only when explicitly requested.
- Return pagination metadata.

### 6.2 Create Contact

`POST /contacts`

Request:

```json
{
  "email": "person@example.com",
  "name": "Example Person",
  "isSubscribed": true
}
```

Responsibilities:

- Validate and normalize the email.
- Validate optional fields.
- Detect existing contacts.
- Apply the documented duplicate and re-import policy.
- Return `409 Conflict` for incompatible duplicate creation.

Do not accept client-provided internal IDs or trusted system fields.

### 6.3 Get Contact

`GET /contacts/:id`

Returns the contact's permitted fields.

Apply the documented policy for archived or soft-deleted contacts.

### 6.4 Update Contact

`PATCH /contacts/:id`

Allows supported contact fields to be updated.

Responsibilities:

- Validate the resource ID.
- Validate only permitted fields.
- Prevent accidental modification of system-managed fields.
- Apply duplicate checks if the email changes.
- Preserve historical campaign recipient records.

### 6.5 Archive Contact

`POST /contacts/:id/archive`

Marks the contact as archived.

Archived contacts must not be selected for future campaigns.

### 6.6 Restore Archived Contact

`POST /contacts/:id/restore`

Restores an archived contact only if its state and eligibility are valid.

Restoring a contact must not automatically resubscribe an unsubscribed address.

### 6.7 Soft-Delete Contact

`DELETE /contacts/:id`

Performs a soft deletion according to the database design.

Responsibilities:

- Preserve historical campaign reports.
- Exclude the contact from future campaigns.
- Define how a deleted address interacts with uniqueness and re-import rules.
- Return an appropriate response when the operation is not allowed.

### 6.8 Update Subscription

`PATCH /contacts/:id/subscription`

Request:

```json
{
  "isSubscribed": false
}
```

The backend must validate the state transition and preserve the relevant subscription timestamp.

An unsubscribe must immediately exclude the contact from future sending.

## 7. CSV Import API

### 7.1 Import Contacts

`POST /contacts/import`

Authentication: Required.

Request format: `multipart/form-data`.

Field:

- `file`: CSV file.

Responsibilities:

- Validate upload size and file type.
- Parse CSV safely.
- Validate headers and rows.
- Normalize email addresses.
- Detect duplicates inside the file and against existing contacts.
- Apply the documented import policy.
- Return a detailed import report.

Example response:

```json
{
  "success": true,
  "data": {
    "totalRows": 100,
    "accepted": 85,
    "duplicates": 10,
    "invalid": 3,
    "rejected": 2,
    "errors": []
  }
}
```

Do not expose sensitive database details in row errors.

For large imports, use a controlled processing strategy with explicit limits and progress reporting if required.

### 7.2 Download Import Template

`GET /contacts/import-template`

Returns a sample CSV with supported column headers.

### 7.3 Export Contacts

`GET /contacts/export`

Authentication: Required.

Supports documented filters.

Requirements:

- Respect the same contact filtering rules as the listing endpoint.
- Use a safe CSV format.
- Prevent spreadsheet formula injection.
- Exclude internal secrets and password-related data.
- Set appropriate download headers.

## 8. Campaign API

All campaign management endpoints require authentication.

### 8.1 List Campaigns

`GET /campaigns`

Supports pagination, status filtering, search, and documented sorting.

Archived campaigns should be excluded by default unless explicitly requested.

### 8.2 Create Campaign

`POST /campaigns`

Request example:

```json
{
  "name": "October Newsletter",
  "subject": "News from MailPilot",
  "contentType": "EDITOR",
  "htmlContent": "<p>Hello {{name}}</p>",
  "textContent": "Hello {{name}}"
}
```

The exact allowed fields depend on the selected content mode.

Responsibilities:

- Validate all fields.
- Validate supported template or editor modes.
- Sanitize or safely render email content.
- Create the campaign in `DRAFT` state.
- Never start sending as a side effect of creation.

### 8.3 Get Campaign

`GET /campaigns/:id`

Returns campaign metadata, content, status, and permitted summary information.

### 8.4 Update Campaign

`PATCH /campaigns/:id`

Allows supported edits only while the campaign is in an editable state.

Reject edits that conflict with the current lifecycle state.

### 8.5 Preview Campaign

`POST /campaigns/:id/preview`

Request:

```json
{
  "sampleName": "Example Person",
  "sampleEmail": "person@example.com"
}
```

Responsibilities:

- Render HTML and plain-text previews.
- Apply supported personalization values.
- Handle missing personalization values safely.
- Never send an email as a side effect of preview generation.

Avoid returning unnecessary sensitive contact information.

### 8.6 Send Test Email

`POST /campaigns/:id/test-send`

Authentication: Required.

This endpoint sends a test message to an explicitly provided, validated test address.

During local development and automated testing, route test emails to Mailpit or use a controlled mock transport. Do not send real emails during automated tests.

Example request:

```json
{
  "testEmail": "developer@example.com"
}
```

A test send must not start the actual campaign or change its recipient statuses.

Production test-send behavior must be explicitly controlled so that it cannot be used to bypass sending restrictions.

### 8.7 Start Campaign

`POST /campaigns/:id/send`

Authentication: Required.

Request:

```json
{
  "confirm": true
}
```

Responsibilities:

- Require explicit confirmation.
- Verify the campaign exists and is in a sendable state.
- Validate subject and content.
- Select currently eligible recipients.
- Create durable recipient records.
- Prevent duplicate execution.
- Persist the campaign transition before execution begins.
- Return an operation identifier or campaign status.

Example response:

```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-id",
    "status": "SENDING",
    "totalRecipients": 100
  }
}
```

Use `202 Accepted` when execution continues after the request has been accepted.

Do not return a completed status before sending has actually completed.

### 8.8 Campaign Status

`GET /campaigns/:id/status`

Returns current campaign state and recipient counters.

Example:

```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-id",
    "status": "SENDING",
    "totalRecipients": 100,
    "pending": 40,
    "acceptedBySmtp": 55,
    "failed": 5,
    "unknown": 0
  }
}
```

The numbers above are illustrative, not actual application data.

The sum of recipient statuses must follow a documented counting rule.

### 8.9 Campaign Recipient Logs

`GET /campaigns/:id/recipients`

Supports pagination and filtering by recipient status.

Return historical recipient information and sanitized delivery details.

Do not expose credentials or raw sensitive SMTP configuration.

### 8.10 Archive Campaign

`POST /campaigns/:id/archive`

Archives a campaign without erasing its historical recipient logs.

Reject unsupported state transitions.

### 8.11 Export Campaign Report

`GET /campaigns/:id/report/export`

Returns a CSV report for the specified campaign.

Requirements:

- Require authentication.
- Use historical recipient data.
- Apply CSV formula-injection protection.
- Clearly distinguish SMTP acceptance, failures, skipped recipients, and ambiguous outcomes.

## 9. Unsubscribe API

### 9.1 Process Unsubscribe

`POST /unsubscribe`

This endpoint may be public because an email recipient must be able to unsubscribe without an administrator login.

It must use an appropriately designed, unguessable unsubscribe token or equivalent safe mechanism.

Responsibilities:

- Validate the token.
- Identify the intended subscription record.
- Apply the unsubscribe state transition.
- Record the timestamp.
- Prevent further eligible campaign sends.
- Avoid exposing unnecessary personal data.

Do not use an email address alone as an authorization token.

The final implementation must follow applicable email and privacy requirements.

### 9.2 Unsubscribe Confirmation

`GET /unsubscribe/confirm`

Displays a minimal confirmation page when appropriate.

Do not perform an irreversible unsubscribe action merely because a browser or email security scanner issues a GET request. Use a safe confirmation or standards-compatible flow that avoids accidental one-click state changes.

If implementing standards-based one-click unsubscribe, define and test its required POST behavior separately.

## 10. SMTP and Email Configuration API

SMTP credentials remain in backend environment variables in Phase 1.

Do not create an API that returns SMTP credentials or writes them to the database.

### 10.1 Check SMTP Configuration

`GET /settings/email/status`

Authentication: Required.

Returns non-secret configuration status, such as:

- Whether SMTP configuration is present.
- Whether a connection test succeeded.
- The time of the last test, if recorded.
- A sanitized failure description.

Never return passwords, tokens, or complete connection strings.

### 10.2 Test SMTP Connection

`POST /settings/email/test-connection`

Authentication: Required.

Performs a controlled connectivity or transport verification.

Do not send to a real recipient unless a separate, explicit test-send operation is requested and allowed by the environment.

## 11. Backup API

Database backups must use a recoverable MongoDB-compatible backup method.

### 11.1 Start Backup

`POST /admin/backups`

Authentication: Required.

Responsibilities:

- Verify the administrator.
- Validate that the operation is permitted.
- Start or execute the documented backup workflow.
- Record the operation outcome.
- Protect generated backup files.

Return an operation status without exposing backup credentials.

### 11.2 Backup Status

`GET /admin/backups/:id`

Returns the backup operation status and safe metadata.

### 11.3 Download Backup

`GET /admin/backups/:id/download`

Authentication: Required.

Apply strict access checks and avoid exposing publicly accessible backup URLs.

The implementation may use a different safe download mechanism if direct downloads are incompatible with the selected backup tool.

### 11.4 Restore Backup

`POST /admin/backups/:id/restore`

This is a high-risk administrative operation.

Do not implement restoration as an unrestricted one-click action.

Require explicit confirmation, suitable safeguards, and a documented recovery procedure. Verify the selected backup and the target environment before restoration.

Never test destructive restoration against production data.

## 12. Health Endpoint

### Health Check

`GET /health`

May be public if it returns only minimal service availability information.

Do not disclose environment variables, database credentials, detailed infrastructure topology, or sensitive diagnostic data.

Database and SMTP diagnostics should be exposed only through appropriately protected operational interfaces.

## 13. Input Validation

Use Zod to validate:

- Request bodies.
- Query parameters.
- Resource identifiers.
- CSV uploads.
- Campaign content and supported template inputs.
- Pagination and sorting.
- Unsubscribe tokens.
- Administrative operation requests.

Reject unexpected fields where appropriate.

Do not rely on frontend validation alone.

Validate uploaded content independently of the filename and MIME type.

## 14. Rate Limiting and Abuse Prevention

Apply suitable limits to:

- Login attempts.
- Public unsubscribe requests.
- Test email operations.
- CSV uploads.
- Campaign execution requests.
- Expensive exports and backup operations.

Limits must be configurable where appropriate.

Prevent duplicate campaign execution and repeated operations caused by network retries or multiple clicks.

## 15. Concurrency and Campaign Execution

The campaign send endpoint must not directly perform an uncontrolled amount of synchronous work within the HTTP request.

Phase 1 does not include Redis or BullMQ. Use a controlled execution service with persisted state.

The design must define:

- How the campaign is claimed for execution.
- How concurrent send requests are rejected.
- How recipient states are persisted.
- How process interruption is detected.
- How ambiguous SMTP outcomes are handled.
- How retry limits are enforced.
- How interrupted campaigns are recovered or marked for administrator review.

Use atomic database operations or another verified concurrency-control mechanism where supported.

Do not assume a process-local variable is sufficient to prevent duplicate execution across multiple backend instances.

## 16. API Documentation and Testing

Keep the implementation aligned with this document.

For each endpoint, test:

- Valid requests.
- Invalid payloads.
- Missing authentication.
- Invalid authentication.
- Unauthorized access.
- Missing resources.
- Conflicting state transitions.
- External service failures.
- Relevant rate limits.
- Duplicate request behavior.

Email tests must use Mailpit or a controlled mock transport.

Do not claim endpoints exist until they have been implemented and tested.

## 17. API Design Acceptance Criteria

The API design is ready for implementation when:

1. All required workflows have documented endpoints.
2. Authentication and authorization requirements are clear.
3. Request and response formats are consistent.
4. Validation and error conventions are defined.
5. CSV import and export behavior is specified.
6. Campaign sending has explicit confirmation and duplicate-execution protection.
7. SMTP acceptance is distinguished from confirmed delivery.
8. Unsubscribe behavior is secure.
9. Backup and restore operations have appropriate safeguards.
10. Automated tests can verify the documented contract.
