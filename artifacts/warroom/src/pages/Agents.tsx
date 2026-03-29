import React, { useState, useEffect } from "react";
import {
  useGetAgents,
  useCreateAgent,
  useDeleteAgent,
  useGenerateAgent,
  useUpdateAgent,
  useGetDomains,
  Agent,
} from "@workspace/api-client-react";
import { AgentCard } from "@/components/shared/AgentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, Plus, Zap, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared form state shape ─────────────────────────────────────────────────
interface AgentFormState {
  name: string;
  discipline: string;
  domainId: string;
  severityDefault: string;
  personaDescription: string;
  cognitiveBias: string;
  redTeamFocus: string;
  vectorHuman: number;
  vectorTechnical: number;
  vectorPhysical: number;
  vectorFutures: number;
  tags: string; // comma-separated
}

const EMPTY_FORM: AgentFormState = {
  name: "",
  discipline: "",
  domainId: "",
  severityDefault: "HIGH",
  personaDescription: "",
  cognitiveBias: "",
  redTeamFocus: "",
  vectorHuman: 50,
  vectorTechnical: 50,
  vectorPhysical: 50,
  vectorFutures: 50,
  tags: "",
};

function agentToForm(agent: Agent): AgentFormState {
  return {
    name: agent.name ?? "",
    discipline: agent.discipline ?? "",
    domainId: agent.domainId != null ? String(agent.domainId) : "",
    severityDefault: agent.severityDefault ?? "HIGH",
    personaDescription: agent.personaDescription ?? "",
    cognitiveBias: agent.cognitiveBias ?? "",
    redTeamFocus: agent.redTeamFocus ?? "",
    vectorHuman: agent.vectorHuman ?? 50,
    vectorTechnical: agent.vectorTechnical ?? 50,
    vectorPhysical: agent.vectorPhysical ?? 50,
    vectorFutures: agent.vectorFutures ?? 50,
    tags: (agent.tags ?? []).join(", "),
  };
}

// ── Vector slider ───────────────────────────────────────────────────────────
function VectorSlider({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
          {label}
        </label>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} ${value}%, hsl(var(--border)) ${value}%)`,
            accentColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ── Manual Build Form ───────────────────────────────────────────────────────
function ManualForm({
  form,
  setForm,
  domains,
}: {
  form: AgentFormState;
  setForm: React.Dispatch<React.SetStateAction<AgentFormState>>;
  domains: { id: number; name: string }[];
}) {
  const field = (key: keyof AgentFormState) => ({
    value: form[key] as string,
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
            Agent Name <span className="text-primary">*</span>
          </label>
          <input className="military-input" placeholder="e.g. Supply Chain Risk Analyst" {...field("name")} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
            Discipline <span className="text-primary">*</span>
          </label>
          <input className="military-input" placeholder="e.g. Cyber / OPSEC" {...field("discipline")} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
            Severity Default
          </label>
          <select className="military-input appearance-none" {...field("severityDefault")}>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
            Domain
          </label>
          <select className="military-input appearance-none" {...field("domainId")}>
            <option value="">— Unassigned —</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
          Persona Description
        </label>
        <textarea
          className="military-input resize-none h-24"
          placeholder="Who is this expert? What have they seen? How do they think?"
          {...field("personaDescription")}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
          Cognitive Bias
        </label>
        <textarea
          className="military-input resize-none h-20"
          placeholder="What does this expert systematically underweight or miss?"
          {...field("cognitiveBias")}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
          Red Team Focus
        </label>
        <textarea
          className="military-input resize-none h-20"
          placeholder="What specifically does this agent hunt for in any scenario?"
          {...field("redTeamFocus")}
        />
      </div>

      {/* Vectors */}
      <div className="space-y-3 bg-background/40 rounded-lg p-4 border border-border/50">
        <p className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest mb-2">
          Discipline Vectors
        </p>
        <VectorSlider
          label="Human"
          value={form.vectorHuman}
          color="#C0392B"
          onChange={(v) => setForm((f) => ({ ...f, vectorHuman: v }))}
        />
        <VectorSlider
          label="Technical"
          value={form.vectorTechnical}
          color="#2E86AB"
          onChange={(v) => setForm((f) => ({ ...f, vectorTechnical: v }))}
        />
        <VectorSlider
          label="Physical"
          value={form.vectorPhysical}
          color="#27AE60"
          onChange={(v) => setForm((f) => ({ ...f, vectorPhysical: v }))}
        />
        <VectorSlider
          label="Futures"
          value={form.vectorFutures}
          color="#8E44AD"
          onChange={(v) => setForm((f) => ({ ...f, vectorFutures: v }))}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
          Tags <span className="text-muted-foreground/60 normal-case font-sans tracking-normal text-[10px]">(comma-separated)</span>
        </label>
        <input
          className="military-input"
          placeholder="supply chain, cyber, OPSEC"
          {...field("tags")}
        />
      </div>
    </div>
  );
}

// ── Main modal ──────────────────────────────────────────────────────────────
function AgentModal({
  editAgent,
  onClose,
  onSuccess,
}: {
  editAgent: Agent | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = editAgent !== null;

  const { data: domains = [] } = useGetDomains();
  const { mutateAsync: createAgent } = useCreateAgent();
  const { mutateAsync: updateAgent } = useUpdateAgent();
  const { mutateAsync: generateAgent } = useGenerateAgent();
  const { toast } = useToast();

  const [mode, setMode] = useState<"AI" | "MANUAL">(isEditing ? "MANUAL" : "AI");
  const [form, setForm] = useState<AgentFormState>(
    isEditing ? agentToForm(editAgent) : EMPTY_FORM
  );
  const [expertType, setExpertType] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [aiDomain, setAiDomain] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // Default AI domain once list loads
  useEffect(() => {
    if (domains.length > 0 && !aiDomain) {
      setAiDomain(domains[0].name);
    }
  }, [domains]);

  function buildPayload() {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      name: form.name.trim(),
      discipline: form.discipline.trim(),
      domainId: form.domainId ? Number(form.domainId) : undefined,
      severityDefault: form.severityDefault as any,
      personaDescription: form.personaDescription.trim() || undefined,
      cognitiveBias: form.cognitiveBias.trim() || undefined,
      redTeamFocus: form.redTeamFocus.trim() || undefined,
      vectorHuman: form.vectorHuman,
      vectorTechnical: form.vectorTechnical,
      vectorPhysical: form.vectorPhysical,
      vectorFutures: form.vectorFutures,
      isAiGenerated: false,
      tags,
    };
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.discipline.trim()) {
      toast({ title: "Name and Discipline are required", variant: "destructive" });
      return;
    }
    setIsBusy(true);
    try {
      if (isEditing) {
        await updateAgent({ id: editAgent.id, data: buildPayload() });
        toast({ title: "Agent Updated" });
      } else {
        await createAgent({ data: buildPayload() });
        toast({ title: "Agent Created" });
      }
      onSuccess();
    } catch {
      toast({ title: isEditing ? "Update failed" : "Create failed", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAiGenerate() {
    if (!expertType.trim()) return;
    setIsBusy(true);
    try {
      await generateAgent({ data: { expert_type: expertType, domain: aiDomain, key_focus_area: focusArea } });
      toast({ title: "Agent Generated", description: "Created via AI and saved to library" });
      onSuccess();
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
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
          <h2 className="text-xl font-display font-bold uppercase">
            {isEditing ? `Edit Agent — ${editAgent.name}` : "New Agent"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Mode tabs — only show when creating */}
        {!isEditing && (
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex gap-2 bg-background p-1 rounded-lg border border-border w-fit">
              <button
                onClick={() => setMode("AI")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase font-display transition-colors ${
                  mode === "AI" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap size={14} /> AI Generate
              </button>
              <button
                onClick={() => setMode("MANUAL")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase font-display transition-colors ${
                  mode === "MANUAL" ? "bg-secondary text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Manual Build
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "AI" && !isEditing ? (
            <div className="space-y-5">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                Describe the type of expert you need. Claude will generate a full agent profile and save it to your library.
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Expert Type / Role <span className="text-primary">*</span>
                </label>
                <input
                  className="military-input"
                  placeholder="e.g. Offensive Cyber Operator, Maritime Strategist…"
                  value={expertType}
                  onChange={(e) => setExpertType(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Domain</label>
                <select
                  className="military-input appearance-none"
                  value={aiDomain}
                  onChange={(e) => setAiDomain(e.target.value)}
                >
                  {domains.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Key Focus Area <span className="text-muted-foreground/60 normal-case font-sans tracking-normal text-[10px]">(optional)</span>
                </label>
                <textarea
                  className="military-input resize-none h-24"
                  placeholder="Specific focus to bias the agent toward…"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <form id="manual-form" onSubmit={handleManualSubmit}>
              <ManualForm form={form} setForm={setForm} domains={domains} />
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background/50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-bold uppercase font-display text-sm text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors"
          >
            Cancel
          </button>

          {mode === "AI" && !isEditing ? (
            <button
              onClick={handleAiGenerate}
              disabled={!expertType.trim() || isBusy}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isBusy ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate Profile</>}
            </button>
          ) : (
            <button
              type="submit"
              form="manual-form"
              disabled={isBusy}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isBusy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEditing ? "Save Changes" : "Create Agent"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Agents() {
  const [search, setSearch] = useState("");
  const { data: agents, isLoading, refetch } = useGetAgents({ search });
  const { mutateAsync: deleteAgent } = useDeleteAgent();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  function openCreate() {
    setEditAgent(null);
    setModalOpen(true);
  }

  function openEdit(agent: Agent) {
    setEditAgent(agent);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditAgent(null);
  }

  function handleSuccess() {
    closeModal();
    refetch();
  }

  async function handleDelete(agent: Agent) {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    try {
      await deleteAgent({ id: agent.id });
      toast({ title: "Agent deleted" });
      refetch();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Topbar */}
      <div className="border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6 md:px-8 py-4 sticky top-0 z-20 gap-4">
        <div className="hidden sm:block">
          <h1 className="text-2xl font-display font-bold text-foreground">Agent Library</h1>
          <p className="text-sm text-muted-foreground font-mono">Manage expert personas for scenario analysis</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="military-input pl-9 w-full sm:w-56"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors uppercase font-display text-sm whitespace-nowrap"
          >
            <Plus size={16} /> New Agent
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : agents?.length === 0 ? (
          <EmptyState
            image={`${import.meta.env.BASE_URL}images/empty-agents.png`}
            title="Your Agent Library is Empty"
            description="Agents are the expert archetypes that power every WARROOM session. Build them manually or let AI generate a profile from a description."
            action={
              <button
                onClick={openCreate}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 font-display uppercase tracking-widest"
              >
                Create First Agent
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents?.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent as any}
                onEdit={openEdit as any}
                onDelete={handleDelete as any}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <AgentModal
            editAgent={editAgent}
            onClose={closeModal}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
