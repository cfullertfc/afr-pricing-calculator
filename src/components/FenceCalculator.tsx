"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
const FARM_COVERAGE = 26;
const LABOR_PER_DAY = 340;
const LF_PER_DAY = 400;
const FARM_LF_PER_DAY = 2000;
const CLEANING_RATE = 0.25;
const CLEANING_MINIMUM = 680;
const POOL_MASKING_COST = 250;

function isFarm(type: FenceType) {
  return type === "3_rail" || type === "4_rail";
}

function roundUpTo5(gallons: number): number {
  return Math.ceil(gallons / 5) * 5;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function ToggleButtons({
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
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex rounded-lg overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            !value
              ? "bg-afr-navy text-white"
              : "bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
        >
          {optionA}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            value
              ? "bg-afr-navy text-white"
              : "bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
        >
          {optionB}
        </button>
      </div>
    </div>
  );
}

function ResultRow({
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
  return (
    <div
      className={`flex justify-between items-center py-2 ${bold ? "font-semibold" : ""}`}
    >
      <span className={large ? "text-lg" : ""}>{label}</span>
      <span
        className={`text-right ${bold ? "font-bold" : ""} ${large ? "text-xl" : ""} ${
          warning ? "text-warning" : ""
        } ${success ? "text-success" : ""}`}
      >
        {value}
      </span>
    </div>
  );
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

  useEffect(() => {
    if (prevStained) setOilBased(false);
  }, [prevStained]);

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
  const lfPerDay = farm ? FARM_LF_PER_DAY : LF_PER_DAY;
  const autoLaborDays = linearFeet > 0 ? Math.ceil(linearFeet / lfPerDay) : 1;
  const totalLaborDays = Math.max(autoLaborDays, 1) + additionalLaborDays;
  const laborCost = totalLaborDays * LABOR_PER_DAY;

  // Cleaning
  let cleaningCost = 0;
  if (includeCleaning) {
    const cleaningSqFt = farm ? linearFeet * h : sqFt;
    const rateBasedCost = cleaningSqFt * CLEANING_RATE;
    cleaningCost = Math.max(rateBasedCost, CLEANING_MINIMUM);
  }

  const poolCost = poolMasking ? POOL_MASKING_COST : 0;
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

  const fenceLabel = FENCE_TYPE_OPTIONS.find((o) => o.value === fenceType)?.label ?? "";
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
          <CardHeader className="pb-4">
            <CardTitle className="text-afr-navy">Fence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linear-feet">Linear Feet</Label>
              <Input
                id="linear-feet"
                type="number"
                inputMode="decimal"
                min={0}
                value={linearFeet || ""}
                placeholder="0"
                onChange={(e) => setLinearFeet(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Fence Type</Label>
              <Select value={fenceType} onValueChange={(v) => { if (v) setFenceType(v as FenceType); }}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FENCE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showSides && (
              <ToggleButtons
                label="Sides"
                optionA="One Side"
                optionB="Both Sides"
                value={bothSides}
                onChange={setBothSides}
              />
            )}

            {showHeight && (
              <div className="space-y-2">
                <Label>Height</Label>
                <Select value={height} onValueChange={(v) => { if (v) setHeight(v); }}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-afr-navy">Stain & Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleButtons
              label="Stain Type"
              optionA="Oil-Based"
              optionB="Water-Based Solid"
              value={!oilBased}
              onChange={(v) => setOilBased(!v)}
            />

            <div className="flex items-center justify-between py-1">
              <Label htmlFor="prev-stained">Previously Stained?</Label>
              <Switch id="prev-stained" checked={prevStained} onCheckedChange={setPrevStained} />
            </div>

            {!farm && (
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={(v) => { if (v) setCondition(v as Condition); }}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <Label htmlFor="cleaning">Include Cleaning?</Label>
              <Switch id="cleaning" checked={includeCleaning} onCheckedChange={setIncludeCleaning} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-afr-navy">Extras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="pool-masking">Pool Masking (+$250)</Label>
              <Switch id="pool-masking" checked={poolMasking} onCheckedChange={setPoolMasking} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="misc">Miscellaneous Upcharge</Label>
              <Input
                id="misc"
                type="number"
                inputMode="decimal"
                min={0}
                value={miscUpcharge || ""}
                placeholder="$0"
                onChange={(e) => setMiscUpcharge(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-labor">Additional Labor Days</Label>
              <Input
                id="extra-labor"
                type="number"
                inputMode="decimal"
                min={0}
                value={additionalLaborDays || ""}
                placeholder="0"
                onChange={(e) => setAdditionalLaborDays(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RESULTS */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-afr-navy">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {!farm && (
              <ResultRow label="Total Square Footage" value={sqFt.toLocaleString() + " sq ft"} />
            )}
            <ResultRow
              label="Exact Gallons Needed"
              value={`${gallonsNeeded.toFixed(1)} gal`}
            />
            <ResultRow
              label="Rounded (5-gal buckets)"
              value={`${roundedGallons} gal (${buckets} bucket${buckets !== 1 ? "s" : ""})`}
            />
            <ResultRow label="Stain Cost" value={fmt(stainCost)} />
            <ResultRow
              label={`Labor (${totalLaborDays} day${totalLaborDays !== 1 ? "s" : ""})`}
              value={fmt(laborCost)}
            />
            {includeCleaning && <ResultRow label="Cleaning" value={fmt(cleaningCost)} />}
            {poolMasking && <ResultRow label="Pool Masking" value={fmt(poolCost)} />}
            {miscUpcharge > 0 && <ResultRow label="Misc Upcharge" value={fmt(miscUpcharge)} />}
            <Separator className="my-2" />
            <ResultRow label="Total Cost" value={fmt(totalCost)} bold />
          </CardContent>
        </Card>

        <Card className="border-afr-navy/30 bg-afr-navy/5">
          <CardContent className="pt-6">
            <ResultRow label="Price to Customer" value={fmt(priceToCustomer)} bold large />
            <Separator className="my-2" />
            <ResultRow
              label="Gross Profit"
              value={fmt(grossProfit)}
              bold
              success={grossProfit > 0}
              warning={grossProfit <= 0}
            />
            <ResultRow
              label="Gross Margin"
              value={pct(grossMargin)}
              bold
              success={grossMargin >= 0.5}
              warning={grossMargin < 0.5}
            />
            {marginWarning && (
              <Badge variant="outline" className="mt-2 text-warning border-warning">
                Warning: Margin below 50%
              </Badge>
            )}
          </CardContent>
        </Card>

        <Button onClick={copySummary} className="w-full h-12 text-lg bg-afr-red hover:bg-afr-red-hover text-white">
          {copied ? "Copied!" : "Copy Summary"}
        </Button>
      </div>
    </div>
  );
}
