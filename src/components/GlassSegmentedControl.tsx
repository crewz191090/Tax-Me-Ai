"use client";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export default function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const count = options.length;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  return (
    <div
      className={`glass-segment ${className}`}
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
    >
      <div
        className="glass-segment-slider"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          left: `calc(0.25rem + ${index} * ((100% - 0.5rem) / ${count}))`,
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`glass-segment-btn ${opt.value === value ? "glass-segment-btn-active" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
