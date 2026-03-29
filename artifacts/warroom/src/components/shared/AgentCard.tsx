import React from "react";
import { Agent } from "@workspace/api-client-react";
import { SeverityBadge } from "./SeverityBadge";
import { VectorBar } from "./VectorBar";
import { motion } from "framer-motion";
import { Settings, ShieldAlert, Zap, Edit2, Trash2 } from "lucide-react";

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  domainColor?: string;
}

export function AgentCard({ agent, onEdit, onDelete, domainColor = "var(--primary)" }: AgentCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-lg hover:shadow-primary/5 transition-all group relative"
    >
      {/* Top color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: domainColor }} />
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">
                AGT-{agent.id.toString().padStart(3, '0')}
              </span>
              {agent.isAiGenerated && (
                <span className="flex items-center gap-1 text-[10px] text-primary/80 font-mono">
                  <Zap size={10} /> AI GEN
                </span>
              )}
            </div>
            <h3 className="text-lg font-display font-bold text-foreground leading-tight">
              {agent.name}
            </h3>
            <p className="text-sm text-primary font-medium">{agent.discipline}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <SeverityBadge severity={agent.severityDefault} />
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={() => onEdit(agent)} className="p-1.5 text-muted-foreground hover:text-white bg-background rounded-md border border-border hover:border-white/20 transition-colors">
                  <Edit2 size={12} />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(agent)} className="p-1.5 text-muted-foreground hover:text-destructive bg-background rounded-md border border-border hover:border-destructive/50 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-background/40 border border-white/5 rounded-lg p-3 mb-4 min-h-[60px]">
          <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">
            "{agent.cognitiveBias}"
          </p>
        </div>

        <div className="space-y-2.5">
          <VectorBar label="Human" value={agent.vectorHuman || 0} />
          <VectorBar label="Technical" value={agent.vectorTechnical || 0} />
          <VectorBar label="Physical" value={agent.vectorPhysical || 0} />
          <VectorBar label="Futures" value={agent.vectorFutures || 0} />
        </div>

        {agent.tags && agent.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 pt-4 border-t border-border/50">
            {agent.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-white/5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
