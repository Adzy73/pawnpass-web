"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LogoHeader from "@/components/LogoHeader";

function SignContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const type = params.get("type") || "pawn";
  const loanId = params.get("loan");

  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [autoPayConsent, setAutoPayConsent] = useState(true);
  const [returnLockerId, setReturnLockerId] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  // Canvas Ref & Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!token || !loanId) {
      setError("Invalid signing link — missing token or loan ID.");
      setLoading(false);
      return;
    }

    fetch(`/api/contracts/create-signing-link?token=${token}&loan=${loanId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.expired) {
          setExpired(true);
        } else if (data.signed) {
          setAlreadySigned(true);
        } else if (data.error) {
          setError(data.error);
        } else if (data.valid) {
          setLoan(data);
          setCustomerName(data.customerName || "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to verify signing link.");
        setLoading(false);
      });
  }, [token, loanId]);

  // Setup Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#FF6B00";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [loan]);

  const getCoordinates = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#FF6B00";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCoordinates(canvas, e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#FF6B00";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCoordinates(canvas, e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureImage(null);
  };

  async function handleSign() {
    if (!customerName.trim()) {
      setError("Please enter your full legal name before signing.");
      return;
    }
    if (!agreedTerms) {
      setError("Please check the declaration box to confirm ownership and agree to contract terms.");
      return;
    }
    setSigning(true);
    setError("");

    try {
      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          loanId,
          customerName: customerName.trim(),
          agreed: agreedTerms,
          signatureImage,
          autoPayConsent,
          returnLockerId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSigned(true);
        setSignedAt(data.signedAt || new Date().toISOString());
      } else {
        setError(data.error || "Signing failed");
      }
    } catch {
      setError("Something went wrong while signing. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <p className="text-gray-400 text-sm">Verifying digital contract link...</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-white mb-2">Signing Link Expired</h1>
          <p className="text-sm text-gray-400 mb-6">This contract signing link has expired. Please request a new link from your PawnPass dashboard.</p>
          <a href="/dashboard" className="text-sm font-semibold" style={{ color: "#FF6B00" }}>← Return to Dashboard</a>
        </div>
      </div>
    );
  }

  // ─── COMPLETED SIGNED PLEDGE TICKET VIEW ───
  if (alreadySigned || signed) {
    return (
      <div className="min-h-screen print:bg-white print:text-black" style={{ background: "#0A0A0A" }}>
        <div className="print:hidden">
          <LogoHeader mode="customer" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Printable Ticket Container */}
          <div className="rounded-2xl p-6 sm:p-8 bg-white/[0.03] border border-white/10 print:bg-white print:text-black print:p-0 print:border-0 space-y-6">
            <div className="flex justify-between items-start border-b border-white/10 print:border-black/20 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-10 h-10 print:invert" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white print:text-black">
                    PawnPass Official Pledge Ticket
                  </h1>
                  <p className="text-xs text-gray-400 print:text-gray-600 font-mono">
                    Second-hand Dealers and Pawnbrokers Act 1996 (SA) · Reg 11
                  </p>
                </div>
              </div>
              <div className="print:hidden flex flex-wrap items-center gap-2">
                <a
                  href={`/api/contracts/pdf?loan=${loanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full text-xs font-bold text-white bg-[#FF6B00] hover:scale-105 transition-all inline-flex items-center gap-1.5 shadow-md"
                >
                  <span>📄 Open Official PDF</span>
                </a>
                <a
                  href={`/api/contracts/pdf?loan=${loanId}&download=true`}
                  download={`PawnPass-PledgeTicket-${loanId}.html`}
                  className="px-3.5 py-2 rounded-full text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all inline-flex items-center gap-1"
                >
                  <span>💾 Download File</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-full text-xs font-bold text-gray-300 border border-white/20 hover:text-white transition-all inline-flex items-center gap-1"
                >
                  <span>🖨 Print</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 print:border-emerald-700 text-emerald-300 print:text-emerald-900 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span>✅</span>
              <span>
                Contract digitally signed by <strong>{customerName || loan?.customerName}</strong> on{" "}
                {new Date(signedAt || Date.now()).toLocaleString("en-AU")}
              </span>
            </div>

            {/* Terms Details */}
            <div className="space-y-4 text-xs sm:text-sm text-gray-300 print:text-black">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/50 border border-white/10 print:bg-gray-100 print:border-black/20">
                <div>
                  <p className="text-gray-500 print:text-gray-600 font-mono text-[10px]">LOAN / TICKET ID</p>
                  <p className="font-mono font-bold text-base text-[#FF6B00] print:text-black">{loanId}</p>
                </div>
                <div>
                  <p className="text-gray-500 print:text-gray-600 font-mono text-[10px]">PLEDGOR (CUSTOMER)</p>
                  <p className="font-bold text-white print:text-black">{customerName || loan?.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500 print:text-gray-600 font-mono text-[10px]">COLLATERAL ITEM</p>
                  <p className="font-semibold text-white print:text-black">{loan?.itemDescription || "Collateral"}</p>
                </div>
                <div>
                  <p className="text-gray-500 print:text-gray-600 font-mono text-[10px]">PRINCIPAL OFFER</p>
                  <p className="font-bold text-white print:text-black">${loan?.principal || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 print:text-gray-600 font-mono text-[10px]">MONTHLY INTEREST RATE</p>
                  <p className="font-bold text-[#FF6B00] print:text-black">{loan?.interestRate || "35.00%"}/month</p>
                </div>
                <div>
                  <p className="text-gray-500 print:text-gray-600 font-mono text-[10px]">HUB LOCKER RECEIVER</p>
                  <p className="font-mono text-xs text-white print:text-black">Parcel Locker 51 (APCN 1000146016) · GREENACRES SA 5086</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 print:border-black/20 space-y-2">
                <p className="font-bold text-white print:text-black">Key Loan Terms:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400 print:text-black text-xs">
                  <li>Redemption Period is 90 days. You may redeem your item anytime by paying principal + monthly interest.</li>
                  <li>Monthly interest extends your loan by 30 days. Auto-Pay Interest is authorized to protect your collateral.</li>
                  <li>If unredeemed, the item is forfeited and sold under SA Section 14(3) for the best price reasonably obtainable.</li>
                </ul>
              </div>

              {/* Signature Display */}
              <div className="pt-4 border-t border-white/10 print:border-black/20 flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600 font-mono mb-2">DIGITAL SIGNATURE</p>
                  {signatureImage ? (
                    <img src={signatureImage} alt="Signature" className="h-16 border border-white/20 print:border-black rounded p-1 bg-black/40 print:bg-white" />
                  ) : (
                    <div className="font-serif italic text-xl text-white print:text-black border-b border-white/20 pb-1">
                      /s/ {customerName || loan?.customerName}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 print:text-gray-600 mt-1">
                    Typed Name: {customerName || loan?.customerName}
                  </p>
                </div>

                <div className="text-right text-[11px] text-gray-500 print:text-gray-600 font-mono">
                  <p>Pawnbroker: PawnPass Pty Ltd</p>
                  <p>ACL: Theorify · AUSTRAC Registered</p>
                  <p>311 NE Rd Hampstead Gardens SA 5086</p>
                </div>
              </div>
            </div>

            <div className="print:hidden text-center pt-4">
              <a href="/dashboard" className="inline-block rounded-full px-8 py-3.5 text-sm font-bold text-white bg-[#FF6B00]">
                Return to Customer Dashboard →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contractTitle = type === "pawn" ? "Pawn Loan Agreement & Pledge Ticket" : "Buy Outright Agreement";

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader mode="customer" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">{contractTitle}</h1>
            <p className="text-xs text-gray-400 font-mono">
              Second-hand Dealers and Pawnbrokers Act 1996 (SA) · Reg 11
            </p>
          </div>
        </div>

        {/* Contract Summary Box */}
        {loan && (
          <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 space-y-3 text-sm">
            <h2 className="text-xs font-mono text-[#FF6B00] uppercase tracking-wider">1. CONTRACT SCHEDULE</h2>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div><span className="text-gray-500 block text-[10px]">LOAN ID</span><span className="text-white font-mono font-bold">{loan.loanId}</span></div>
              <div><span className="text-gray-500 block text-[10px]">COLLATERAL</span><span className="text-white font-medium">{loan.itemDescription}</span></div>
              <div><span className="text-gray-500 block text-[10px]">PRINCIPAL</span><span className="text-white font-bold">${loan.principal}</span></div>
              <div><span className="text-gray-500 block text-[10px]">MONTHLY INTEREST</span><span className="text-[#FF6B00] font-bold">{loan.interestRate}/mo</span></div>
              <div className="col-span-2"><span className="text-gray-500 block text-[10px]">DESTINATION HUB LOCKER</span><span className="text-white font-mono">Parcel Locker 51 (APCN 1000146016), Greenacres SA 5086</span></div>
            </div>
          </div>
        )}

        {/* Legal Terms Briefing */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-gray-300 space-y-3 leading-relaxed">
          <h2 className="text-xs font-mono text-[#FF6B00] uppercase tracking-wider">2. TERMS & RECOVERY SUMMARY</h2>
          <p>
            By signing below, you agree to pledge the collateral specified above. Interest is charged monthly. You have 90 days to redeem your item or extend by paying monthly interest.
          </p>
          <p className="text-gray-400">
            If forfeited, PawnPass takes ownership and sells the item under SA Section 14(3) for the best price reasonably obtainable.
          </p>
          <a href={`/legal/${type === "pawn" ? "pawn-loan-agreement" : "buy-outright-agreement"}`} target="_blank" className="text-xs font-bold text-[#FF6B00] underline inline-block">
            Read full SA Pawnbrokers Act 1996 Contract Terms →
          </a>
        </div>

        {/* Signature & Consent Form */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white/[0.04] border border-white/10 space-y-6">
          <h2 className="text-lg font-bold text-white">3. Digital Signature & Authorization</h2>

          {/* Type Name */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Full Legal Name (as on your Driver&apos;s Licence / ID) *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Adam Menadue"
              className="w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* Draw Signature Canvas */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                Draw Your Signature (Finger or Mouse)
              </label>
              {hasDrawn && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-amber-400 hover:underline"
                >
                  🗑 Clear Drawing
                </button>
              )}
            </div>
            <div className="rounded-xl border border-white/15 bg-black/80 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-600 text-xs font-mono">
                  ✍️ Draw signature here with finger or mouse
                </div>
              )}
            </div>
          </div>

          {/* Auto-Pay Authorization Checkbox */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPayConsent}
                onChange={(e) => setAutoPayConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#FF6B00]"
              />
              <span className="text-xs sm:text-sm text-amber-200 leading-snug">
                <strong>Enable Auto-Pay Interest Agreement:</strong> I authorize PawnPass to automatically charge monthly interest from my stored payment method on my due date to keep my loan current and protect my item from forfeiture.
              </span>
            </label>
          </div>

          {/* Statutory Declaration Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#FF6B00]"
            />
            <span className="text-xs text-gray-300 leading-relaxed">
              I declare that I am 18 years of age or older, I am the legal owner of this collateral, the item is not stolen or encumbered, and I agree to the terms of this contract under the Second-hand Dealers and Pawnbrokers Act 1996 (SA).
            </span>
          </label>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSign}
            disabled={signing}
            className="w-full rounded-full py-4 text-base font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40"
            style={{ background: "#FF6B00", boxShadow: "0 0 25px rgba(255,107,0,0.3)" }}
          >
            {signing ? "Signing & Activating Loan…" : `Sign & Activate ${contractTitle} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}><p className="text-gray-400 text-sm">Loading contract portal...</p></div>}>
      <SignContent />
    </Suspense>
  );
}