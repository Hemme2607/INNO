# Clerk Setup Guide for Expo

## 1. Clerk Dashboard Konfiguration

### OAuth Redirect URLs
I din Clerk Dashboard, under "OAuth Applications", tilføj disse redirect URLs:

**Development:**
- `gk1://oauth/callback` (for Expo development)
- `exp://localhost:8081/--/oauth/callback` (for Expo Go)
- `exp://192.168.x.x:8081/--/oauth/callback` (for fysisk device)

**Production:**
- `gk1://oauth/callback` (for production builds)

### Allowed Origins
Tilføj disse origins:
- `exp://localhost:8081`
- `exp://192.168.x.x:8081` (din lokale IP)
- `gk1://` (din app scheme)

## 2. Environment Variables

Din `.env` fil skal indeholde:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_din_key_her
```

## 3. Test Authentication

1. Start din app: `npm start`
2. Åbn Expo Go app på din telefon
3. Scan QR koden
4. Test login/signup funktionalitet

## 4. Troubleshooting

### Hvis OAuth ikke virker:
- Tjek at redirect URLs er korrekte i Clerk Dashboard
- Sørg for at din app scheme (`gk1://`) matcher
- Genstart Expo development server efter ændringer

### Hvis du får "Invalid redirect URL":
- Tjek at din IP adresse er korrekt i redirect URLs
- Sørg for at bruge `exp://` protokol for development
