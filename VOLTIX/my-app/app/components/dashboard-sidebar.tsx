"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  Search,
  Settings,
  Zap,
  Home,
  Info,
  Phone,
  Download,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = async () => {
    try {
      const tokenRow = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="));
      const token = tokenRow ? tokenRow.split("=")[1] : null;

      if (token) {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      // Clear the cookie
      document.cookie =
        "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/");
    }
  };

  const sidebarItems = [
    {
      title: "Home",
      icon: <Home className="h-4 w-4" />,
      url: "/",
    },
    {
      title: "About Us",
      icon: <Info className="h-4 w-4" />,
      url: "/about",
    },
    {
      title: "Contact Us",
      icon: <Phone className="h-4 w-4" />,
      url: "/contact",
    },
    {
      title: "Download App",
      icon: <Download className="h-4 w-4" />,
      url: "/download",
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold">VOLTIX</h2>
            <p className="text-muted-foreground text-xs">AI Control Center</p>
          </div>
        </div>

        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search..."
              className="bg-muted w-full rounded-2xl py-2 pr-4 pl-9"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="rounded-2xl">
                    <Link
                      href={item.url}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="rounded-2xl">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32"
                      alt="User"
                    />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <span>Ali Imam</span>
                </div>
                <Badge variant="outline">Pro</Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
