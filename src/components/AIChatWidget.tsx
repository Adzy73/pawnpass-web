"use client";

import { useState, useRef, useEffect } from "react";
import catalog from "@/catalog/pawnpass.json";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Simple keyword-based answer engine that searches the catalog Q&A bank.
// No external AI calls — answers strictly from the knowledge catalog.
function findAnswer(query: string): string {
  const q = query.toLowerCase();
  const faqs = catalog.qa_bank.filter(
    (item) => item.publishable && catalog.faq_published.includes(item.id)
  );

  // Score each FAQ by keyword overlap
  let bestMatch: { score: number; answer: string; question: string } | null = null;

  for (const faq of faqs) {
    const faqText = (faq.question + " " + faq.answer + " " + faq.tags.join(" ")).toLowerCase();
    const queryWords = q.split(/\s+/).filter((w) => w.length > 2);
    let score = 0;

    for (const word of queryWords) {
      if (faqText.includes(word)) score++;
      // Bonus for tag matches
      if (faq.tags.some((t: string) => t.toLowerCase().includes(word))) score += 2;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { score, answer: faq.answer, question: faq.question };
    }
  }

  if (bestMatch && bestMatch.score > 0) {
    return bestMatch.answer;
  }

  // Fallback: check if asking about pricing
  if (q.includes("rate") || q.includes("price") || q.includes("cost") || q.includes("interest") || q.includes("fee")) {
    const tiers = catalog.pricing.loan_rates.tiers;
    const rateInfo = tiers
      .map((t: { loan_amount_range: string; standard_rate: string; gold_rate: string }) =>
        `${t.loan_amount_range}: ${t.standard_rate} (gold: ${t.gold_rate})`
      )
      .join("; ");
    return `Our pawn loan rates are charged per month and depend on the loan amount: ${rateInfo}. Gold items get a 25% discount. No establishment fees, no monthly fees. See our pricing page for full details.`;
  }

  // Check if asking about accepted items
  if (q.includes("item") || q.includes("pawn") || q.includes("sell") || q.includes("accept") || q.includes("what can")) {
    const cats = catalog.accepted_item_categories
      .map((c: { label: string }) => c.label)
      .join(", ");
    return `We accept: ${cats}. Items must be shippable via Australia Post (under 16kg, within 35×44×61cm). Get a quote at /quote.`;
  }

  // Check if asking about process
  if (q.includes("how") && (q.includes("work") || q.includes("process") || q.includes("start"))) {
    return `It's simple: 1) Describe your item with photos at /quote, 2) Get an instant AI quote, 3) Ship via Parcel Locker, 4) Get paid via Osko. See our How It Works page for full details.`;
  }

  // Escalation
  return `I don't have a specific answer for that. Here are some ways I can help: I can tell you about our rates, accepted items, how the process works, or answer common FAQ questions. For anything else, please email info@pawnpass.com.au or call 0439 726 576.`;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the PawnPass assistant. I can answer questions about our pawn loans, rates, accepted items, and how it works. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Get answer from catalog
    const answer = findAnswer(input);

    // Simulate slight delay for UX
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    }, 300);

    setInput("");
  }

  const quickQuestions = [
    "How much can I borrow?",
    "What are the rates?",
    "What items do you accept?",
    "How does it work?",
  ];

  return (
    <>
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
          style={{ background: "#FF6B00", boxShadow: "0 0 30px rgba(255,107,0,0.4)" }}
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-md rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "#0A0A0A",
            border: "1px solid rgba(255,255,255,0.1)",
            height: "min(600px, calc(100vh-3rem))",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,107,0,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FF6B00" }}>
                <span className="text-xs font-bold text-white">PP</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">PawnPass Assistant</div>
                <div className="text-[10px] text-gray-500">Answers from our knowledge base</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user" ? "text-white" : "text-gray-300"
                  }`}
                  style={{
                    background: msg.role === "user" ? "#FF6B00" : "rgba(255,255,255,0.05)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Quick questions (show after first assistant message) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {quickQuestions.map((qq) => (
                  <button
                    key={qq}
                    onClick={() => {
                      setInput(qq);
                      setTimeout(() => {
                        const userMessage: Message = { role: "user", content: qq };
                        setMessages((prev) => [...prev, userMessage]);
                        const answer = findAnswer(qq);
                        setTimeout(() => {
                          setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
                        }, 300);
                      }, 50);
                      setInput("");
                    }}
                    className="text-xs px-3 py-1.5 rounded-full text-gray-400 transition-colors hover:text-white"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
                  >
                    {qq}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 flex gap-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "#FF6B00" }}
            >
              →
            </button>
          </form>

          {/* Escalation note */}
          <div className="px-4 py-2 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[10px] text-gray-400">
              Can&apos;t find what you need?{" "}
              <a href="mailto:info@pawnpass.com.au" className="text-gray-500 hover:text-white transition-colors">
                Email us
              </a>{" "}
              or call 0439 726 576
            </span>
          </div>
        </div>
      )}
    </>
  );
}
