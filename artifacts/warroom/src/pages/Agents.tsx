import React, { useState } from "react";
import { useGetAgents, useCreateAgent, useDeleteAgent, useGenerateAgent } from "@workspace/api-client-react";
import { AgentCard } from "@/components/shared/AgentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, Plus, Zap, X, Filter, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Agents() {
  const [search, setSearch] = useState("");
  const { data: agents, isLoading, refetch } = useGetAgents({ search });
  const { mutateAsync: deleteAgent } = useDeleteAgent();
  const { mutateAsync: createAgent } = useCreateAgent();
  const { mutateAsync: generateAgent } = useGenerateAgent();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"MANUAL" | "AI">("AI");
  const [isGenerating, setIsGenerating] = useState(false);

  // Form states
  const [expertType, setExpertType] = useState("");
  const [domain, setDomain] = useState("Defense Acquisition");
  const [focusArea, setFocusArea] = useState("");

  const handleDelete = async (agent: any) => {
    if (confirm(`Delete agent ${agent.name}?`)) {
      await deleteAgent({ id: agent.id });
      toast({ title: "Agent deleted" });
      refetch();
    }
  };

  const handleGenerate = async () => {
    if (!expertType) return;
    setIsGenerating(true);
    try {
      await generateAgent({ data: { expert_type: expertType, domain, key_focus_area: focusArea } });
      toast({ title: "Agent Generated", description: "Successfully created via AI" });
      setIsModalOpen(false);
      refetch();
    } catch (e) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Topbar */}
      <div className="h-20 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-8 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agent Library</h1>
          <p className="text-sm text-muted-foreground font-mono">Manage expert personas for scenario analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search agents..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="military-input pl-10 w-64"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(240,165,0,0.2)] uppercase font-display"
          >
            <Plus size={18} /> New Agent
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : agents?.length === 0 ? (
          <EmptyState 
            image={`${import.meta.env.BASE_URL}images/empty-agents.png`}
            title="Your Agent Library is Empty"
            description="Agents are the expert archetypes that power every WARROOM session. Build them manually or let AI generate a profile from a description."
            action={
              <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 font-display uppercase tracking-widest">
                Create First Agent
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents?.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent as any} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-background/50">
                <h2 className="text-xl font-display font-bold uppercase">Add New Agent</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-background p-1 rounded-lg border border-border inline-flex">
                  <button 
                    onClick={() => setMode("AI")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase font-display transition-colors ${mode === "AI" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
                  >
                    <Zap size={16} /> AI Generate
                  </button>
                  <button 
                    onClick={() => setMode("MANUAL")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase font-display transition-colors ${mode === "MANUAL" ? "bg-secondary text-white border border-border" : "text-muted-foreground hover:text-white"}`}
                  >
                    Manual Build
                  </button>
                </div>

                {mode === "AI" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-muted-foreground uppercase">Expert Type / Role</label>
                      <input 
                        type="text" 
                        value={expertType}
                        onChange={e => setExpertType(e.target.value)}
                        placeholder="e.g. Offensive Cyber Operator, Maritime Strategist..." 
                        className="military-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-muted-foreground uppercase">Domain</label>
                      <select value={domain} onChange={e => setDomain(e.target.value)} className="military-input appearance-none">
                        <option>Defense Acquisition</option>
                        <option>Energy & Infrastructure</option>
                        <option>Geopolitics & Economics</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-muted-foreground uppercase">Key Focus Area (Optional)</label>
                      <textarea 
                        value={focusArea}
                        onChange={e => setFocusArea(e.target.value)}
                        placeholder="Specific focus to bias the agent towards..." 
                        className="military-input h-24 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Manual builder requires full form implementation.</p>
                    <p className="text-sm mt-2">Use AI Generation for faster creation.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-md font-bold uppercase font-display text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={!expertType || isGenerating}
                  className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md font-display uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : "Generate Profile"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
