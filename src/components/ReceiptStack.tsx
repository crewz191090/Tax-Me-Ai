"use client";

import { useEffect, useState } from "react";

const RECEIPTS = [
  {
    merchant: "Klinik Kesihatan",
    date: "15 Jun 2026",
    amount: "RM 120.00",
    category: "Medical (self, spouse, child)",
  },
  {
    merchant: "MPH Bookstore",
    date: "14 Jun 2026",
    amount: "RM 68.00",
    category: "Lifestyle",
  },
  {
    merchant: "Kedai Runcit",
    date: "14 Jun 2026",
    amount: "RM 23.60",
    category: "Personal (not deductible)",
  },
  {
    merchant: "Popular Bookstore",
    date: "13 Jun 2026",
    amount: "RM 45.00",
    category: "Lifestyle",
  },
  {
    merchant: "Tadika Ceria",
    date: "12 Jun 2026",
    amount: "RM 250.00",
    category: "Childcare / kindergarten fees",
  },
  {
    merchant: "Prudential",
    date: "11 Jun 2026",
    amount: "RM 212.30",
    category: "Life insurance & EPF",
  },
];

function badgeColor(category: string) {
  if (category.includes("not deductible")) return "bg-white/10 text-muted";
  return "bg-accent/15 text-accent";
}

export default function ReceiptStack() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % RECEIPTS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const visible = [0, 1, 2].map((offset) => RECEIPTS[(index + offset) % RECEIPTS.length]);

  return (
    <div className="relative h-56 w-full max-w-[240px]">
      {visible
        .slice()
        .reverse()
        .map((r, i) => {
          const depth = visible.length - 1 - i;
          return (
            <div
              key={r.merchant + depth}
              className="absolute inset-x-0 top-0 rounded-2xl border border-border bg-surface p-4 shadow-xl shadow-black/30 transition-all duration-500"
              style={{
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
                zIndex: 10 - depth,
                opacity: depth === 0 ? 1 : 0.75 - depth * 0.15,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight ${badgeColor(
                    r.category
                  )}`}
                >
                  {r.category}
                </span>
              </div>
              <div className="mb-1 text-sm font-semibold">{r.merchant}</div>
              <div className="mb-3 text-2xl font-bold">{r.amount}</div>
              <div className="text-[11px] text-muted">{r.date}</div>
            </div>
          );
        })}
    </div>
  );
}
