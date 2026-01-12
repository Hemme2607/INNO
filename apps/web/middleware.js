import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const landingOnly = process.env.NEXT_PUBLIC_LANDING_ONLY === "true";
const publicRoutes = landingOnly
  ? ["/", "/api/landing-signups(.*)", "/api/outlook/webhook(.*)"]
  : ["/", "/sign-in(.*)", "/sign-up(.*)", "/api/landing-signups(.*)", "/api/outlook/webhook(.*)"];
const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware((auth, request) => {
  if (landingOnly) {
    const { pathname } = request.nextUrl;
    const isLandingOnly =
      pathname === "/" ||
      pathname.startsWith("/api/landing-signups") ||
      pathname.startsWith("/api/outlook/webhook");
    if (!isLandingOnly) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
