import React from "react";
import { useGetThreats } from "@workspace/api-client-react";
import { Target } from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";

export default function Threats() {
  const { data: threats, isLoading } = useGetThreats();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Threat Registry</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded font-display uppercase">Add Threat</button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-background/50 border-b border-border font-mono text-xs text-muted-foreground uppercase">
            <tr>
              <th className="p-4 font-medium">Threat Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Severity</th>
              <th className="p-4 font-medium">Domain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {threats?.map(threat => (
              <tr key={threat.id} className="hover:bg-white/5 transition-colors cursor-pointer">
                <td className="p-4 font-bold text-foreground">{threat.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{threat.category}</td>
                <td className="p-4"><SeverityBadge severity={threat.severity} /></td>
                <td className="p-4 text-sm font-mono text-muted-foreground">Domain {threat.domainId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
