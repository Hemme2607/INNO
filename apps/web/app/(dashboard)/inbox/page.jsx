import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InboxPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/inbox");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-6">
    
    </main>
  );
}
