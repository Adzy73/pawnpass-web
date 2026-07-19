"use client";

import { ReactNode, createContext, useContext, useState, useEffect } from "react";

export interface QuoteResult {
  estimated_value: number;
  loan_amount: number;
  buy_amount: number;
  interest_rate: string;
  is_gold: boolean;
  confidence: number;
  category: string;
  condition: string;
  brand: string;
  model: string;
  description: string;
  photo_count: number;
  created_at: string;
}

export interface ActiveLoan {
  loan_id: string;
  item_description: string;
  principal: number;
  interest_rate: string;
  is_gold: boolean;
  status: string;
  created_at: string;
  due_date: string;
  tracking_number: string;
  total_interest_paid: number;
}

interface AppContextType {
  quote: QuoteResult | null;
  setQuote: (q: QuoteResult | null) => void;
  loans: ActiveLoan[];
  addLoan: (loan: ActiveLoan) => void;
  updateLoan: (loanId: string, updates: Partial<ActiveLoan>) => void;
  shipment: any;
  setShipment: (s: any) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [quote, setQuoteState] = useState<QuoteResult | null>(null);
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [shipment, setShipmentState] = useState<any>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedQuote = localStorage.getItem("pawnpass_quote");
      const savedLoans = localStorage.getItem("pawnpass_loans");
      const savedShipment = localStorage.getItem("pawnpass_shipment");
      if (savedQuote) setQuoteState(JSON.parse(savedQuote));
      if (savedLoans) setLoans(JSON.parse(savedLoans));
      if (savedShipment) setShipmentState(JSON.parse(savedShipment));
    } catch (e) {
      console.error("Failed to load state:", e);
    }
  }, []);

  const setQuote = (q: QuoteResult | null) => {
    setQuoteState(q);
    if (q) localStorage.setItem("pawnpass_quote", JSON.stringify(q));
    else localStorage.removeItem("pawnpass_quote");
  };

  const addLoan = (loan: ActiveLoan) => {
    const updated = [...loans, loan];
    setLoans(updated);
    localStorage.setItem("pawnpass_loans", JSON.stringify(updated));
  };

  const updateLoan = (loanId: string, updates: Partial<ActiveLoan>) => {
    const updated = loans.map(l => l.loan_id === loanId ? { ...l, ...updates } : l);
    setLoans(updated);
    localStorage.setItem("pawnpass_loans", JSON.stringify(updated));
  };

  const setShipment = (s: any) => {
    setShipmentState(s);
    if (s) localStorage.setItem("pawnpass_shipment", JSON.stringify(s));
    else localStorage.removeItem("pawnpass_shipment");
  };

  return (
    <AppContext.Provider value={{ quote, setQuote, loans, addLoan, updateLoan, shipment, setShipment }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
