"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Operator = "+" | "-" | "×" | "÷";

function compute(a: number, b: number, op: Operator): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? 0 : a / b;
  }
}

function trimNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export default function GlassCalculator({
  initial,
  onChange,
  onClose,
}: {
  initial?: number;
  onChange: (value: number) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(
    initial && initial > 0 ? trimNumber(initial) : "0"
  );
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [expression, setExpression] = useState("");

  function emit(value: string) {
    const n = parseFloat(value);
    onChange(Number.isFinite(n) ? n : 0);
  }

  function inputDigit(d: string) {
    let next: string;
    if (overwrite) {
      next = d === "." ? "0." : d;
      setOverwrite(false);
    } else if (d === "." && current.includes(".")) {
      return;
    } else if (current.replace(/[-.]/g, "").length >= 9) {
      return;
    } else {
      next = current === "0" && d !== "." ? d : current + d;
    }
    setCurrent(next);
    emit(next);
  }

  function applyOperator(op: Operator) {
    const currentNum = parseFloat(current) || 0;
    if (previous !== null && operator && !overwrite) {
      const result = compute(previous, currentNum, operator);
      setPrevious(result);
      setExpression(`${trimNumber(result)} ${op}`);
      setCurrent(trimNumber(result));
      emit(trimNumber(result));
    } else {
      setPrevious(currentNum);
      setExpression(`${trimNumber(currentNum)} ${op}`);
    }
    setOperator(op);
    setOverwrite(true);
  }

  function equals() {
    if (previous === null || operator === null) return;
    const currentNum = parseFloat(current) || 0;
    const result = compute(previous, currentNum, operator);
    setExpression(`${trimNumber(previous)} ${operator} ${trimNumber(currentNum)} =`);
    setCurrent(trimNumber(result));
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
    emit(trimNumber(result));
  }

  function clear() {
    setCurrent("0");
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
    setExpression("");
    emit("0");
  }

  function backspace() {
    if (overwrite) return;
    const next = current.length > 1 ? current.slice(0, -1) : "0";
    setCurrent(next);
    if (next === "0") setOverwrite(true);
    emit(next);
  }

  function percent() {
    const n = (parseFloat(current) || 0) / 100;
    const next = trimNumber(n);
    setCurrent(next);
    setOverwrite(true);
    emit(next);
  }

  function toggleSign() {
    if (current === "0") return;
    const next = current.startsWith("-") ? current.slice(1) : `-${current}`;
    setCurrent(next);
    emit(next);
  }

  return (
    <div className="glass-calc" onClick={(e) => e.stopPropagation()}>
      <div className="glass-calc-header">
        <span>{t("upload.calculatorTitle")}</span>
        <button type="button" onClick={onClose} className="glass-calc-close" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="glass-calc-display">
        <div className="glass-calc-expression">{expression || " "}</div>
        <div className="glass-calc-current">{current}</div>
      </div>

      <div className="glass-calc-grid">
        <button type="button" className="glass-calc-btn glass-calc-btn-fn" onClick={clear}>
          C
        </button>
        <button type="button" className="glass-calc-btn glass-calc-btn-fn" onClick={backspace}>
          ⌫
        </button>
        <button type="button" className="glass-calc-btn glass-calc-btn-fn" onClick={percent}>
          %
        </button>
        <button
          type="button"
          className="glass-calc-btn glass-calc-btn-op"
          onClick={() => applyOperator("÷")}
        >
          ÷
        </button>

        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("7")}>
          7
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("8")}>
          8
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("9")}>
          9
        </button>
        <button
          type="button"
          className="glass-calc-btn glass-calc-btn-op"
          onClick={() => applyOperator("×")}
        >
          ×
        </button>

        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("4")}>
          4
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("5")}>
          5
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("6")}>
          6
        </button>
        <button
          type="button"
          className="glass-calc-btn glass-calc-btn-op"
          onClick={() => applyOperator("-")}
        >
          −
        </button>

        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("1")}>
          1
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("2")}>
          2
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("3")}>
          3
        </button>
        <button
          type="button"
          className="glass-calc-btn glass-calc-btn-op"
          onClick={() => applyOperator("+")}
        >
          +
        </button>

        <button type="button" className="glass-calc-btn glass-calc-btn-fn" onClick={toggleSign}>
          ±
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit("0")}>
          0
        </button>
        <button type="button" className="glass-calc-btn" onClick={() => inputDigit(".")}>
          .
        </button>
        <button type="button" className="glass-calc-btn glass-calc-btn-equals" onClick={equals}>
          =
        </button>
      </div>
    </div>
  );
}
