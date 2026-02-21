"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download } from "lucide-react";
import Link from "next/link";

import ChatBot from "@/app/components/ChatBot";
import NotificationsList from "@/app/components/notifications-list";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";
import { HomeContent } from "@/app/components/dashboard-content";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { DashboardDecisions } from "@/app/components/dashboard-decisions";
import BatteryBay from "@/app/components/dashboard/BatteryBay";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import TrafficNotificationToast from "@/app/components/TrafficNotificationToast";
import LiveAgentConsole from "@/app/components/live-agent-console-v2";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    // <ProtectedRoute>
    <div className="bg-background relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
          ],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      <SidebarProvider defaultOpen={false}>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-6">
            {/* ── Live station status set by admin panel ── */}
            <Tabs
              defaultValue="home"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <TabsList className="grid w-full max-w-[600px] grid-cols-5 rounded-2xl p-1">
                  <TabsTrigger value="home" className="rounded-xl">
                    Home
                  </TabsTrigger>
                  <TabsTrigger value="apps" className="rounded-xl">
                    Stations
                  </TabsTrigger>
                  <TabsTrigger value="files" className="rounded-xl">
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="rounded-xl">
                    Decisions
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="rounded-xl">
                    Notifications
                  </TabsTrigger>
                </TabsList>
                <div className="hidden gap-2 md:flex">
                  <Button
                    onClick={() =>
                      window.open(
                        "/api/audit-report",
                        "_blank",
                      )
                    }
                    className="rounded-2xl bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="home" className="mt-0">
                    <HomeContent />
                  </TabsContent>
                  <TabsContent value="apps" className="mt-0">
                    <BatteryBay />
                  </TabsContent>
                  <TabsContent value="files" className="mt-0">
                    <LiveAgentConsole />
                  </TabsContent>
                  <TabsContent value="projects" className="mt-0">
                    <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 backdrop-blur-md rounded-3xl p-6 border border-green-100/50 dark:border-green-900/30 min-h-[500px]">
                      <DashboardDecisions />
                    </div>
                  </TabsContent>
                  <TabsContent value="notifications" className="mt-0">
                    <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 backdrop-blur-md rounded-3xl p-6 border border-green-100/50 dark:border-green-900/30 min-h-[500px]">
                      <h3 className="text-lg font-semibold mb-4 px-1">
                        Recent Updates
                      </h3>
                      <NotificationsList />
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <ChatBot />
      <TrafficNotificationToast />
    </div>
    // </ProtectedRoute>
  );
}
