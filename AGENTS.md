# Attribution policy

Never attribute work or communications to Codex, an AI agent, or another AI system. This applies to commit authorship and messages, branch names, pull requests, code comments, signatures, trailers, and any other communication. Use task- or project-based wording and the repository's configured human authorship. Do not add AI credits, co-author lines, generated-by labels, or AI-identifying prefixes.

# Project guidance

## General practices

- Read the relevant code and configuration before changing them. Keep changes focused, follow nearby conventions, and preserve unrelated work in the checkout.
- Keep TypeScript types explicit at application and API boundaries. Avoid introducing `any`; use domain types, DTOs, and narrow types where possible.
- Keep secrets, credentials, personal data, and production data out of source files, logs, commits, and examples. Use the existing environment configuration.
- Update the relevant package manifest and lockfile together when changing dependencies. Keep Angular packages on compatible versions and check framework peer requirements before crossing major versions.
- For meaningful code changes, run the relevant build, lint, and tests when available. Review generated changes and the final diff; the API lint script uses `--fix` and can modify files.

## App (`app/`)

- This is a standalone Angular application using Ionic and Capacitor. Follow the standalone component and provider patterns already in use; use Ionic standalone components from `@ionic/angular/standalone` where appropriate.
- Keep presentation in components and templates, and put reusable API access or business logic in services. Keep route definitions in the existing route files and use the established lazy-loading patterns.
- Preserve mobile behavior, accessibility, and responsive layouts. Use Capacitor plugins for native device capabilities and account for web/browser execution where a plugin is unavailable.
- Keep HTTP calls typed and use the configured interceptors. Do not duplicate authentication or error handling in individual components when the shared services/interceptors already cover it.

## API (`api/`)

- This is a NestJS API backed by MongoDB and Mongoose. Follow the existing feature-module layout: controllers handle HTTP routing, services hold business logic, DTOs define request validation, and schemas define persisted documents.
- Validate incoming data with DTOs and the existing validation pipe. Protect private routes with the existing authentication guard, and scope user-owned reads and writes to the authenticated user's ID.
- Keep API changes compatible with the app's existing `/v1` contracts unless the task explicitly includes a coordinated contract change. Update Swagger decorators when endpoint behavior or request/response shapes change.
- Use the existing configuration service for environment values. Handle external service and database failures explicitly; do not log secrets or sensitive payloads.
- Add or update focused unit and end-to-end coverage for changed behavior when requested or appropriate. Use the existing Jest setup and avoid weakening validation or lint rules to silence errors.
