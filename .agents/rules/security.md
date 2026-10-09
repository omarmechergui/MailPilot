---
trigger: always_on
---

# MailPilot — Security Rules

## 1. Security Principles

- Security is a requirement for every feature, not a final polishing step.
- Apply defense in depth.
- Never trust client-provided data.
- Enforce authorization on the backend.
- Follow the principle of least privilege.
- Do not expose secrets, sensitive personal data, or internal implementation details.
- Review security implications before adding dependencies or changing authentication behavior.

## 2. Authentication

- MailPilot has one administrator account in Phase 1.
- Public registration is disabled.
- Login accepts either email or username and a password.
- Hash passwords using Argon2id with appropriate library defaults and secure parameters.
- Never store or log plaintext passwords.
- Compare submitted passwords against stored hashes using the password-hashing library.
- Use JWTs with a strong, private signing secret loaded from backend environment configuration.
- Validate token signature, expiration, and expected claims.
- Reject missing, malformed, expired, or invalid tokens.
- Do not store JWTs in localStorage or sessionStorage.
- Store authentication tokens in HttpOnly cookies.
- Configure cookie properties appropriately:
  - HttpOnly enabled.
  - Secure enabled in HTTPS production environments.
  - An appropriate SameSite policy.
  - Explicit expiration and path.
- Clear the authentication cookie on logout.
- Do not expose administrator credentials in frontend code, API responses, logs, or documentation.

## 3. Initial Administrator Setup

- Do not implement public registration.
- Provide a safe, documented initial administrator setup mechanism.
- Do not hardcode an administrator username or password.
- Do not create a publicly accessible endpoint that can promote arbitrary users to administrator.
- Ensure the initial setup cannot silently overwrite an existing administrator account.
- Validate and securely hash the initial password.
- Keep bootstrap credentials out of source control and logs.
- Require an explicit, controlled setup procedure.

## 4. Authentication Abuse Protection

- Apply rate limiting to login attempts.
- Validate login inputs before performing database lookups.
- Use generic login failure messages that do not reveal whether an email or username exists.
- Avoid account enumeration through noticeably different responses.
- Use reasonable request size and timeout limits.
- Record relevant security events without logging credentials or tokens.
- Do not permanently lock the administrator out through an easily abused mechanism.

## 5. Authorization

- Require authentication for all administrative operations.
- Check permissions on the backend, even if the frontend hides or disables controls.
- Do not trust user IDs, campaign IDs, or contact IDs supplied by the client without checking access.
- Protect campaign creation, sending, archiving, deletion, exports, and backups.
- Prevent unauthorized changes to SMTP settings or administrator credentials.
- Do not expose internal administrative functions through unprotected endpoints.

## 6. Cookies, CSRF, and CORS

- Review the complete cookie authentication flow before deployment.
- Configure CORS with explicitly permitted frontend origins.
- Do not combine credentialed requests with unrestricted wildcard origins.
- Use an appropriate CSRF defense for cookie-authenticated state-changing requests.
- Validate Origin or Referer where appropriate as an additional defense, not as the only protection.
- Configure SameSite, Secure, and credentialed requests consistently with the deployment topology.
- Do not disable browser security controls to make development requests work.

## 7. Input Validation and Injection Prevention

- Validate all request bodies, parameters, query strings, and imported data with Zod.
- Apply sensible limits to strings, arrays, file sizes, and record counts.
- Avoid dynamically constructed database filters from untrusted input.
- Use Prisma's supported query APIs rather than unsafe query construction.
- Escape or safely render personalized content in email templates.
- Do not treat HTML sanitization as a replacement for context-aware output encoding.
- Reject unexpected fields where appropriate.
- Handle malformed JSON, CSV files, and invalid template data safely.

## 8. Contact Data Protection

- Collect and store only the information required by the application.
- Treat email addresses and contact details as personal data.
- Never send to unsubscribed, archived, invalid, or otherwise ineligible contacts.
- Enforce unsubscribe status on the backend immediately before sending.
- Do not rely on a frontend filter to prevent ineligible recipients.
- Restrict contact exports to the authenticated administrator.
- Avoid exposing contact lists in public endpoints.
- Preserve campaign history without unnecessarily duplicating personal information.
- Consider data minimization when retaining long-term logs.

## 9. CSV Import and Export

- Limit uploaded file size and row count.
- Validate file format, headers, encoding, and row contents.
- Do not trust a file extension alone to establish that a file is valid.
- Reject or safely handle malformed input.
- Prevent CSV formula injection in exported files by handling cells that could be interpreted as spreadsheet formulas.
- Avoid exporting secrets, authentication data, SMTP settings, or unnecessary internal fields.
- Protect exported files from unauthorized access.
- Return row-level import errors without revealing sensitive internal details.

## 10. Email and SMTP Security

- Store SMTP credentials exclusively in backend environment configuration or an approved secrets manager.
- Never expose SMTP credentials to the browser.
- Do not commit real credentials to Git.
- Use TLS according to the SMTP provider's supported configuration.
- Validate SMTP configuration before attempting delivery.
- Restrict sender addresses to configured and approved values.
- Validate recipient addresses and enforce campaign eligibility before sending.
- Require explicit campaign confirmation.
- Protect against duplicate or concurrent campaign execution.
- Apply bounded retries only where retrying is safe.
- Do not automatically retry uncertain outcomes that could cause duplicate delivery.
- Never send real messages from automated tests.
- Use Mailpit for local email testing.

## 11. Email Content and Personalization

- Treat contact names and other personalization values as untrusted input.
- Render templates using safe React Email patterns.
- Escape text values according to the output context.
- Validate template variables and provide safe behavior for missing values.
- Do not allow personalization data to inject arbitrary HTML into trusted templates.
- Avoid exposing other recipients' addresses through shared recipient headers.
- Send individual messages or otherwise ensure recipients cannot see one another's addresses.
- Provide an unsubscribe mechanism appropriate to the campaign and legal requirements before sending real bulk email.

## 12. Secrets and Environment Configuration

- Keep `.env` files out of version control.
- Commit only example configuration files with placeholder values.
- Validate required environment variables during startup.
- Fail safely when critical secrets are missing or invalid.
- Do not print environment variables to logs.
- Keep separate configuration for development and production.
- Do not use a weak fallback JWT secret in production.
- Rotate exposed credentials immediately.
- Avoid embedding secrets in build-time frontend configuration.

## 13. Error Handling and Logging

- Return safe, understandable error responses.
- Do not expose stack traces, filesystem paths, raw database errors, credentials, or tokens in production responses.
- Do not log passwords, JWTs, cookies, SMTP authentication payloads, or full secret-bearing configuration.
- Limit sensitive personal data in logs.
- Protect log and backup access.
- Keep sufficient non-sensitive diagnostic information for troubleshooting.
- Do not report a successful operation if its outcome is unknown.

## 14. Database and Backup Security

- Restrict database access to the necessary application credentials and permissions.
- Never expose database connection strings to the frontend.
- Avoid destructive database operations without explicit approval.
- Protect backup files as sensitive data.
- Do not place backups in a publicly served directory.
- Verify backup completeness and document restoration limitations.
- Ensure backup failure is reported accurately.
- Do not claim that a backup can be restored unless restoration has been verified.

## 15. Dependency and Deployment Security

- Prefer maintained, reputable packages.
- Review dependency risks before adding packages.
- Keep dependencies updated through a controlled process.
- Do not ignore security advisories without assessment.
- Use HTTPS in production.
- Configure production cookies, CORS, environment variables, and database access explicitly.
- Keep development-only services such as Mailpit inaccessible to the public internet.
- Do not expose debug endpoints or development credentials in production.

## 16. Security Verification

Before completing a feature, verify the relevant checks:

- Unauthenticated access is rejected.
- Unauthorized actions are rejected.
- Input validation cannot be bypassed by direct API requests.
- Secrets are not returned or logged.
- Unsubscribed and archived contacts are excluded from campaign execution.
- Duplicate campaign execution is prevented.
- CSV exports are protected against formula injection.
- Errors do not leak internal details.
- Relevant tests have been executed and their actual results recorded.

Do not claim the application is completely secure based only on passing tests. Report the scope and limitations of security verification.