"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, MoreHorizontalIcon, ShareIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavNewsletter({
  items
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()

  const linkActive = (url) =>
    pathname === url || pathname.startsWith(`${url}/`);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Newsletter</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className={cn(
                "justify-start",
                linkActive(item.url) &&
                  "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Link href={item.url} className="flex w-full items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover className="rounded-sm data-[state=open]:bg-accent">
                  <MoreHorizontalIcon />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}>
                <DropdownMenuItem>
                  <FolderIcon />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShareIcon />
                  <span>Share</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
