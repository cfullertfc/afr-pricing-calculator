"use client";

import { useState, useEffect, useCallback } from "react";
import {
  NumberInput,
  Select,
  Toggle,
  ToggleSwitch,
  ResultRow,
  Divider,
  Card,
  fmt,
  pct,
} from "./ui";

type FenceType = "standard_privacy" | "shadow_box" | "3_rail" | "4_rail";
type Condition = "new" | "good" | "weathered";

const FENCE_TYPE_OPTIONS = [
  { value: "standard_privacy", label: "Standard Privacy" },
  { value: "shadow_box", label: "Shadow Box" },
  { value: "3_rail", label: "3-Rail Farm" },
  { value: "4_rail", label: "4-Rail Farm" },
];

const HEIGHT_OPTIONS = [
  { value: "4", label: "4 ft" },
  { value: "6", label: "6 ft" },
  { value: "8", label: "8 ft" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "weathered", label: "Weathered" },
];

const STAIN_COST_PER_BUCKET = 190;
const OIL_COVERAGE = 140;
const WATER_COVERAGE = 165;
const FARM_COVERAGE = 16; // 1 gal per 16 LF
const LABOR_PER_DAY = 340;
const LF_PER_DAY = 400;
const CLEANING_RATE = 0.25;
const CLEANING_MINIMUM = 680;
const POOL_MASKING_COST = 250;

function isFarm(type: FenceType) {
  return type === "3_rail" || type === "4_rail";
}

function roundUpTo5(gallons: number): number {
  return Math.ceil(gallons / 5) * 5;
}

export default function FenceCalculator() {
  const [linearFeet, setLinearFeet] = useState(0);
  const [fenceType, setFenceType] = useState<FenceType>("standard_privacy");
  const [bothSides, setBothSides] = useState(true);
  const [height, setHeight] = useState("6");
  const [oilBased, setOilBased] = useState(true);
  const [prevStained, setPrevStained] = useState(false);
  const [condition, setCondition] = useState<Condition>("new");
  const [includeCleaning, setIncludeCleaning] = useState(false);
  const [poolMasking, setPoolMasking] = useState(false);
  const [miscUpcharge, setMiscUpcharge] = useState(0);
  const [additionalLaborDays, setAdditionalLaborDays] = useState(0);
  const [copied, setCopied] = useState(false);

  // When "previously stained" is toggled on, default to water-based
  useEffect(() => {
    if (prevStained) setOilBased(false);
  }, [prevStained]);

  // When condition is weathered, auto-enable cleaning
  useEffect(() => {
    if (condition === "weathered") setIncludeCleaning(true);
  }, [condition]);

  const farm = isFarm(fenceType);
  const showSides = fenceType === "standard_privacy" || fenceType === "shadow_box";
  const showHeight = showSides;
  const h = Number(height);

  // Square footage
  let sqFt = 0;
  if (!farm) {
    sqFt = linearFeet * h * (bothSides ? 2 : 1);
    if (fenceType === "shadow_box") sqFt *= 1.5;
  }

  // Stain
  let gallonsNeeded = 0;
  if (farm) {
    gallonsNeeded = linearFeet / FARM_COVERAGE;
  } else {
    const coverage = oilBased ? OIL_COVERAGE : WATER_COVERAGE;
    gallonsNeeded = sqFt / coverage;
  }
  const roundedGallons = roundUpTo5(gallonsNeeded);
  const buckets = roundedGallons / 5;
  const stainCost = buckets * STAIN_COST_PER_BUCKET;

  // Labor
  const autoLaborDays = linearFeet > 0 ? Math.ceil(linearFeet / LF_PER_DAY) : 1;
  const totalLaborDays = Math.max(autoLaborDays, 1) + additionalLaborDays;
  const laborCost = totalLaborDays * LABOR_PER_DAY;

  // Cleaning
  let cleaningCost = 0;
  if (includeCleaning) {
    const cleaningSqFt = farm ? linearFeet * h * (bothSides ? 2 : 1) : sqFt;
    const rateBasedCost = cleaningSqFt * CLEANING_RATE;
    cleaningCost = Math.max(rateBasedCost, CLEANING_MINIMUM);
  }

  // Pool masking
  const poolCost = poolMasking ? POOL_MASKING_COST : 0;

  // Totals
  const totalCost = stainCost + laborCost + cleaningCost + poolCost + miscUpcharge;

  let priceToCustomer = 0;
  let grossProfit = 0;
  let grossMargin = 0;

  if (farm) {
    const perLf = fenceType === "3_rail" ? 3 : 4;
    priceToCustomer = perLf * linearFeet;
    grossProfit = priceToCustomer - totalCost;
    grossMargin = priceToCustomer > 0 ? grossProfit / priceToCustomer : 0;
  } else {
    priceToCustomer = totalCost * 2;
    grossProfit = priceToCustomer - totalCost;
    grossMargin = priceToCustomer > 0 ? grossProfit / priceToCustomer : 0;
  }

  const marginWarning = farm && grossMargin < 0.5 && linearFeet > 0;

  const fenceLabel =
    FENCE_TYPE_OPTIONS.find((o) => o.value === fenceType)?.label ?? "";
  const stainLabel = oilBased ? "Oil-Based" : "Water-Based Solid";
  const sidesLabel = bothSides ? "Both Sides" : "One Side";

  const buildSummary = useCallback(() => {
    const lines = [
      "AFR Stain & Seal — Quick Quote",
      "",
      `Fence: ${linearFeet} LF ${fenceLabel}${showSides ? ` (${sidesLabel}, ${h}ft)` : ""}`,
      `Stain: ${stainLabel} — ${buckets} bucket${buckets !== 1 ? "s" : ""} (${roundedGallons} gal)`,
      `Stain Cost: ${fmt(stainCost)}`,
      `Labor: ${fmt(laborCost)} (${totalLaborDays} day${totalLaborDays !== 1 ? "s" : ""})`,
    ];
    if (includeCleaning) lines.push(`Cleaning: ${fmt(cleaningCost)}`);
    if (poolMasking) lines.push(`Pool Masking: ${fmt(poolCost)}`);
    if (miscUpcharge > 0) lines.push(`Misc Upcharge: ${fmt(miscUpcharge)}`);
    lines.push(
      `Total Cost: ${fmt(totalCost)}`,
      `Price to Customer: ${fmt(priceToCustomer)}`,
      `Gross Profit: ${fmt(grossProfit)}`,
      `Gross Margin: ${pct(grossMargin)}`
    );
    return lines.join("\n");
  }, [
    linearFeet, fenceLabel, showSides, sidesLabel, h, stainLabel, buckets,
    roundedGallons, stainCost, laborCost, totalLaborDays, includeCleaning,
    cleaningCost, poolMasking, poolCost, miscUpcharge, totalCost,
    priceToCustomer, grossProfit, grossMargin,
  ]);

  const copySummary = async () => {
    await navigator.clipboard.writeText(buildSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* INPUTS */}
      <div className="space-y-4">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-accent">Fence Details</h2>
          <div className="space-y-4">
            <NumberInput label="Linear Feet" value={linearFeet} onChange={setLinearFeet} />
            <Select
              label="Fence Type"
              value={fenceType}
              onChange={(v) => setFenceType(v as FenceType)}
              options={FENCE_TYPE_OPTIONS}
            />
            {showSides && (
              <Toggle
                label="Sides"
                optionA="One Side"
                optionB="Both Sides"
                value={bothSides}
                onChange={setBothSides}
              />
            )}
            {showHeight && (
              <Select label="Height" value={height} onChange={setHeight} options={HEIGHT_OPTIONS} />
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4 text-accent">Stain & Condition</h2>
          <div className="space-y-4">
            <Toggle
              label="Stain Type"
              optionA="Oil-Based"
              optionB="Water-Based Solid"
              value={!oilBased}
              onChange={(v) => setOilBased(!v)}
            />
            <ToggleSwitch label="Previously Stained?" checked={prevStained} onChange={setPrevStained} />
            {!farm && (
              <Select
                label="Condition"
                value={condition}
                onChange={(v) => setCondition(v as Condition)}
                options={CONDITION_OPTIONS}
              />
            )}
            <ToggleSwitch label="Include Cleaning?" checked={includeCleaning} onChange={setIncludeCleaning} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4 text-accent">Extras</h2>
          <div className="space-y-4">
            <ToggleSwitch label="Pool Masking (+$250)" checked={poolMasking} onChange={setPoolMasking} />
            <NumberInput label="Miscellaneous Upcharge" value={miscUpcharge} onChange={setMiscUpcharge} placeholder="$0" />
            <NumberInput label="Additional Labor Days" value={additionalLaborDays} onChange={setAdditionalLaborDays} />
          </div>
        </Card>
      </div>

      {/* RESULTS */}
      <div className="space-y-4">
        <Card className="border-accent/30">
          <h2 className="text-lg font-semibold mb-4 text-accent">Cost Breakdown</h2>
          {!farm && <ResultRow label="Total Square Footage" value={sqFt.toLocaleString() + " sq ft"} />}
          <ResultRow label="Gallons of Stain" value={`${roundedGallons} gal (${buckets} bucket${buckets !== 1 ? "s" : ""})`} />
          <ResultRow label="Stain Cost" value={fmt(stainCost)} />
          <ResultRow label={`Labor (${totalLaborDays} day${totalLaborDays !== 1 ? "s" : ""})`} value={fmt(laborCost)} />
          {includeCleaning && <ResultRow label="Cleaning" value={fmt(cleaningCost)} />}
          {poolMasking && <ResultRow label="Pool Masking" value={fmt(poolCost)} />}
          {miscUpcharge > 0 && <ResultRow label="Misc Upcharge" value={fmt(miscUpcharge)} />}
          <Divider />
          <ResultRow label="Total Cost" value={fmt(totalCost)} bold />
        </Card>

        <Card className="bg-accent/10 border-accent/40">
          <ResultRow label="Price to Customer" value={fmt(priceToCustomer)} bold large />
          <Divider />
          <ResultRow label="Gross Profit" value={fmt(grossProfit)} bold success={grossProfit > 0} warning={grossProfit <= 0} />
          <ResultRow
            label="Gross Margin"
            value={pct(grossMargin)}
            bold
            success={grossMargin >= 0.5}
            warning={grossMargin < 0.5 && grossMargin >= 0}
          />
          {marginWarning && (
            <p className="text-warning text-sm mt-2 font-medium">
              ⚠ Margin below 50% — review pricing
            </p>
          )}
        </Card>

        <button
          onClick={copySummary}
          className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-lg"
        >
          {copied ? "Copied!" : "Copy Summary"}
        </button>
      </div>
    </div>
  );
}
