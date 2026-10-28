"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { isValidQuad, type Quad } from "@/lib/receiptCrop";

type Corner = keyof Quad;
const CORNERS: Corner[] = ["tl", "tr", "br", "bl"];

/**
 * Lets the user drag the four corners of the crop onto the receipt's edges.
 * Positions are 0..1 fractions of the image, so the result is independent
 * of how large the photo happens to be drawn on screen.
 */
export default function CropEditor({
  imageSrc,
  initialQuad,
  resetQuad,
  onApply,
  onUseOriginal,
  onCancel,
}: {
  imageSrc: string;
  initialQuad: Quad;
  resetQuad: Quad;
  onApply: (quad: Quad) => void;
  onUseOriginal: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [quad, setQuad] = useState<Quad>(initialQuad);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<Corner | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function moveCorner(corner: Corner, clientX: number, clientY: number) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setQuad((q) => ({ ...q, [corner]: { x, y } }));
  }

  const valid = isValidQuad(quad);
  const outline = CORNERS.map((c) => `${quad[c].x} ${quad[c].y}`).join(" L ");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass glow-border flex max-h-[92vh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-2xl border border-border p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-sm font-semibold">{t("crop.title")}</h3>
          <p className="mt-0.5 text-xs text-muted">{t("crop.hint")}</p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <div ref={frameRef} className="relative w-fit touch-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="block max-h-[58vh] max-w-full rounded-lg"
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              <path
                fillRule="evenodd"
                d={`M0 0H1V1H0Z M${outline} Z`}
                fill="rgba(0,0,0,0.55)"
              />
              <path
                d={`M${outline} Z`}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {CORNERS.map((corner) => (
              <button
                key={corner}
                type="button"
                aria-label={corner}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragging.current = corner;
                }}
                onPointerMove={(e) => {
                  if (dragging.current === corner) moveCorner(corner, e.clientX, e.clientY);
                }}
                onPointerUp={() => {
                  dragging.current = null;
                }}
                onPointerCancel={() => {
                  dragging.current = null;
                }}
                className="absolute h-9 w-9 cursor-grab touch-none rounded-full border-2 border-accent bg-accent/30 shadow-[0_0_10px_rgba(34,211,238,0.7)] active:cursor-grabbing"
                style={{
                  left: `${quad[corner].x * 100}%`,
                  top: `${quad[corner].y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setQuad(resetQuad)}
              className="btn-pill btn-pill-outline btn-pill-sm"
            >
              {t("crop.reset")}
            </button>
            <button
              type="button"
              onClick={onUseOriginal}
              className="btn-pill btn-pill-outline btn-pill-sm"
            >
              {t("crop.useOriginal")}
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="btn-pill btn-pill-outline btn-pill-sm">
              {t("upload.cancel")}
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => onApply(quad)}
              className="btn-pill btn-pill-primary btn-pill-sm disabled:opacity-50"
            >
              {t("crop.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
