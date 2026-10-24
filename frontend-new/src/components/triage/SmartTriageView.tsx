import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DuplicateCheckTab } from "./DuplicateCheckTab";
import { BureauTriageTab } from "./BureauTriageTab";
import { Sparkles, Search, Layers, ShieldCheck } from "lucide-react";

export function SmartTriageView() {
  const [activeTab, setActiveTab] = useState<"duplicate" | "bureau">("duplicate");

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Smart Triage & Duplicate Intelligence
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Explainable AI decision-support for duplicate case detection, jurisdictional bureau routing, and SLA priority assignment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border px-3 py-1.5 rounded-md self-start md:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Statutory AICTE Multi-Factor Model</span>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "duplicate" | "bureau")}
        className="space-y-6"
      >
        <div className="border-b border-border/80 pb-px">
          <TabsList className="bg-muted/60 p-1 rounded-lg">
            <TabsTrigger
              value="duplicate"
              className="text-xs font-semibold gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs py-2 px-4 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Duplicate Check & Semantic Overlap</span>
            </TabsTrigger>

            <TabsTrigger
              value="bureau"
              className="text-xs font-semibold gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs py-2 px-4 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Bureau Triage & Jurisdictional Classification</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="duplicate" className="m-0 focus-visible:outline-none">
          <DuplicateCheckTab />
        </TabsContent>

        <TabsContent value="bureau" className="m-0 focus-visible:outline-none">
          <BureauTriageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
