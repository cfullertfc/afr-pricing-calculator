"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const STAIN_COST_PER_BUCKET = 190;
const DECK_COVERAGE = 250;
const LABOR_PER_DAY = 340;
const CLEANING_RATE_DECK = 2;
const CLEANING_MINIMUM = 680;
const POOL_MASKING_COST = 250;
const FLOOR_RATE = 3;
const RAILING_RATE = 10;
const STEP_RATE = 25;
const POST_RATE = 15;
const TWO_STORY_UPCHARGE = 150;

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
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {optionA}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
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
    <div className={`flex justify-between items-center py-2 ${bold ? "font-semibold" : ""}`}>
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

export default function DeckCalculator() {
  const [floorSqFt, setFloorSqFt] = useState(0);
  const [railingLf, setRailingLf] = useState(0);
  const [numSteps, setNumSteps] = useState(0);
  const [numPosts, setNumPosts] = useState(0);
  const [twoStory, setTwoStory] = useState(false);
  const [prevStained, setPrevStained] = useState(false);
  const [oilBased, setOilBased] = useState(true);
  const [includeCleaning, setIncludeCleaning] = useState(false);
  const [poolMasking, setPoolMasking] = useState(false);
  const [miscUpcharge, setMiscUpcharge] = useState(0);
  const [additionalLaborDays, setAdditionalLaborDays] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prevStained) setOilBased(false);
  }, [prevStained]);

  // Stain
  const gallonsNeeded = floorSqFt / DECK_COVERAGE;
  const roundedGallons = roundUpTo5(gallonsNeeded);
  const buckets = roundedGallons / 5;
  const stainCost = buckets * STAIN_COST_PER_BUCKET;

  // Customer price components
  const floorPrice = floorSqFt * FLOOR_RATE;
  const railingPrice = railingLf * RAILING_RATE;
  const stepsPrice = numSteps * STEP_RATE;
  const postsPrice = numPosts * POST_RATE;
  const twoStoryPrice = twoStory ? TWO_STORY_UPCHARGE : 0;

  let cleaningPrice = 0;
  if (includeCleaning) {
    const rateBasedCost = floorSqFt * CLEANING_RATE_DECK;
    cleaningPrice = Math.max(rateBasedCost, CLEANING_MINIMUM);
  }

  const poolCost = poolMasking ? POOL_MASKING_COST : 0;

  const totalPrice =
    floorPrice + railingPrice + stepsPrice + postsPrice + twoStoryPrice + cleaningPrice + poolCost + miscUpcharge;

  // Cost
  const baseLaborDays = 1;
  const totalLaborDays = baseLaborDays + additionalLaborDays;
  const laborCost = totalLaborDays * LABOR_PER_DAY;
  const totalCost = stainCost + laborCost;

  // Profit
  const grossProfit = totalPrice - totalCost;
  const grossMargin = totalPrice > 0 ? grossProfit / totalPrice : 0;

  const stainLabel = oilBased ? "Oil-Based" : "Water-Based Solid";

  const buildSummary = useCallback(() => {
    const lines = [
      "AFR Stain & Seal — Quick Quote",
      "",
      `Deck: ${floorSqFt} sq ft floor`,
    ];
    if (railingLf > 0) lines.push(`Railing: ${railingLf} LF`);
    if (numSteps > 0) lines.push(`Steps: ${numSteps}`);
    if (numPosts > 0) lines.push(`Posts: ${numPosts}`);
    if (twoStory) lines.push("Two-Story: Yes");
    lines.push(
      `Stain: ${stainLabel} — ${buckets} bucket${buckets !== 1 ? "s" : ""} (${roundedGallons} gal)`,
      `Stain Cost: ${fmt(stainCost)}`,
      `Labor: ${fmt(laborCost)} (${totalLaborDays} day${totalLaborDays !== 1 ? "s" : ""})`,
    );
    if (includeCleaning) lines.push(`Cleaning: ${fmt(cleaningPrice)}`);
    if (poolMasking) lines.push(`Pool Masking: ${fmt(poolCost)}`);
    if (miscUpcharge > 0) lines.push(`Misc Upcharge: ${fmt(miscUpcharge)}`);
    lines.push(
      `Total Cost: ${fmt(totalCost)}`,
      `Price to Customer: ${fmt(totalPrice)}`,
      `Gross Profit: ${fmt(grossProfit)}`,
      `Gross Margin: ${pct(grossMargin)}`
    );
    return lines.join("\n");
  }, [
    floorSqFt, railingLf, numSteps, numPosts, twoStory, stainLabel, buckets,
    roundedGallons, stainCost, laborCost, totalLaborDays, includeCleaning,
    cleaningPrice, poolMasking, poolCost, miscUpcharge, totalCost, totalPrice,
    grossProfit, grossMargin,
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
            <CardTitle className="text-afr-red">Deck Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="floor-sqft">Floor Square Footage</Label>
              <Input
                id="floor-sqft"
                type="number"
                inputMode="decimal"
                min={0}
                value={floorSqFt || ""}
                placeholder="0"
                onChange={(e) => setFloorSqFt(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="railing-lf">Linear Feet of Railing</Label>
              <Input
                id="railing-lf"
                type="number"
                inputMode="decimal"
                min={0}
                value={railingLf || ""}
                placeholder="0"
                onChange={(e) => setRailingLf(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-steps">Number of Steps</Label>
              <Input
                id="num-steps"
                type="number"
                inputMode="decimal"
                min={0}
                value={numSteps || ""}
                placeholder="0"
                onChange={(e) => setNumSteps(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-posts">Number of Posts</Label>
              <Input
                id="num-posts"
                type="number"
                inputMode="decimal"
                min={0}
                value={numPosts || ""}
                placeholder="0"
                onChange={(e) => setNumPosts(Number(e.target.value) || 0)}
                className="text-lg h-12"
              />
            </div>

            <ToggleButtons
              label="Stories"
              optionA="One Story"
              optionB="Two Story"
              value={twoStory}
              onChange={setTwoStory}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-afr-red">Stain & Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="deck-prev-stained">Previously Stained?</Label>
              <Switch id="deck-prev-stained" checked={prevStained} onCheckedChange={setPrevStained} />
            </div>

            <ToggleButtons
              label="Stain Type"
              optionA="Oil-Based"
              optionB="Water-Based Solid"
              value={!oilBased}
              onChange={(v) => setOilBased(!v)}
            />

            <div className="flex items-center justify-between py-1">
              <Label htmlFor="deck-cleaning">Include Cleaning?</Label>
              <Switch id="deck-cleaning" checked={includeCleaning} onCheckedChange={setIncludeCleaning} />
            </div>

            <div className="flex items-center justify-between py-1">
              <Label htmlFor="deck-pool">Pool Masking (+$250)</Label>
              <Switch id="deck-pool" checked={poolMasking} onCheckedChange={setPoolMasking} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deck-misc">Miscellaneous Upcharge</Label>
              <Input
                id="deck-misc"
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
              <Label htmlFor="deck-extra-labor">Additional Labor Days</Label>
              <Input
                id="deck-extra-labor"
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
            <CardTitle className="text-afr-red">Stain Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultRow
              label="Gallons of Stain"
              value={`${roundedGallons} gal (${buckets} bucket${buckets !== 1 ? "s" : ""})`}
            />
            <ResultRow label="Stain Cost" value={fmt(stainCost)} />
            <ResultRow
              label={`Labor (${totalLaborDays} day${totalLaborDays !== 1 ? "s" : ""})`}
              value={fmt(laborCost)}
            />
            <Separator className="my-2" />
            <ResultRow label="Total Cost" value={fmt(totalCost)} bold />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-afr-red">Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultRow label="Floor Staining" value={fmt(floorPrice)} />
            {railingLf > 0 && <ResultRow label="Railing" value={fmt(railingPrice)} />}
            {numSteps > 0 && <ResultRow label="Steps" value={fmt(stepsPrice)} />}
            {numPosts > 0 && <ResultRow label="Posts" value={fmt(postsPrice)} />}
            {twoStory && <ResultRow label="Two-Story Upcharge" value={fmt(twoStoryPrice)} />}
            {includeCleaning && <ResultRow label="Cleaning" value={fmt(cleaningPrice)} />}
            {poolMasking && <ResultRow label="Pool Masking" value={fmt(poolCost)} />}
            {miscUpcharge > 0 && <ResultRow label="Misc Upcharge" value={fmt(miscUpcharge)} />}
            <Separator className="my-2" />
            <ResultRow label="Total Price" value={fmt(totalPrice)} bold />
          </CardContent>
        </Card>

        <Card className="border-afr-red/40 bg-afr-red/5">
          <CardContent className="pt-6">
            <ResultRow label="Price to Customer" value={fmt(totalPrice)} bold large />
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
          </CardContent>
        </Card>

        <Button onClick={copySummary} className="w-full h-12 text-lg bg-afr-red hover:bg-afr-red-hover text-white">
          {copied ? "Copied!" : "Copy Summary"}
        </Button>
      </div>
    </div>
  );
}
