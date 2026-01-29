import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { auth, clerkClient } from "@clerk/nextjs/server";

function mapClerkUser(user) {
  if (!user) return null;
  return {
    name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Bruger",
    email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "",
    avatar: user.imageUrl ?? "/avatars/shadcn.jpg",
  };
}

// Dashboard-layout henter Clerk-bruger til sidebar/header og wrapper børnene i sidebar/provider
export default async function DashboardLayout({ children }) {
  const { userId } = await auth();
  let sidebarUser = null;
  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    sidebarUser = mapClerkUser(user);
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
