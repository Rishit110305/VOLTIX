"use client";
import React from "react";
import { NavbarDemo } from "./Navbar";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-neutral-900">
      {/* 1. Navbar: Absolute Position at the TOP (Not Center) */}
      <div className="absolute top-0 left-0 w-full z-50 flex justify-center pt-8">
        <NavbarDemo />
      </div>

      {/* 2. Background Image */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        >
          <source src="/assets/bg_video_v2.mp4" type="video/mp4" />
        </video>
        {/* Top/side soft wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/5 to-black/30" />
        {/* Bottom dark gradient for readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
      </div>

      {/* Bottom-left content overlay */}
      <div className="absolute bottom-8 left-6 sm:left-10 z-20">
        <div className="max-w-xl md:max-w-2xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {/* Animated Headline */}
          <motion.h1
            className="flex flex-wrap items-center gap-2 sm:gap-3 leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              className="block text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Power Up Your Drive With Smart,
            </motion.span>
            {/* Inline avatar group + CLEAN ENERGY */}
            <motion.span
              className="inline-flex items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Avatar group (overlapping) */}
              <span className="relative -mr-2 flex">
                <img
                  src="https://i.pravatar.cc/40?img=12"
                  alt="avatar"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-black/50 object-cover"
                />
                <img
                  src="https://i.pravatar.cc/40?img=32"
                  alt="avatar"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full -ml-2 ring-2 ring-black/50 object-cover"
                />
                <img
                  src="https://i.pravatar.cc/40?img=24"
                  alt="avatar"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full -ml-2 ring-2 ring-black/50 object-cover"
                />
              </span>
              <motion.span
                className="ml-2 text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight"
                style={{ color: "#39FF14" }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                CLEAN ENERGY
              </motion.span>
            </motion.span>
          </motion.h1>

          {/* Animated Subtext */}
          <motion.p
            className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-300 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            Experience the future of EV charging—faster, safer, and sustainably
            powered. Built for everyday convenience and engineered for
            tomorrow's mobility.
          </motion.p>

          {/* Animated CTA Row */}
          <motion.div
            className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <a
              href="/SignUp"
              className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
              style={{ backgroundColor: "#39FF14" }}
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            <div className="flex items-center gap-3">
              {/* Social proof avatars */}
              <div className="flex -space-x-2">
                <img
                  src="https://i.pravatar.cc/32?img=15"
                  alt="user"
                  className="h-8 w-8 rounded-full ring-2 ring-black/50 object-cover"
                />
                <img
                  src="https://i.pravatar.cc/32?img=5"
                  alt="user"
                  className="h-8 w-8 rounded-full ring-2 ring-black/50 object-cover"
                />
                <img
                  src="https://i.pravatar.cc/32?img=45"
                  alt="user"
                  className="h-8 w-8 rounded-full ring-2 ring-black/50 object-cover"
                />
              </div>
              <span className="text-sm text-gray-200">
                Trusted by 30,000+ worldwide users
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animated Floating bottom-right glass card */}
      <motion.div
        className="absolute bottom-6 right-6 z-20"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        <div className="relative w-56 sm:w-64 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg overflow-hidden">
          {/* subtle grid to feel like a map */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white/80" />
                <span className="text-sm font-medium text-white/90">
                  Stations
                </span>
              </div>
              {/* pulsing green dot */}
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#39FF14] opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#39FF14]"></span>
              </span>
            </div>
            {/* simple path-like accents */}
            <div className="mt-4 h-20 rounded-lg bg-black/20 border border-white/10" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
