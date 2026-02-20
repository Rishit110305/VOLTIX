"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cloud,
  MessageSquare,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import NotificationBell from "@/app/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  notifications?: number;
}

export function DashboardHeader({ notifications = 5 }: DashboardHeaderProps) {
  const { setTheme, theme } = useTheme();
  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-16 items-center gap-3 border-b px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome User !</h1>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl">
                  <Cloud className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cloud Storage</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Messages</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <NotificationBell />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Theme</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Avatar className="border-primary h-9 w-9 border-2 cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
