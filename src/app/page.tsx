"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FenceCalculator from "@/components/FenceCalculator";
import DeckCalculator from "@/components/DeckCalculator";

export default function Home() {
  return (
    <main className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-afr-navy border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Image
            src="/afr-logo.png"
            alt="AFR Stain & Seal"
            width={60}
            height={60}
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-white">Quick Pricing Calculator</h1>
            <p className="text-sm text-muted-foreground">AFR Stain & Seal LLC</p>
          </div>
        </div>
      </div>

      {/* Calculator */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Tabs defaultValue="fence" className="w-full">
          <TabsList className="w-full h-14 bg-afr-navy/50 p-1">
            <TabsTrigger
              value="fence"
              className="flex-1 h-full text-lg data-[state=active]:bg-afr-red data-[state=active]:text-white"
            >
              Fence
            </TabsTrigger>
            <TabsTrigger
              value="deck"
              className="flex-1 h-full text-lg data-[state=active]:bg-afr-red data-[state=active]:text-white"
            >
              Deck
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fence" className="mt-6">
            <FenceCalculator />
          </TabsContent>
          <TabsContent value="deck" className="mt-6">
            <DeckCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
