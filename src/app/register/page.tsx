"use client";
import LogoHeader from "@/components/LogoHeader";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";

export default function Register() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader />
      <div className="flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full">
          {/* Logo + heading */}
          <div className="text-center mb-10">
            <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-2 text-white">Create account</h1>
            <p className="text-base text-gray-400">Get instant quotes and manage loans online</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <form action={action} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="John Smith"
                  required
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-base text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
                {state?.errors?.name && (
                  <p className="text-xs mt-1" style={{ color: "#FF6B00" }}>{state.errors.name[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-base text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
                {state?.errors?.email && (
                  <p className="text-xs mt-1" style={{ color: "#FF6B00" }}>{state.errors.email[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone (optional)</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="04xx xxx xxx"
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-base text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  required
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-base text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
                {state?.errors?.password && (
                  <p className="text-xs mt-1" style={{ color: "#FF6B00" }}>{state.errors.password[0]}</p>
                )}
              </div>
              {state?.message && (
                <p className="text-sm" style={{ color: "#FF6B00" }}>{state.message}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full py-3.5 text-base font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.01]"
                style={{ background: "#FF6B00", boxShadow: "0 0 20px rgba(255,107,0,0.3)" }}
              >
                {pending ? "Creating account…" : "Create account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account? <a href="/login" className="font-medium" style={{ color: "#FF6B00" }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}