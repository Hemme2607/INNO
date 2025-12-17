## For at køre app på mobil
- opret en .env i mappen mobile og indsæt nøglerne fra bilag 15

## For at køre app på web
- opret en .env.local i mappen web og indsæt nøglerne fra bilag 16

## Kom i gang
1. Kør `npm install` i roden for at installere alle workspaces (eller `cd apps/mobile && npm install` hvis du kun vil opdatere mobilappen).
2. Kør `npm start` inde fra mobile for at køre mobilversionen
3. Kør `npm run dev` inde fra web for at køre webversionen

Fælles Clerk- og Supabase-konfiguration findes i `shared/`, så web og mobil deler samme nøgler og databaseadgang.

## Hvorfor Deno bliver anvendt?
- Supabase Edge Functions kører på Deno i stedet for Node.js.

## Hvorfor Supabase Edge Functions?
- Ligger tæt på vores Supabase DB, så dataopslag og AI-kald er hurtige.
- Vi kan bruge samme auth (Clerk/Supabase) som mobilappen uden at bygge en ny backend.
- Nemt at deploye via Supabase CLI, og functions kører isoleret fra mobil/web builds.
- Godt til webhooks/integrationer (Gmail/Outlook/Shopify/Freshdesk), så mobilappen kan forblive simpel.
