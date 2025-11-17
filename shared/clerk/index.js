const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  null;

const frontendApi =
  process.env.EXPO_PUBLIC_CLERK_FRONTEND_API ??
  process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ??
  null;

export const CLERK_PUBLISHABLE_KEY = publishableKey;
export const CLERK_FRONTEND_API = frontendApi;

export function buildBaseClerkConfig(overrides = {}) {
  return {
    publishableKey,
    ...(frontendApi ? { frontendApi } : {}),
    isSatellite: false,
    domain: undefined,
    ...overrides,
  };
}
