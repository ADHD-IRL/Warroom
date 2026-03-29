import React from "react";
import { useGetDomains } from "@workspace/api-client-react";
import { Globe2 } from "lucide-react";

export default function Domains() {
  const { data: domains, isLoading } = useGetDomains();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Operational Domains</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded font-display uppercase">Add Domain</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains?.map(domain => (
          <div key={domain.id} className="bg-card rounded-xl p-6 border shadow-lg relative overflow-hidden" style={{ borderColor: `${domain.color}40` }}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: domain.color }} />
            <div className="flex items-center gap-3 mb-4">
              <Globe2 size={24} style={{ color: domain.color }} />
              <h2 className="text-xl font-display font-bold">{domain.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{domain.description}</p>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{domain.agentCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Agents</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{domain.scenarioCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Scenarios</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{domain.chainCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Chains</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
