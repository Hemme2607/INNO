# INNO webapp

Next.js-baseret web-ui bygget med Tailwind + Shadcn/TailArk komponenter, nu med Clerk-login.

## Kom i gang
1. `npm install` i repo-roden (installerer begge workspaces) – kræver adgang til npm registry.
2. Kopiér `.env.local.example` til `.env.local` hvis du vil bruge dine egne Clerk-nøgler (de kan deles med mobilappen via `shared/clerk`).
3. Start udviklingsserveren:
   ```bash
   npm run web
   ```
4. Byg til production:
   ```bash
   npm run web:build && npm run web:start
   ```

## Miljøvariabler
| Navn | Beskrivelse |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Del samme nøgle som mobilappen så login matcher. |
| `CLERK_SECRET_KEY` | Bruges af `clerkMiddleware` til server-side verificering. |
| `NEXT_PUBLIC_CLERK_FRONTEND_API` | Valgfrit, hvis du bruger custom Clerk domain. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL til Supabase-projektet (kan deles med Expo). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key til Supabase (samme som mobilen bruger). |

## Tilgængelige sider
- `/dashboard` – samme demo-boards som mobilens overview.
- `/agent` – persona, automation og knowledge base.
- `/integrations` – Shopify/Gmail/Outlook status og workflows.
- `/inbox` – (placeholder) webversion af indbakken.

## Shadcn UI (JSX)
- CLI er allerede initialiseret – tilføj nye komponenter med:
  ```bash
  cd apps/web
  npx shadcn@latest add <component-navn>
  ```
- Komponenter genereres som `.jsx` og eksporteres via `@/components/ui/*`.
- Brug `cn` helperen (`@/lib/utils`) for at kombinere klasser når du bygger egne komponenter.
