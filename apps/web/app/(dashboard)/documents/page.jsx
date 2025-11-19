import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export default async function DocumentPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/documents");
  }

  return (
    <main className="px-4 py-6 lg:px-10 lg:py-8 space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Documents
          </p>
          <h1 className="text-3xl font-semibold">Upload dine dokumenter til Sona</h1>
        </div>
      </header>
    </main>
  );
}