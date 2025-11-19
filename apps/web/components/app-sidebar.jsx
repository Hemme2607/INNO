"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BookOpenIcon,
  BotIcon,
  CableIcon,
  ClipboardListIcon,
  FileIcon,
  HelpCircleIcon,
  InboxIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UserRoundPenIcon,
  WorkflowIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { SignOutButton } from "@clerk/nextjs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Dummy data så hele TailArk sidebar-komponenten kan vises i Next.
const baseData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: InboxIcon,
    },
    {
      title: "Agent",
      url: "/agent",
      icon: BotIcon,
      children: [
        {
          title: "Persona",
          url: "/agent/persona"
        },
        {
          title: "Automation",
          url: "/agent/automation"
        },
        {
          title: "Knowledge",
          url: "/integrations/knowledge"
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Integrations",
      url: "/integrations",
      icon: CableIcon,
    },
    {
      name: "Documents",
      url: "/documents",
      icon: FileIcon,
    }
  ],
}

export function AppSidebar({
  user,
  ...props
}) {
  const data = {
    ...baseData,
    user: user ?? baseData.user,
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Sona.ai</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
