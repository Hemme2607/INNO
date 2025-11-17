import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";



export default async function AgentPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/agent");
  }

  return (
    <main className="px-4 py-6 lg:px-10 lg:py-8 space-y-6">
     
    </main>
  );
}
