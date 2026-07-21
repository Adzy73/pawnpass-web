"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "idle" | "pending" | "verified" | "failed" | "redirecting">("loading");
  const [message, setMessage] = useState("");
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/kyc");
      const data = await res.json();
      if (data.kycStatus === "verified") {
        setStatus("verified");
      } else if (data.kycStatus === "pending") {
        setStatus("pending");
      } else if (data.kycStatus === "failed") {
        setStatus("failed");
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  async function startVerification() {
    setStatus("loading");
    try {
      const res = await fetch("/api/kyc", { method: "POST" });
      const data = await res.json();

      if (data.mode === "manual") {
        setStatus("pending");
        setMessage(data.message);
        return;
      }

      if (data.mode === "stripe" && data.clientSecret) {
        // Load Stripe Identity SDK
        setStatus("redirecting");
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.onload = () => {
          const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          stripe.initEmbeddedVerification({
            clientSecret: data.clientSecret,
            onCompleted: () => {
              setStatus("verified");
            },
            onError: (err: any) => {
              console.error("Verification error:", err);
              setStatus("failed");
            },
          }).then((verification: any) => {
            verification.open();
          });
        };
        document.head.appendChild(script);
        return;
      }
    } catch (err) {
      console.error("KYC start failed:", err);
      setStatus("failed");
    }
  }

  const statusColors: Record<string, string> = {
    verified: "#00A87E",
    pending: "#FF9500",
    failed: "#EF4444",
    idle: "#6B7280",
  };

  const statusLabels: Record<string, string> = {
    verified: "Verified",
    pending: "Pending",
    failed: "Failed",
    idle: "Not started",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "#FF6B00" }}>P</div>
            <span className="text-xl font-bold tracking-tight">PawnPass</span>
          </a>
          <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black">← Dashboard</a>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Verify your identity</h1>
        <p className="text-gray-600 mb-8">Required before you can receive loan funds. Your data is encrypted and never shared.</p>

        {/* Status card */}
        <div className="rounded-2xl p-6 bg-white border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Verification status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: statusColors[status] }}></span>
                <span className="text-lg font-semibold" style={{ color: statusColors[status] }}>{statusLabels[status]}</span>
              </div>
            </div>
            {status === "verified" && <div className="text-4xl">✅</div>}
            {status === "pending" && <div className="text-4xl">⏳</div>}
          </div>

          {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
        </div>

        {/* What we need */}
        <div className="rounded-2xl p-6 bg-white border border-gray-200 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">What you'll need</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🪪</span>
              <div>
                <p className="text-sm font-medium">Australian driver's licence or passport</p>
                <p className="text-xs text-gray-500">Original document, not a photo of a photo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🤳</span>
              <div>
                <p className="text-sm font-medium">A selfie</p>
                <p className="text-xs text-gray-500">We compare it to your ID photo to prevent fraud</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        {status === "idle" && (
          <button
            onClick={startVerification}
            className="w-full rounded-full py-4 text-base font-medium text-white transition-colors"
            style={{ background: "#FF6B00" }}
          >
            Start verification →
          </button>
        )}

        {status === "loading" && (
          <div className="text-center py-4">
            <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading…</p>
          </div>
        )}

        {status === "pending" && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-800">Your verification is pending. You'll be able to receive funds once approved (usually within 24 hours).</p>
            </div>
            <button onClick={checkStatus} className="w-full rounded-full py-3 text-sm font-medium border-2 border-gray-300">
              Check status
            </button>
          </div>
        )}

        {status === "verified" && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">Your identity is verified. You can now receive loan funds.</p>
            </div>
            <a href="/dashboard" className="block w-full rounded-full py-3 text-sm font-medium text-white text-center" style={{ background: "#FF6B00" }}>
              Go to dashboard →
            </a>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">Verification failed. Please try again or contact support.</p>
            </div>
            <button onClick={startVerification} className="w-full rounded-full py-3 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>
              Try again
            </button>
          </div>
        )}

        {status === "redirecting" && (
          <div className="text-center py-4">
            <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Opening verification…</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8 text-center">
          🔒 Your data is encrypted end-to-end and processed by Stripe Identity. PawnPass never stores your raw ID images.
        </p>
      </div>
    </div>
  );
}
