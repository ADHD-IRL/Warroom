import React, { useState } from "react";
import { useGetChains, useDeleteChain } from "@workspace/api-client-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Search, GitMerge, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Chains() {
  const { data: chains, isLoading, refetch } = useGetChains();
  const { mutateAsync: deleteChain } = useDeleteChain();
  const [selectedChain, setSelectedChain] = useState<any>(null);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left List */}
      <div className="w-1/3 border-r border-border bg-background/50 flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Chain Library</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search chains..." className="military-input pl-10" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground font-mono text-sm">Loading...</div>
          ) : chains?.length === 0 ? (
             <div className="p-4 text-center text-muted-foreground font-mono text-sm">No chains found.</div>
          ) : (
            chains?.map(chain => (
              <div 
                key={chain.id}
                onClick={() => setSelectedChain(chain)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedChain?.id === chain.id ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-white/20'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-foreground font-display text-lg">{chain.name}</h3>
                  {chain.isAiGenerated && <span className="text-[10px] text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono">AI</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1"><GitMerge size={12}/> {chain.steps?.length || 0} Steps</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Builder / Preview */}
      <div className="flex-1 bg-background flex flex-col relative h-full">
        {!selectedChain ? (
          <EmptyState 
            image={`${import.meta.env.BASE_URL}images/empty-chains.png`}
            title="Compound Attack Chains"
            description="Select a chain from the library to view its steps, or build a new one to map out multi-discipline scenarios."
            action={
              <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-md uppercase tracking-wider font-display">
                Create New Chain
              </button>
            }
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-8 border-b border-border bg-card/50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-display font-bold text-foreground mb-2">{selectedChain.name}</h2>
                  <p className="text-muted-foreground max-w-2xl">{selectedChain.description}</p>
                </div>
                <button 
                  onClick={async () => {
                    await deleteChain({ id: selectedChain.id });
                    setSelectedChain(null);
                    refetch();
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[length:100px_100px] opacity-[0.99] mix-blend-overlay">
              <div className="max-w-3xl mx-auto space-y-6">
                {selectedChain.steps?.sort((a: any, b: any) => a.stepNumber - b.stepNumber).map((step: any, idx: number) => (
                  <div key={step.id} className="relative">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-card border border-border rounded-xl p-6 shadow-lg relative z-10"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-primary border border-border">
                          {step.stepNumber}
                        </div>
                        <h4 className="font-bold text-foreground font-display tracking-wide uppercase">
                          {step.agentLabel || `Agent ${step.agentId}`}
                        </h4>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.stepText}
                      </p>
                    </motion.div>
                    
                    {idx < (selectedChain.steps?.length || 0) - 1 && (
                      <div className="absolute left-10 top-full h-6 border-l-2 border-dashed border-primary/30 z-0 flex items-center justify-center translate-y-[-4px]">
                        <div className="absolute -bottom-2 text-primary/50 translate-x-[-1px]">▼</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
