import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DuplicateCheckTab } from "./DuplicateCheckTab";
import { BureauTriageTab } from "./BureauTriageTab";
import { Sparkles, Search, Layers, ShieldCheck } from "lucide-react";

export function SmartTriageView() {
  const [activeTab, setActiveTab] = useState<"duplicate" | "bureau">("duplicate");

  return (
    <div className="container max-w-7xl mx-auto py-6 px-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Smart Triage
        </h1>
        <p className="text-xs text-muted-foreground">
          AI decision-support for duplicate case detection and jurisdictional classification.
        </p>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "duplicate" | "bureau")}
        className="space-y-6"
      >
        <div className="border-b border-border/50 pb-px">
          <TabsList className="bg-muted/40 p-1 rounded-lg">
            <TabsTrigger
              value="duplicate"
              className="text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs py-1.5 px-3 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 opacity-70" />
              <span>Duplicate Detection</span>
            </TabsTrigger>

            <TabsTrigger
              value="bureau"
              className="text-xs font-medium gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs py-1.5 px-3 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 opacity-70" />
              <span>Bureau Classification</span>
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
