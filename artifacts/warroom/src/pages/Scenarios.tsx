import React, { useState } from "react";
import { useGetScenarios } from "@workspace/api-client-react";
import { FileText, Edit2 } from "lucide-react";

export default function Scenarios() {
  const { data: scenarios, isLoading } = useGetScenarios();
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="h-full flex">
      <div className="w-1/3 border-r border-border bg-background/50 flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-display font-bold text-foreground">Scenarios</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {scenarios?.map(s => (
            <div key={s.id} onClick={() => setSelected(s)} className={`p-4 border rounded-xl cursor-pointer transition-colors ${selected?.id === s.id ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-white/20'}`}>
              <h3 className="font-bold font-display text-lg">{s.name}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1 uppercase">{s.status}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-background p-8 flex flex-col h-full">
        {selected ? (
          <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border bg-background/50 flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold">{selected.name}</h2>
              <button className="flex items-center gap-2 text-sm bg-secondary px-3 py-1.5 rounded text-white hover:bg-white/10">
                <Edit2 size={14} /> Edit Context
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto prose prose-invert max-w-none font-mono text-sm leading-relaxed text-muted-foreground">
              {selected.contextDocument || "No context document provided."}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono">
            Select a scenario to view context document.
          </div>
        )}
      </div>
    </div>
  );
}
