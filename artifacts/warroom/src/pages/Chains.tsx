import React, { useState } from "react";
import {
  useGetChains,
  useCreateChain,
  useDeleteChain,
  useGenerateChain,
  useGetDomains,
  useGetScenarios,
  useGetAgents,
} from "@workspace/api-client-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Search, GitMerge, Trash2, X, Zap, Loader2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CHAIN_TYPES = ["Attack Sequence", "Escalation Path", "Response/Recovery", "Influence Operation", "Supply Chain Compromise", "Other"];

// ── Step builder row ─────────────────────────────────────────────────────────
interface StepDraft {
  agentLabel: string;
  stepText: string;
}

function StepRow({
  step,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  step: StepDraft;
  index: number;
  total: number;
  onChange: (s: StepDraft) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex gap-3 items-start bg-background/40 rounded-xl border border-border/60 p-4">
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronUp size={14} />
        </button>
        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-primary border border-border text-xs">
          {index + 1}
        </div>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <input
          className="military-input text-sm"
          placeholder="Agent / Discipline label (e.g. HUMINT Officer)"
          value={step.agentLabel}
          onChange={(e) => onChange({ ...step, agentLabel: e.target.value })}
        />
        <textarea
          className="military-input resize-none h-20 text-sm"
          placeholder="Describe what happens in this step and why it matters…"
          value={step.stepText}
          onChange={(e) => onChange({ ...step, stepText: e.target.value })}
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={total <= 1}
        className="mt-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function ChainModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (chain: any) => void;
}) {
  const { data: domains = [] } = useGetDomains();
  const { data: scenarios = [] } = useGetScenarios();
  const { data: agents = [] } = useGetAgents({});
  const { mutateAsync: createChain } = useCreateChain();
  const { mutateAsync: generateChain } = useGenerateChain();
  const { toast } = useToast();

  const [mode, setMode] = useState<"AI" | "MANUAL">("AI");

  // AI state
  const [aiContext, setAiContext] = useState("");
  const [aiScenarioId, setAiScenarioId] = useState("");
  const [aiDomainId, setAiDomainId] = useState("");
  const [aiChainType, setAiChainType] = useState(CHAIN_TYPES[0]);
  const [aiNumSteps, setAiNumSteps] = useState(4);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<number>>(new Set());

  // Manual state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manualDomainId, setManualDomainId] = useState("");
  const [manualScenarioId, setManualScenarioId] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([
    { agentLabel: "", stepText: "" },
    { agentLabel: "", stepText: "" },
  ]);

  const [isBusy, setIsBusy] = useState(false);

  function toggleAgent(id: number) {
    const s = new Set(selectedAgentIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedAgentIds(s);
  }

  function updateStep(i: number, s: StepDraft) {
    setSteps((prev) => prev.map((p, idx) => (idx === i ? s : p)));
  }

  function deleteStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  function addStep() {
    setSteps((prev) => [...prev, { agentLabel: "", stepText: "" }]);
  }

  async function handleGenerate() {
    if (!aiContext.trim()) return;
    setIsBusy(true);
    try {
      const result = await generateChain({
        data: {
          scenarioContext: aiContext,
          agentIds: Array.from(selectedAgentIds),
          chainType: aiChainType,
          numSteps: aiNumSteps,
          domainId: aiDomainId ? Number(aiDomainId) : undefined,
          scenarioId: aiScenarioId ? Number(aiScenarioId) : undefined,
          focusArea: "",
        } as any,
      });
      toast({ title: "Chain Generated", description: result.name });
      onSuccess(result);
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Chain name is required", variant: "destructive" });
      return;
    }
    const filledSteps = steps.filter((s) => s.stepText.trim());
    if (filledSteps.length === 0) {
      toast({ title: "At least one step with text is required", variant: "destructive" });
      return;
    }
    setIsBusy(true);
    try {
      const result = await createChain({
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          domainId: manualDomainId ? Number(manualDomainId) : undefined,
          scenarioId: manualScenarioId ? Number(manualScenarioId) : undefined,
          isAiGenerated: false,
          tags: [],
          steps: filledSteps.map((s, i) => ({
            stepNumber: i + 1,
            agentLabel: s.agentLabel.trim() || undefined,
            stepText: s.stepText.trim(),
          })),
        },
      });
      toast({ title: "Chain Created", description: result.name });
      onSuccess(result);
    } catch {
      toast({ title: "Create failed", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/50 flex-shrink-0">
          <h2 className="text-xl font-display font-bold uppercase">New Compound Chain</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex gap-2 bg-background p-1 rounded-lg border border-border w-fit">
            <button
              onClick={() => setMode("AI")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase font-display transition-colors ${mode === "AI" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Zap size={14} /> AI Generate
            </button>
            <button
              onClick={() => setMode("MANUAL")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase font-display transition-colors ${mode === "MANUAL" ? "bg-secondary text-foreground border border-border" : "text-muted-foreground hover:text-foreground"}`}
            >
              Manual Build
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "AI" ? (
            <div className="space-y-5">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                Describe the scenario and Claude will generate a coherent multi-step chain that no single discipline would identify alone.
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Scenario Context <span className="text-primary">*</span>
                </label>
                <textarea
                  className="military-input resize-none h-28"
                  placeholder="Describe the strategic scenario, adversary intent, and environment…"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Chain Type</label>
                  <select className="military-input appearance-none" value={aiChainType} onChange={(e) => setAiChainType(e.target.value)}>
                    {CHAIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                    Number of Steps: <span className="text-primary">{aiNumSteps}</span>
                  </label>
                  <input
                    type="range" min={2} max={8} value={aiNumSteps}
                    onChange={(e) => setAiNumSteps(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-3"
                    style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${((aiNumSteps - 2) / 6) * 100}%, hsl(var(--border)) ${((aiNumSteps - 2) / 6) * 100}%)`, accentColor: "hsl(var(--primary))" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Domain</label>
                  <select className="military-input appearance-none" value={aiDomainId} onChange={(e) => setAiDomainId(e.target.value)}>
                    <option value="">— Any —</option>
                    {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Scenario</label>
                  <select className="military-input appearance-none" value={aiScenarioId} onChange={(e) => setAiScenarioId(e.target.value)}>
                    <option value="">— None —</option>
                    {scenarios.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Agent picker */}
              {agents.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                    Ground with Agents <span className="text-muted-foreground/60 normal-case font-sans tracking-normal text-[10px]">(optional — biases step assignments)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAgent(a.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedAgentIds.has(a.id)
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-white/20"
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form id="chain-form" onSubmit={handleManualSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Chain Name <span className="text-primary">*</span>
                </label>
                <input
                  className="military-input"
                  placeholder="e.g. The Silent Compromise"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Description</label>
                <textarea
                  className="military-input resize-none h-20"
                  placeholder="What does this chain represent overall?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Domain</label>
                  <select className="military-input appearance-none" value={manualDomainId} onChange={(e) => setManualDomainId(e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Scenario</label>
                  <select className="military-input appearance-none" value={manualScenarioId} onChange={(e) => setManualScenarioId(e.target.value)}>
                    <option value="">— None —</option>
                    {scenarios.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                    Steps <span className="text-primary">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
                </div>
                {steps.map((step, i) => (
                  <StepRow
                    key={i}
                    step={step}
                    index={i}
                    total={steps.length}
                    onChange={(s) => updateStep(i, s)}
                    onDelete={() => deleteStep(i)}
                    onMove={(dir) => moveStep(i, dir)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors text-sm font-display uppercase flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Step
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background/50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-bold uppercase font-display text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            Cancel
          </button>
          {mode === "AI" ? (
            <button
              onClick={handleGenerate}
              disabled={!aiContext.trim() || isBusy}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isBusy ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate Chain</>}
            </button>
          ) : (
            <button
              type="submit"
              form="chain-form"
              disabled={isBusy}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isBusy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Create Chain"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Chains() {
  const { data: chains, isLoading, refetch } = useGetChains();
  const { mutateAsync: deleteChain } = useDeleteChain();
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = (chains ?? []).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(chain: any) {
    if (!confirm(`Delete chain "${chain.name}"?`)) return;
    try {
      await deleteChain({ id: chain.id });
      if (selectedChain?.id === chain.id) setSelectedChain(null);
      toast({ title: "Chain deleted" });
      refetch();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Left List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-background/50 flex flex-col md:h-full max-h-64 md:max-h-none">
        <div className="p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-display font-bold text-foreground">Chain Library</h1>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-xs hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} /> New
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search chains…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="military-input pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground font-mono">No chains found.</p>
            </div>
          ) : (
            filtered.map((chain) => (
              <div
                key={chain.id}
                onClick={() => setSelectedChain(chain)}
                className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                  selectedChain?.id === chain.id
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="font-bold text-foreground font-display text-sm leading-tight flex-1 pr-2">{chain.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {chain.isAiGenerated && (
                      <span className="text-[9px] text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono">AI</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(chain); }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  {!chain.isAiGenerated && chain.isAiGenerated !== undefined && (
                    <span className="text-[9px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono opacity-0 group-hover:opacity-0">manual</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <GitMerge size={10} /> {chain.steps?.length ?? 0} step{chain.steps?.length !== 1 ? "s" : ""}
                  </span>
                  {chain.isAiGenerated && (
                    <span className="flex items-center gap-1 text-primary/70">
                      <Zap size={10} /> AI
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Detail / Empty */}
      <div className="flex-1 bg-background flex flex-col relative overflow-hidden">
        {!selectedChain ? (
          <EmptyState
            image={`${import.meta.env.BASE_URL}images/empty-chains.png`}
            title="Compound Attack Chains"
            description="Select a chain from the library to view its steps, or build a new one to map out multi-discipline scenarios."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg uppercase tracking-wider font-display hover:bg-primary/90 transition-colors"
              >
                Create New Chain
              </button>
            }
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chain header */}
            <div className="p-6 md:p-8 border-b border-border bg-card/50 flex-shrink-0">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedChain.isAiGenerated && (
                      <span className="flex items-center gap-1 text-[10px] text-primary/80 font-mono border border-primary/30 px-1.5 py-0.5 rounded">
                        <Zap size={9} /> AI GENERATED
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2 truncate">
                    {selectedChain.name}
                  </h2>
                  {selectedChain.description && (
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                      {selectedChain.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    {selectedChain.steps?.length ?? 0} steps
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(selectedChain)}
                  className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-2xl mx-auto space-y-4">
                {selectedChain.steps
                  ?.slice()
                  .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
                  .map((step: any, idx: number) => (
                    <div key={step.id ?? idx} className="relative">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-card border border-border rounded-xl p-5 shadow-lg relative z-10"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-primary border border-border text-sm flex-shrink-0">
                            {step.stepNumber}
                          </div>
                          <h4 className="font-bold text-foreground font-display tracking-wide uppercase text-sm">
                            {step.agentLabel || `Step ${step.stepNumber}`}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                          {step.stepText}
                        </p>
                      </motion.div>

                      {idx < (selectedChain.steps?.length ?? 0) - 1 && (
                        <div className="flex justify-start pl-[22px] py-1">
                          <div className="flex flex-col items-center">
                            <div className="w-px h-4 border-l-2 border-dashed border-primary/30" />
                            <div className="text-primary/40 text-[8px]">▼</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ChainModal
            onClose={() => setModalOpen(false)}
            onSuccess={(chain) => {
              setModalOpen(false);
              refetch();
              setSelectedChain(chain);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
