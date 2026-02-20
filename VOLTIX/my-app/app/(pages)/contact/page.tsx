"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAnimate, motion } from "framer-motion";
import {
  ArrowUp,
  Briefcase,
  Lightbulb,
  Mail,
  ArrowUpRight,
  Zap,
  Code,
  Layers,
  Cpu,
  Smartphone,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Particles } from "@/components/particle-highlight";

// WhatsApp Logo Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const BookDemo = () => {
  return (
    <section className="py-6">
      <div className="mx-6">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:border-y border-border/40">
          <div className="space-y-10 lg:py-20">
            <h2 className="w-full text-3xl lg:text-5xl font-bold tracking-tight">
              We're here to <br />{" "}
              <span className="text-primary">Help & Support</span>
            </h2>
            <div className="">
              <div className="mb-10 space-y-10 lg:flex lg:flex-col">
                <div className="space-y-4">
                  <Separator className="bg-border/40" />
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-5 text-primary" />
                    <p className="text-sm">
                      Technical support for charging stations
                    </p>
                  </div>
                  <Separator className="bg-border/40" />
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 text-primary" />
                    <p className="text-sm">Billing and payment inquiries</p>
                  </div>
                  <Separator className="bg-border/40" />
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 text-primary" />
                    <p className="text-sm">Partnership and fleet integration</p>
                  </div>
                  <Separator className="bg-border/40" />
                </div>
                <div className="space-y-4 border border-border/40 bg-secondary/10 p-8 rounded-xl">
                  <p className="font-semibold italic">
                    "The support team at VOLTIX is incredible. Any technical
                    issues are resolved within minutes, keeping our fleet
                    moving."
                  </p>
                  <p className="font-semibold">
                    Fleet Manager /{" "}
                    <span className="text-muted-foreground text-xs">
                      RAPID TRANSIT CORP.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative min-h-[500px] bg-secondary/20 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-0" />
            <div className="border-t border-border/40 z-10 relative p-2 lg:border-l lg:border-t-0 xl:p-20 h-full flex flex-col justify-center">
              <div className="space-y-8 bg-background/80 backdrop-blur-xl border border-border/40 rounded-3xl p-4 lg:p-10 shadow-2xl">
                <h1 className="text-xl font-bold">Send us a message</h1>
                <p className="text-sm text-muted-foreground">
                  Need assistance? Fill out the form below and our support team
                  will get back to you shortly.
                </p>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="text"
                      placeholder="First Name*"
                      className="mt-2 bg-background/50"
                      required
                    />
                    <Input
                      type="text"
                      placeholder="Last Name*"
                      className="mt-2 bg-background/50"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Work Email*"
                      className="mt-2 bg-background/50"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Company Name*"
                      className="mt-2 bg-background/50"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="text"
                      placeholder="+91"
                      className="mt-2 bg-background/50"
                      required
                    />
                  </div>
                  <div>
                    <Select required>
                      <SelectTrigger className="mt-2 w-full bg-background/50">
                        <SelectValue placeholder="Topic of inquiry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">
                          Technical Support
                        </SelectItem>
                        <SelectItem value="billing">
                          Billing & Payments
                        </SelectItem>
                        <SelectItem value="sales">
                          Sales & Partnerships
                        </SelectItem>
                        <SelectItem value="other">Other Inquiries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full text-lg h-12">Send Message</Button>
                <div className="flex justify-center space-x-2 text-center">
                  <p className="text-muted-foreground text-xs">
                    By clicking Get Started, you agree with VOLTIX&apos;s Terms
                    of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Connect = () => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      [
        ["#pointer", { left: 200, top: 60 }, { duration: 0 }],
        ["#javascript", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 50, top: 102 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#javascript", { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
        ["#react-js", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 224, top: 170 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#react-js", { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
        ["#typescript", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 88, top: 198 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#typescript", { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
        ["#next-js", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 200, top: 60 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#next-js", { opacity: 0.5 }, { at: "-0.3", duration: 0.1 }],
      ],
      {
        repeat: Number.POSITIVE_INFINITY,
      },
    );
  }, [animate]);

  return (
    <section className="relative mx-auto flex justify-center items-center min-h-[80vh] max-w-5xl py-20">
      <div className="group h-full w-full">
        <div
          className="group/item h-full md:col-span-6 lg:col-span-12"
          data-aos="fade-down"
        >
          <div className="rounded-3xl p-6">
            <div className="relative z-20 h-full overflow-hidden rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-xl">
              <Particles
                className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-100"
                quantity={200}
                color={"#22c55e"}
                vy={-0.2}
              />
              <div className="flex justify-center">
                <div className="flex h-full flex-col justify-center gap-10 p-4 md:h-[300px] md:flex-row items-center">
                  <div
                    className="relative px-20 h-[270px] w-[300px] md:h-[270px] md:w-[300px]"
                    ref={scope}
                  >
                    <div className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-background rounded-2xl shadow-lg border border-border/50">
                      <Zap className="h-10 w-10 text-primary fill-primary" />
                    </div>

                    <div
                      id="next-js"
                      className="absolute bottom-12 left-14 rounded-full border border-slate-400 bg-slate-200 px-3 py-1.5 text-xs opacity-50 dark:border-slate-600 dark:bg-slate-800 flex items-center gap-1 font-medium"
                    >
                      <Smartphone className="w-3 h-3" />
                      App Support
                    </div>
                    <div
                      id="react-js"
                      className="absolute top-20 left-2 rounded-full border border-slate-400 bg-slate-200 px-3 py-1.5 text-xs opacity-50 dark:border-slate-600 dark:bg-slate-800 flex items-center gap-1 font-medium"
                    >
                      <Layers className="w-3 h-3" />
                      Infrastructure
                    </div>
                    <div
                      id="typescript"
                      className="absolute right-1 bottom-20 rounded-full border border-slate-400 bg-slate-200 px-3 py-1.5 text-xs opacity-50 dark:border-slate-600 dark:bg-slate-800 flex items-center gap-1 font-medium"
                    >
                      <Cpu className="w-3 h-3" />
                      Hardware
                    </div>
                    <div
                      id="javascript"
                      className="absolute top-10 right-12 rounded-full border border-slate-400 bg-slate-200 px-3 py-1.5 text-xs opacity-50 dark:border-slate-600 dark:bg-slate-800 flex items-center gap-1 font-medium"
                    >
                      <Code className="w-3 h-3" />
                      API Access
                    </div>

                    <div id="pointer" className="absolute z-20">
                      <svg
                        width="16.8"
                        height="18.2"
                        viewBox="0 0 12 13"
                        className="fill-primary"
                        stroke="white"
                        strokeWidth="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 5.50676L0 0L2.83818 13L6.30623 7.86537L12 5.50676V5.50676Z"
                        />
                      </svg>
                      <span className="bg-primary relative -top-1 left-3 rounded-full px-2 py-0.5 text-[10px] text-primary-foreground font-bold shadow-sm">
                        VOLTIX
                      </span>
                    </div>
                  </div>

                  <div className="flex h-full flex-col justify-center p-2 md:pl-10 md:w-[400px]">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <h3 className="pb-1 font-bold">
                        <span className="text-2xl md:text-3xl">
                          Questions about VOLTIX?
                        </span>
                      </h3>
                      <p className="mb-6 text-muted-foreground mt-2">
                        Feel free to reach out to our team! We're here to help
                        you optimize your charging infrastructure.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Link href={"#"} target="_blank">
                        <Button className="rounded-full">
                          Chat with Support
                        </Button>
                      </Link>
                      <Link
                        href="mailto:contact@voltix.com"
                        target="_blank"
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "icon",
                          }),
                          "rounded-full",
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Mail strokeWidth={1.5} className="h-5 w-5" />
                        </span>
                      </Link>
                      <Link
                        href="https://wa.me/"
                        target="_blank"
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "icon",
                          }),
                          "rounded-full",
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <WhatsAppIcon className="w-5 h-5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 md:px-6 mx-auto py-6">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
          Back to Dashboard
        </Link>

        <BookDemo />
        <Connect />
      </div>
    </div>
  );
}
