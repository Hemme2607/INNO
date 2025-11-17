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
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-2">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
