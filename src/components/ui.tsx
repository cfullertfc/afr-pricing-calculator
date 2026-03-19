"use client";

import React from "react";

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  placeholder = "0",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-lg text-foreground text-lg focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-lg text-foreground text-lg focus:outline-none focus:border-accent transition-colors appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({
  label,
  optionA,
  optionB,
  value,
  onChange,
}: {
  label: string;
  optionA: string;
  optionB: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1">{label}</label>
      <div className="flex rounded-lg overflow-hidden border border-input-border">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            !value
              ? "bg-accent text-white"
              : "bg-input-bg text-muted hover:text-foreground"
          }`}
        >
          {optionA}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            value
              ? "bg-accent text-white"
              : "bg-input-bg text-muted hover:text-foreground"
          }`}
        >
          {optionB}
        </button>
      </div>
    </div>
  );
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-input-border"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function ResultRow({
  label,
  value,
  bold,
  large,
  warning,
  success,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
  warning?: boolean;
  success?: boolean;
}) {
  const valueClass = [
    "text-right",
    bold ? "font-bold" : "",
    large ? "text-xl" : "",
    warning ? "text-warning" : "",
    success ? "text-success" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`flex justify-between items-center py-2 ${bold ? "font-semibold" : ""}`}>
      <span className={large ? "text-lg" : ""}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

export function Divider() {
  return <hr className="border-card-border my-1" />;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card-bg border border-card-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}
