---
trigger: always_on
---

# MailPilot — Coding Standards

## 1. General Principles

- Prioritize readable, maintainable, and predictable code.
- Prefer simple solutions over unnecessary abstractions.
- Follow the existing project structure and conventions.
- Inspect relevant files before modifying them.
- Avoid unrelated refactoring.
- Do not duplicate business logic across routes, controllers, services, and UI components.
- Do not introduce dependencies without a clear technical reason.
- Keep functions focused on one responsibility.

## 2. JavaScript Only

- Use JavaScript and JSX throughout the application.
- Do not create TypeScript files.
- Do not introduce TypeScript types, interfaces, or compiler configuration.
- Use `.js` for JavaScript and `.jsx` for React components when appropriate.
- Follow the module system configured for each package.
- Do not mix CommonJS and ES modules inconsistently.
- Use `async/await` for asynchronous operations where it improves clarity.
- Handle rejected promises explicitly.

## 3. Naming Conventions

Use descriptive, consistent names.

- Variables and functions: `camelCase`.
- React components: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for true application-wide constants.
- React component files: consistent `PascalCase.jsx` naming where appropriate.
- Backend service files: descriptive names such as `campaign.service.js`.
- Validation files: descriptive names such as `campaign.schema.js`.
- Test files: follow the test runner's established naming convention.

Prefer names that communicate intent. Avoid unclear abbreviations and single-letter names outside simple loops or mathematical contexts.

## 4. Frontend Standards

- Use Next.js App Router conventions.
- Keep route pages focused on composition and routing.
- Extract reusable UI into components.
- Group feature-specific components and logic logically.
- Use Server Components by default when appropriate.
- Add Client Components only when interactivity, browser APIs, or client-side state requires them.
- Keep API communication in reusable frontend modules.
- Do not place secret values in frontend environment variables.
- Do not duplicate backend business rules in the UI.
- Use controlled form inputs where appropriate.
- Display clear loading, empty, success, and error states.
- Use semantic HTML and accessible labels.
- Avoid unnecessary global state.
- Avoid excessive animations and unnecessary visual effects.

## 5. Styling Standards

- Use Tailwind CSS consistently.
- Follow the established design system and reusable component patterns.
- Maintain consistent spacing, typography, borders, and status colors.
- Support Light Mode only in Phase 1.
- Keep the interface in English.
- Avoid arbitrary styling values when an existing design token or utility is suitable.
- Avoid duplicated and conflicting CSS rules.
- Do not introduce another styling framework without explicit approval.
- Keep layouts responsive and usable on desktop and smaller screens.

## 6. Backend Organization

Keep responsibilities separated:

- Routes define HTTP endpoints.
- Middleware handles authentication, authorization, validation integration, and cross-cutting concerns.
- Controllers coordinate requests and responses.
- Services contain business logic.
- Validators define request schemas using Zod.
- Database access uses Prisma.
- Utility modules contain genuinely reusable helper functions.
- Configuration modules validate and expose environment configuration.

Do not put complex business logic directly in route definitions.

Do not allow controllers to become large collections of unrelated database operations.

## 7. Validation

- Validate all untrusted backend input using Zod.
- Validate request bodies, query parameters, route parameters, and imported CSV data.
- Apply appropriate length, format, and range limits.
- Normalize email addresses consistently before comparison and persistence.
- Do not rely solely on frontend validation.
- Return understandable validation errors without exposing internal details.
- Do not silently accept malformed input.

## 8. Error Handling

- Use `try/catch` where errors can be handled meaningfully.
- Forward unexpected Express errors to centralized error middleware.
- Do not swallow errors silently.
- Do not return fake success responses.
- Avoid exposing stack traces in production responses.
- Preserve useful internal diagnostic information while excluding secrets.
- Use consistent HTTP status codes and response shapes.
- Distinguish expected business errors from unexpected infrastructure errors.

## 9. Database Standards

- Use Prisma for application database operations.
- Keep database queries understandable and appropriately scoped.
- Avoid unnecessary queries and repeated lookups.
- Use pagination for list endpoints.
- Select only the fields needed for each operation.
- Handle missing records explicitly.
- Consider unique constraints and concurrent requests when preventing duplicate contacts or campaign execution.
- Respect MongoDB and Prisma connector limitations.
- Do not modify existing records with bulk scripts without reviewing the impact and providing a safe execution plan.
- Never reset the database to solve an ordinary development problem.

## 10. Authentication and Secrets

- Hash passwords using Argon2id.
- Keep authentication and authorization checks on the backend.
- Store JWTs in appropriately configured HttpOnly cookies.
- Never store passwords, SMTP credentials, or JWT secrets in source code.
- Never place secrets in client-exposed environment variables.
- Do not log passwords, tokens, or SMTP credentials.
- Validate required environment variables during backend startup.
- Keep `.env` files excluded from Git.
- Provide a safe example environment file containing placeholder values only.

## 11. Email Service Standards

- Keep SMTP operations in dedicated backend services.
- Render email templates separately from campaign orchestration.
- Provide both HTML and plain-text content.
- Escape or safely render personalized user data.
- Validate template variables and handle missing values predictably.
- Do not allow arbitrary user-provided HTML to bypass the application's rendering and safety rules.
- Use Mailpit for development and automated tests.
- Record actual sending outcomes.
- Do not equate SMTP acceptance with inbox delivery.
- Apply bounded retries only to failures that are safe to retry.
- Avoid duplicate sends when the outcome of an SMTP operation is uncertain.

## 12. Logging

- Log relevant errors and important campaign state transitions.
- Include enough context to investigate failures.
- Avoid logging secrets or unnecessary personal information.
- Keep campaign and attempt identifiers where useful.
- Do not log entire CSV files or email contents by default.
- Ensure log messages distinguish attempts, accepted messages, failures, and confirmed provider events.

## 13. Testing Standards

- Write tests for important business rules and security boundaries.
- Test success paths and failure paths.
- Test authentication and authorization.
- Test contact validation, duplicate detection, and unsubscribe exclusion.
- Test CSV import and export edge cases.
- Test campaign confirmation and duplicate execution prevention.
- Test retry behavior and uncertain SMTP outcomes.
- Use Mailpit or a controlled test transport instead of real recipients.
- Never claim tests passed unless they were actually executed.
- Do not weaken or delete tests simply to obtain a passing result.

## 14. Code Review Checklist

Before completing a task, verify:

- The implementation matches the requirement.
- Existing functionality has not been unintentionally changed.
- Input validation exists on the backend.
- Authorization is enforced where required.
- Secrets are not exposed.
- Errors are handled appropriately.
- Database access is safe and efficient.
- Important success and failure paths are tested.
- Documentation reflects the actual behavior.
- No unnecessary dependencies or unrelated changes were added.

## 15. Completion Report

After implementation, provide:

1. A concise summary of the changes.
2. The files created or modified.
3. The commands and tests executed.
4. The actual results of those tests.
5. Any unresolved issues or limitations.
6. The recommended next step.


## 16. Package Manager and Commands

- Use pnpm exclusively for dependency management and package scripts.
- Use `pnpm install` to install dependencies.
- Use `pnpm add <package>` for production dependencies.
- Use `pnpm add -D <package>` for development dependencies.
- Use `pnpm remove <package>` to remove dependencies.
- Use `pnpm exec <command>` for local CLI tools.
- Do not use npm, Yarn, or Bun to install or manage project dependencies.
- Do not create competing lockfiles.
- Keep the relevant `pnpm-lock.yaml` synchronized with dependency changes.
- Run scripts from the correct package directory.
- Inspect each package's `package.json` before choosing a test, lint, or build command.
- Do not invent scripts that do not exist.
- If frontend and backend have separate package files, run commands in the appropriate directory.
- If a pnpm workspace is introduced later, document its structure and use the workspace consistently.