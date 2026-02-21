import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";
import { ShaderRipple } from "@/components/ui/shader-ripple";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      {/* Back Button - Top Left */}
      <Link
        href="/SignUp"
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      {/* Mode Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border p-1">
          <ModeToggle />
        </div>
      </div>

      <div className="w-full z-10 relative max-w-md px-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8 bg-background/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border">
              Loading...
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
      <ShaderRipple className="absolute -z-0 inset-0 h-screen" />
    </div>
  );
}
