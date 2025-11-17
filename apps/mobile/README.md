Link til videogennemgang: [https://www.loom.com/share/e95f8c2a52ef4f4ebddf6945bee9d96c](https://www.loom.com/share/79072bcd832d4f08b6e7c7078bca20c2?sid=7549b123-8618-4a9d-9764-5c44f5fc4cd1&fbclid=IwY2xjawNi9m1leHRuA2FlbQIxMABicmlkETAzRHlCMkdscEczQlVyaFg4AR6qMkh0vZJ_EoghIIDXbpgJKaqSHRJbyfmI2KNmaVkVLmWApk_FWRXERhN2eg_aem_ictz2-PBpptJfed334ZDSg)


Link til Github: [https://github.com/Hemme2607/GK1](https://github.com/Hemme2607/INNO/)


Guide til at starte appen (kør fra `apps/mobile`):
1. `npm install`
2. `npx expo start` eller `npm run start`
3. `npm run web` hvis du vil starte den webbaserede udgave (Expo Web åbner i browseren)

Webopsætning:
- Sørg for at `.env` indeholder `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_CLERK_FRONTEND_API`, `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Token- og sessions bliver nu gemt i SecureStore på mobil og AsyncStorage i browseren, så du kan genbruge login både på web og i appen
- Ikoner/billeder ligger i roden under `assets/`, som Expo får adgang til via workspace-konfigurationen (`metro.config.js`)


Hvem der har lavet hvad:
- Oliver = Homescreen.js og inboxscreen.js
- Philip = IntegrationScreen.js og ProfileScreen.js
- Cornelius = LoginComponent.js og SignUpComponent.js
- Jonas = Clerk-config.js og AuthScreen.js (implmenteret clerk)
- Vi alle har bidraget til styles og app.js
