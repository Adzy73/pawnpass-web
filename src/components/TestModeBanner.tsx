"use client";

import { useState, useEffect } from "react";

export default function TestModeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if we're in test/dev mode via the health endpoint
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        // If any optional service is down or we're not in production, show banner
        const isDev = process.env.NODE_ENV !== "production";
        const testMode = process.env.NEXT_PUBLIC_PAWNPASS_TEST_MODE === "true";
        setShow(isDev || testMode);
      })
      .catch(() => setShow(false));
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] px-4 py-1.5 text-center text-xs font-medium"
      style={{
        background: "#FF6B00",
        color: "white",
        letterSpacing: "0.05em",
      }}
    >
      ⚠ TEST MODE — mock data may be shown. Not for real transactions.
    </div>
  );
}
