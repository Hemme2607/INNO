import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard-page-shell";

export default async function InboxPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/inbox");
  }

  return <DashboardPageShell />;
}
