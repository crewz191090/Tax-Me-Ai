"use client";

import { useEffect, useState } from "react";

function formatMYR(value: number) {
  return `RM ${(value / 1000).toFixed(0)}K+`;
}

export default function LiveStats() {
  const [claimable, setClaimable] = useState(612000);
  const [scanned, setScanned] = useState(2140);
  const [users, setUsers] = useState(410);

  useEffect(() => {
    const id = setInterval(() => {
      setClaimable((v) => v + Math.round(Math.random() * 350));
      setScanned((v) => v + (Math.random() > 0.6 ? 1 : 0));
      setUsers((v) => (Math.random() > 0.9 ? v + 1 : v));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5 font-medium text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          LIVE
        </span>
        <span>Refreshes every few seconds</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-lg font-semibold text-accent sm:text-xl">
            {formatMYR(claimable)}
          </div>
          <div className="text-[11px] text-muted">claimable tracked</div>
        </div>
        <div>
          <div className="text-lg font-semibold sm:text-xl">{scanned}+</div>
          <div className="text-[11px] text-muted">receipts scanned</div>
        </div>
        <div>
          <div className="text-lg font-semibold sm:text-xl">{users}+</div>
          <div className="text-[11px] text-muted">users</div>
        </div>
      </div>
    </div>
  );
}
