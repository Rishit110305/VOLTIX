"use client";

import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 opacity-20 dark:opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-[480px] text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <h1 className="text-[150px] font-black text-foreground/10 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="w-24 h-24 text-primary animate-pulse" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
            Page Not Found
          </h2>
          <p className="mb-8 text-muted-foreground text-lg">
            We can't seem to find the page you're looking for. It might have
            been moved or doesn't exist.
          </p>

          <Button asChild className="rounded-2xl h-12 px-8" size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </div>

      <p className="absolute bottom-6 text-sm text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} VOLTIX - AI Control Center
      </p>
    </div>
  );
}
