"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import LogoHeader from "@/components/LogoHeader";

type KycStatus = "loading" | "unverified" | "pending" | "verified" | "failed";

interface FormState {
  fullName: string;
  dob: string;
  address: string;
  phone: string;
}

const STEPS = ["Your details", "Document", "Selfie", "Result"];

export default function VerifyPage() {
  const [status, setStatus] = useState<KycStatus>("loading");
  const [step, setStep] = useState(0); // 0 = details, 1 = document, 2 = selfie, 3 = result
  const [form, setForm] = useState<FormState>({ fullName: "", dob: "", address: "", phone: "" });
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"stripe" | "mock" | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const stripeInstanceRef = useRef<any>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/kyc/status");
      const data = await res.json();
      if (data.kycStatus === "verified") {
        setStatus("verified");
        setStep(3);
      } else if (data.kycStatus === "pending") {
        setStatus("pending");
      } else if (data.kycStatus === "failed") {
        setStatus("failed");
      } else {
        setStatus("unverified");
      }
    } catch {
      setStatus("unverified");
    }
  }

  // ── Step 1 → 2: submit personal details, create Stripe Identity session ──
  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.dob || !form.address || !form.phone) {
      setError("Please complete all fields.");
      return;
    }

    // Create verification session (mock auto-approves, stripe returns clientSecret)
    try {
      const res = await fetch("/api/kyc/create", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start verification");
        return;
      }

      setMode(data.mode);

      if (data.mode === "mock" && data.kycStatus === "verified") {
        // Mock mode auto-approves immediately → jump to result
        setStatus("verified");
        setStep(3);
        return;
      }

      if (data.mode === "stripe" && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setVerificationSessionId(data.verificationSessionId);
        setStatus("pending");
        setStep(1); // move to document step
        return;
      }

      // Already verified edge case
      if (data.kycStatus === "verified") {
        setStatus("verified");
        setStep(3);
        return;
      }
    } catch (err) {
      console.error("KYC create failed:", err);
      setError("Could not start verification. Please try again.");
    }
  }

  // ── Launch Stripe Identity embedded verification ──
  // Steps 1 & 2 (document + selfie) are both handled inside the Stripe widget.
  async function launchStripeVerification() {
    if (!clientSecret) return;
    setError("");

    try {
      if (!stripeInstanceRef.current) {
        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!pk) throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
        stripeInstanceRef.current = await loadStripe(pk);
      }

      const stripe = stripeInstanceRef.current;
      setStep(2); // selfie step — Stripe handles both doc + selfie in the modal

      const verification = await stripe.initEmbeddedVerification({
        clientSecret,
        onCompleted: () => {
          // The Stripe modal closed — poll the backend to confirm final status
          pollStatus();
        },
        onError: (err: any) => {
          console.error("Verification error:", err);
          setError("Verification encountered an error. Please try again.");
          setStatus("failed");
          setStep(3);
        },
      });

      await verification.open();
    } catch (err: any) {
      console.error("Stripe Identity launch failed:", err);
      setError(err.message || "Failed to open verification. Please try again.");
      setStatus("failed");
      setStep(3);
    }
  }

  async function pollStatus() {
    // Poll a few times after completion
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch("/api/kyc/status");
      const data = await res.json();
      if (data.kycStatus === "verified") {
        setStatus("verified");
        setStep(3);
        return;
      }
      if (data.kycStatus === "failed") {
        setStatus("failed");
        setStep(3);
        return;
      }
    }
    // Still pending → show pending state
    setStatus("pending");
    setStep(3);
  }

  function reset() {
    setStatus("unverified");
    setStep(0);
    setError("");
    setClientSecret(null);
    setVerificationSessionId(null);
  }

  // ── Already verified ──
  if (status === "verified" && step === 3) {
    return (
      <Shell step={3} active={3}>
        <div className="text-center py-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,168,126,0.12)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#00A87E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Identity verified</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
            You're verified and ready to proceed. Continue to shipping to send us your item and receive your loan.
          </p>
          <a
            href="/shipping"
            className="inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "#FF6B00" }}
          >
            Continue to shipping →
          </a>
          <a href="/dashboard" className="block mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Or go to dashboard
          </a>
        </div>
      </Shell>
    );
  }

  // ── Failed ──
  if (status === "failed" && step === 3) {
    return (
      <Shell step={3} active={3}>
        <div className="text-center py-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(239,68,68,0.12)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification failed</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
            We couldn't verify your identity. This can happen if the document is unclear or doesn't match. Please try
            again.
          </p>
          <button
            onClick={reset}
            className="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "#FF6B00" }}
          >
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  // ── Pending (waiting on Stripe webhook) ──
  if (status === "pending" && step === 3) {
    return (
      <Shell step={3} active={3}>
        <div className="text-center py-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,107,0,0.12)" }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B00] border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification in progress</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
            Your documents are being checked. This usually takes a few minutes. You'll be able to proceed once approved.
          </p>
          <button
            onClick={pollStatus}
            className="rounded-full px-8 py-3.5 text-sm font-semibold border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] transition-colors"
          >
            Check status
          </button>
        </div>
      </Shell>
    );
  }

  // ── Step 0: personal details ──
  if (step === 0) {
    return (
      <Shell step={0} active={0}>
        <h1 className="text-3xl font-bold text-white mb-2">Verify your identity</h1>
        <p className="text-sm text-gray-400 mb-8">
          AUSTRAC requires Customer Due Diligence before we can issue a loan. This takes about 3 minutes.
        </p>

        <form onSubmit={submitDetails} className="space-y-5">
          <Field label="Full legal name">
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="As it appears on your ID"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </Field>
          <Field label="Residential address">
            <AddressAutocomplete
              placeholder="Start typing your address..."
              value={form.address}
              onChange={(val) => setForm({ ...form, address: val })}
            />
          </Field>
          <Field label="Mobile number">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="04xx xxx xxx"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "#FF6B00" }}
          >
            Continue →
          </button>
        </form>

        <PrivacyNote />
      </Shell>
    );
  }

  // ── Step 1: document upload ──
  if (step === 1) {
    return (
      <Shell step={1} active={1}>
        <h1 className="text-3xl font-bold text-white mb-2">Upload your ID</h1>
        <p className="text-sm text-gray-400 mb-8">
          We'll verify your driver's licence or passport using Stripe's secure identity check.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🪪</span>
            <div>
              <p className="text-sm font-medium text-gray-200">Australian driver's licence or passport</p>
              <p className="text-xs text-gray-500">Original document, not a photo of a photo</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            When you continue, Stripe Identity will open a secure window to capture your document and selfie. This
            happens entirely on Stripe's servers — PawnPass never sees or stores your images.
          </p>
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <button
          onClick={launchStripeVerification}
          className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-colors mb-3"
          style={{ background: "#FF6B00" }}
        >
          Open secure verification →
        </button>
        <button
          onClick={() => setStep(0)}
          className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
        >
          ← Back to details
        </button>

        <PrivacyNote />
      </Shell>
    );
  }

  // ── Step 2: selfie / face match (Stripe modal open) ──
  if (step === 2) {
    return (
      <Shell step={2} active={2}>
        <div className="text-center py-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,107,0,0.12)" }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B00] border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Complete verification in the secure window</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
            Stripe is checking your document and selfie. Don't close this page — you'll be redirected automatically
            once it's done.
          </p>
          <button
            onClick={pollStatus}
            className="rounded-full px-8 py-3.5 text-sm font-semibold border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] transition-colors"
          >
            I've finished — check status
          </button>
        </div>
        <PrivacyNote />
      </Shell>
    );
  }

  // Loading fallback
  return (
    <Shell step={0} active={0}>
      <div className="text-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6B00] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </Shell>
  );
}

// ── Shell with glassmorphism nav + 4-step progress indicator ──
function Shell({ children, step, active }: { children: React.ReactNode; step: number; active: number }) {
  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader backLink="/dashboard" backLabel="← Dashboard" />

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* 4-step progress indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-12">
          {STEPS.map((label, i) => {
            const isActive = i === active;
            const isDone = i < active;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
                    style={
                      isActive
                        ? { background: "#FF6B00", color: "#fff" }
                        : isDone
                          ? { background: "rgba(0,168,126,0.15)", color: "#00A87E" }
                          : { background: "rgba(255,255,255,0.06)", color: "#6B7280" }
                    }
                  >
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#00A87E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-[11px] ${isActive ? "text-[#FF6B00]" : isDone ? "text-[#00A87E]" : "text-gray-400"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-8 h-px mb-5"
                    style={{ background: isDone ? "rgba(0,168,126,0.3)" : "rgba(255,255,255,0.08)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function PrivacyNote() {
  return (
    <p className="text-xs text-gray-500 mt-10 text-center leading-relaxed">
      <span className="inline-block align-middle mr-1">🔒</span>
      Your ID is processed securely by Stripe. PawnPass does not store your document images.
    </p>
  );
}
