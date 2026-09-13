import type { Receipt } from "@/lib/types";

export default function SummaryBar({ receipts }: { receipts: Receipt[] }) {
  const total = receipts.reduce((sum, r) => sum + r.amount, 0);
  const claimable = receipts.reduce(
    (sum, r) => sum + (r.amount * r.deductiblePercent) / 100,
    0
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="text-xs text-muted">Total receipts</div>
        <div className="mt-1 text-2xl font-bold">{receipts.length}</div>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="text-xs text-muted">Total spent</div>
        <div className="mt-1 text-2xl font-bold">RM {total.toFixed(2)}</div>
      </div>
      <div className="rounded-2xl border border-accent/40 bg-surface-2 p-5">
        <div className="text-xs text-muted">Claimable amount</div>
        <div className="mt-1 text-2xl font-bold text-accent">
          RM {claimable.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
