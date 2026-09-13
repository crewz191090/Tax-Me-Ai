"use client";

import { useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { deductiblePercentForCategory } from "@/lib/categories";
import type { ExtractedReceipt, Receipt } from "@/lib/types";

type Status = "idle" | "scanning" | "review" | "saving" | "error";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadReceipt({
  onSaved,
}: {
  onSaved: (receipt: Receipt) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ExtractedReceipt | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(selectedFile: File) {
    setError(null);
    setStatus("scanning");
    setFile(selectedFile);

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      setPreview(dataUrl);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        extracted?: ExtractedReceipt;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error || "Failed to scan receipt.");
      }

      setDraft(json.extracted as ExtractedReceipt);
      setStatus("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  async function handleSave() {
    if (!draft) return;
    setStatus("saving");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("merchant", draft.merchant);
      formData.append("date", draft.date);
      formData.append("amount", String(draft.amount));
      formData.append("category", draft.category);
      formData.append("isEInvoice", String(Boolean(draft.isEInvoice)));
      if (file) formData.append("file", file);

      const res = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        receipt?: Receipt;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error || "Failed to save receipt.");
      }

      onSaved(json.receipt as Receipt);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setPreview(null);
    setFile(null);
    setDraft(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />

      {status === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
          }`}
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-2xl">
            📷
          </span>
          <p className="text-sm font-medium">
            Drop a receipt photo here, or click to upload
          </p>
          <p className="mt-1 text-xs text-muted">JPG, PNG or WEBP — up to 10MB</p>
        </div>
      )}

      {status === "scanning" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          {preview && (
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-40 rounded-lg border border-border object-contain"
            />
          )}
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Reading receipt with AI…
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={reset}
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface-2"
          >
            Try again
          </button>
        </div>
      )}

      {(status === "review" || status === "saving") && draft && (
        <div className="grid gap-6 md:grid-cols-2">
          {preview && (
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-72 w-full rounded-lg border border-border object-contain"
            />
          )}

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Review extracted details
            </p>

            <label className="text-xs text-muted">
              Merchant
              <input
                value={draft.merchant}
                onChange={(e) =>
                  setDraft({ ...draft, merchant: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                Date
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) =>
                    setDraft({ ...draft, date: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
              <label className="text-xs text-muted">
                Amount (RM)
                <input
                  type="number"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
            </div>

            <label className="text-xs text-muted">
              Category
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="text-muted">Deductible</span>
              <span className="font-semibold text-accent">
                {deductiblePercentForCategory(draft.category)}%
              </span>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                onClick={handleSave}
                disabled={status === "saving"}
                className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent-strong disabled:opacity-60"
              >
                {status === "saving" ? "Saving…" : "Save receipt"}
              </button>
              <button
                onClick={reset}
                disabled={status === "saving"}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
