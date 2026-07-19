"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function Login() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full rounded-2xl p-8 bg-white border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4" style={{ background: "#FF6B00" }}>P</div>
          <h1 className="text-2xl font-bold mb-1">Sign in to PawnPass</h1>
          <p className="text-sm text-gray-500">Manage your loans and payments</p>
        </div>
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          {state?.message && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full py-3.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "#FF6B00" }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account? <a href="/register" className="font-medium" style={{ color: "#FF6B00" }}>Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
}
