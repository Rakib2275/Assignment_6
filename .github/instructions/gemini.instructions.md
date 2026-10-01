---
description: "Use when adding, changing, or debugging Google Gemini API, Gemini SDK, or generative AI integration in this TypeScript backend."
---
# Gemini Integration

- There is currently no Gemini SDK or integration in `src` or `package.json`. Do not imply Gemini is already configured.
- `src/app/lib/googleAuth.ts` uses `google-auth-library` for Google OAuth login; it is not a Gemini client.
- Before adding a dependency, confirm the requested Gemini behavior and choose a supported Google Gen AI SDK compatible with this project.
- Keep Gemini requests on the server. Read credentials from environment variables through `src/app/config/index.ts`; never commit or return credentials, and avoid logging prompts or personal data.
- Do not send user or customer data to Gemini unless the requested feature requires it; minimize data sent and follow the product's privacy requirements.
- Follow the existing module structure under `src/app/module/`: validation with Zod, request validation middleware and route authorization, controller response handling, and business logic in a service. Register new routes in the existing app/router setup.
- Treat the checked-in implementation as the current source of truth. `Project Requirements.md` describes a healthcare system and explicitly says implementation is behind; reconcile requirements with the actual load-shedding code before changing product behavior.
- Validate changes with `npm run build`. `npm test` is a placeholder that exits with an error; use `npm run lint:check` and `npm run format:check` for the existing static checks.