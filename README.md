# INNO monorepo

Det her repository er nu bygget som et lille workspace med en `apps`-mappe. Hver app lever i sin egen undermappe, så vi kan have både mobil og web sammen uden at blande deres konfigurationer.

## Struktur
- `apps/mobile` – den eksisterende Expo/React Native app (Android/iOS/Web via Expo)
- `apps/web` – Next.js-baseret webapp med dashboard, agent- og integration-sider bygget med Shadcn/Tailwind komponenter
- `assets` – fælles billeder/ikoner der kan genbruges af både web og mobil
- `supabase` – Edge Functions og databasedefinitioner der ikke er bundet til en bestemt app
- `shared` – konfigurationer og kode der skal bruges af flere apps (fx Clerk/Supabase opsætning)

## Kom i gang
1. Kør `npm install` i roden for at installere alle workspaces (eller `cd apps/mobile && npm install` hvis du kun vil opdatere mobilappen).
2. Brug scripts fra roden til at starte apps:
   - `npm run mobile` (Expo start)
   - `npm run mobile:android`
   - `npm run mobile:ios`
   - `npm run mobile:web`
   - `npm run web` (Next.js dev-server)
   - `npm run web:build`
   - `npm run web:start`
3. Miljøvariabler ligger pr. app (`apps/mobile/.env`, `apps/web/.env.local`).

Fælles Clerk- og Supabase-konfiguration findes i `shared/`, så web og mobil deler samme nøgler og databaseadgang.
