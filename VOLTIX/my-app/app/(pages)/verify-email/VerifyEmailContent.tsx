"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendOTP } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam) {
      setUserId(userIdParam);
    } else {
      router.push("/SignUp");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !otp) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await verifyEmail({ userId, otp });

      if (result.success) {
        setSuccess("Email verified successfully! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(result.message || "Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) return;

    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await resendOTP({ userId, type: "email_verification" });

      if (result.success) {
        setSuccess("OTP sent successfully! Check your email.");
      } else {
        setError(result.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while resending OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Back Button */}
      <Link
        href="/SignUp"
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to your email address
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                💡 Dev Mode: Check the backend terminal/console for the OTP code
              </p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-green-700 dark:text-green-400 text-sm">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </button>
          </div>

          {/* Back to Signup */}
          <div className="text-center">
            <Link
              href="/SignUp"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              ← Back to Signup
            </Link>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Check your spam folder if you don't see the email. The
              verification code expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
