"use client";

import {
  ArrowUpRight,
  Search,
  Download,
  Apple,
  Cpu,
  Smartphone,
  Laptop,
  Zap,
  Layers,
  Layout,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// Simple logo components as placeholders
const LogoIcon = ({
  name,
  className = "w-10 h-10",
}: {
  name: string;
  className?: string;
}) => (
  <div
    className={`${className} rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-lg text-primary`}
  >
    {name.charAt(0)}
  </div>
);

const DownloadPage = () => {
  const plugins = [
    {
      name: "OpenAI",
      description: "Seamless integration for OpenAI ChatGPT.",
      popular: true,
    },
    { name: "Google", description: "Google services integration." },
    { name: "Gemini", description: "Google's Gemini AI assistant." },
    { name: "GitHub", description: "Code and repository management." },
    { name: "Vercel", description: "Deploy and host your applications." },
    { name: "Figma", description: "Design collaboration and imports." },
    { name: "Slack", description: "Team communication integration." },
  ];

  return (
    <section className="min-h-screen bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
          Back to Dashboard
        </Link>

        <h2 className="mb-10 w-full text-center text-4xl md:text-5xl font-bold tracking-tight">
          Elevate Your <span className="text-primary">EV Experience</span>
        </h2>

        <div className="grid h-full w-full gap-6 md:grid-cols-[6fr_4fr]">
          {/* Main Download Section */}
          <div className="bg-secondary/50 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-border/50">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                  <Zap className="w-7 h-7 text-primary-foreground" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  VOLTIX App
                </h2>
              </div>

              <p className="text-muted-foreground text-lg">
                A smart EV charging platform designed to optimize your charging
                experience. Find stations, track usage, and manage your electric
                vehicle seamlessly.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button className="h-14 px-6 rounded-xl gap-2" size="lg">
                  <Apple className="w-5 h-5" />
                  Download for iOS
                </Button>
                <Button
                  variant="outline"
                  className="h-14 px-6 rounded-xl gap-2"
                  size="lg"
                >
                  <Smartphone className="w-5 h-5" />
                  Download for Android
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="h-12 px-5 rounded-xl gap-2"
                >
                  <Laptop className="w-4 h-4" />
                  macOS (Apple Silicon)
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 px-5 rounded-xl gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  macOS (Intel)
                </Button>
              </div>

              <p className="text-muted-foreground text-sm underline cursor-pointer hover:text-foreground transition-colors">
                More download options
              </p>

              <div className="space-y-4 border-t border-dashed border-border/50 pt-6">
                <p className="text-sm uppercase tracking-wider font-medium text-muted-foreground">
                  Feature Overview
                </p>

                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layout className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          Station Finder
                        </p>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Find nearby charging stations with real-time
                        availability
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          Smart Charging
                        </p>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        AI-optimized charging schedules based on your usage
                        patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          Live Tracking
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Real-time charging progress and battery status
                        monitoring
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          Route Planning
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Plan trips with automatic charging stop suggestions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-fit items-center gap-2 border-b border-primary pb-2 cursor-pointer hover:gap-3 transition-all group">
                <p className="text-md font-medium">Learn more about VOLTIX</p>
                <ArrowUpRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Plugins Section */}
          <div className="w-full border border-border/50 rounded-3xl p-8 md:p-10 bg-background/50 backdrop-blur-sm">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Integrations
              </h2>
              <p className="text-muted-foreground">
                Connect VOLTIX with your favorite apps and services.
              </p>

              <div className="relative">
                <Input
                  className="h-12 pe-3 ps-10 rounded-xl"
                  placeholder="Search integrations..."
                  type="search"
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                  <Search className="w-5 h-5" />
                </div>
              </div>

              <div className="h-[380px] space-y-2 overflow-auto pr-2">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.name}
                    className="hover:bg-secondary/50 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors group"
                  >
                    <LogoIcon name={plugin.name} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium tracking-tight">
                          {plugin.name}
                        </h3>
                        {plugin.popular && (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plugin.description}
                      </p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadPage;
