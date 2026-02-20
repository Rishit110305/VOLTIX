"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  HoveredLink,
  Menu,
  MenuItem,
} from "@/componentsAcertinity/ui/navbar-menu";
import { cn } from "@/lib/utils";

export function NavbarDemo() {
  return (
    <div className="relative w-full flex items-center justify-center">
      <Navbar className="top-2" />
    </div>
  );
}

function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);

  const features = [
    {
      label: "Dashboard",
      href: "/dashboard",
      src: "https://assets.aceternity.com/demos/algochurn.webp",
      description: "Real-time station monitoring",
    },
    {
      label: "About Us",
      href: "/about",
      src: "https://assets.aceternity.com/demos/tailwindmasterkit.webp",
      description: "Meet the Agent Squad",
    },
    {
      label: "Contact Us",
      href: "/contact",
      src: "https://assets.aceternity.com/demos/Screenshot+2024-02-21+at+11.51.31%E2%80%AFPM.png",
      description: "Get in touch with support",
    },
    {
      label: "Download App",
      href: "/download",
      src: "https://assets.aceternity.com/demos/Screenshot+2024-02-21+at+11.47.07%E2%80%AFPM.png",
      description: "Get the driver app",
    },
  ];

  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-4xl mx-auto z-50", className)}
    >
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Home">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/">Home</HoveredLink>
            <HoveredLink href="/#features">Features</HoveredLink>
            <HoveredLink href="/#pricing">Pricing</HoveredLink>
            <HoveredLink href="/#contact">Contact</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Features">
          <div className="text-sm grid grid-cols-2 gap-10 p-4">
            {features.map((feature, idx) => (
              <Link key={idx} href={feature.href} className="flex space-x-4 group">
                <img
                  src={feature.src}
                  width={140}
                  height={70}
                  alt={feature.label}
                  className="shrink-0 rounded-md shadow-2xl bg-white"
                />
                <div>
                  <h4 className="text-xl font-bold mb-1 text-black dark:text-white group-hover:text-emerald-500 transition-colors">
                    {feature.label}
                  </h4>
                  <p className="text-neutral-700 text-sm max-w-[10rem] dark:text-neutral-300">
                    {feature.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Pricing">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/#pricing">Basic Plan</HoveredLink>
            <HoveredLink href="/#pricing">Premium Plan</HoveredLink>
            <HoveredLink href="/#pricing">Enterprise Plan</HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}
