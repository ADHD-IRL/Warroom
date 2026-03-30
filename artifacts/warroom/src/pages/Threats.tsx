import React, { useState } from "react";
import {
  useGetThreats,
  useCreateThreat,
  useUpdateThreat,
  useDeleteThreat,
  useGenerateThreats,
  useGetDomains,
  useGetScenarios,
  Threat,
} from "@workspace/api-client-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Target, Plus, X, Zap, Loader2, Trash2, Edit2, CheckSquare, Square, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#C0392B",
  HIGH: "#D68910",
  MEDIUM: "#2E86AB",
  LOW: "#27AE60",
};

// ── Manual form ─────────────────────────────────────────────────────────────
interface ThreatFormState {
  name: string;
  description: string;
  severity: string;
  category: string;
  domainId: string;
  scenarioId: string;
  tags: string;
}

const EMPTY_THREAT_FORM: ThreatFormState = {
  name: "",
  description: "",
  severity: "HIGH",
  category: "",
  domainId: "",
  scenarioId: "",
  tags: "",
};

function threatToForm(t: Threat): ThreatFormState {
  return {
    name: t.name ?? "",
    description: t.description ?? "",
    severity: t.severity ?? "HIGH",
    category: t.category ?? "",
    domainId: t.domainId != null ? String(t.domainId) : "",
    scenarioId: t.scenarioId != null ? String(t.scenarioId) : "",
    tags: (t.tags ?? []).join(", "),
  };
}

// ── AI-generated threat card ─────────────────────────────────────────────────
function GeneratedThreatCard({
  threat,
  selected,
  onToggle,
}: {
  threat: any;
  selected: boolean;
  onToggle: () => void;
}) {
  const color = SEVERITY_COLORS[threat.severity] ?? "#D68910";
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-white/20"
      }`}
    >
      <div className="absolute top-3 right-3">
        {selected ? (
          <CheckSquare size={16} className="text-primary" />
        ) : (
          <Square size={16} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-2 mb-2 pr-6">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-display font-bold text-sm uppercase text-foreground">{threat.name}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{threat.description}</p>
      <div className="flex items-center gap-2">
        <SeverityBadge severity={threat.severity} />
        {threat.category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-white/5">
            {threat.category}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function ThreatModal({
  editThreat,
  onClose,
  onSuccess,
}: {
  editThreat: Threat | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = editThreat !== null;
  const { data: domains = [] } = useGetDomains();
  const { data: scenarios = [] } = useGetScenarios();
  const { mutateAsync: createThreat } = useCreateThreat();
  const { mutateAsync: updateThreat } = useUpdateThreat();
  const { mutateAsync: generateThreats } = useGenerateThreats();
  const { toast } = useToast();

  const [mode, setMode] = useState<"AI" | "MANUAL">(isEditing ? "MANUAL" : "AI");
  const [form, setForm] = useState<ThreatFormState>(
    isEditing ? threatToForm(editThreat) : EMPTY_THREAT_FORM
  );

  // AI state
  const [aiContext, setAiContext] = useState("");
  const [aiDomainId, setAiDomainId] = useState("");
  const [aiScenarioId, setAiScenarioId] = useState("");
  const [generated, setGenerated] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");

  const field = (key: keyof ThreatFormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleGenerate() {
    if (!aiContext.trim()) return;
    setIsBusy(true);
    try {
      const result = await generateThreats({
        data: {
          context: aiContext,
          scenarioId: aiScenarioId ? Number(aiScenarioId) : undefined,
          domainId: aiDomainId ? Number(aiDomainId) : undefined,
        } as any,
      });
      setGenerated(result as any[]);
      setSelected(new Set((result as any[]).map((_: any, i: number) => i)));
      setStep("review");
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveSelected() {
    setIsBusy(true);
    try {
      const toSave = generated.filter((_, i) => selected.has(i));
      await Promise.all(
        toSave.map((t) =>
          createThreat({
            data: {
              name: t.name,
              description: t.description,
              severity: t.severity,
              category: t.category,
              domainId: t.domainId,
              scenarioId: t.scenarioId,
              tags: [],
            },
          })
        )
      );
      toast({ title: `${toSave.length} threat${toSave.length !== 1 ? "s" : ""} saved` });
      onSuccess();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setIsBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        severity: form.severity as any,
        category: form.category.trim() || undefined,
        domainId: form.domainId ? Number(form.domainId) : undefined,
        scenarioId: form.scenarioId ? Number(form.scenarioId) : undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (isEditing) {
        await updateThreat({ id: editThreat.id, data: payload });
        toast({ title: "Threat updated" });
      } else {
        await createThreat({ data: payload });
        toast({ title: "Threat created" });
      }
      onSuccess();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  function toggleAll() {
    if (selected.size === generated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generated.map((_, i) => i)));
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
            {isEditing ? `Edit Threat` : step === "review" ? `Review Generated Threats` : "New Threat"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {!isEditing && step === "form" && (
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
                Manual
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* AI — review step */}
          {mode === "AI" && step === "review" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">
                  Select the threats you want to save ({selected.size}/{generated.length} selected)
                </p>
                <button onClick={toggleAll} className="text-xs text-primary hover:underline font-mono">
                  {selected.size === generated.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {generated.map((t, i) => (
                <GeneratedThreatCard
                  key={i}
                  threat={t}
                  selected={selected.has(i)}
                  onToggle={() => {
                    const s = new Set(selected);
                    s.has(i) ? s.delete(i) : s.add(i);
                    setSelected(s);
                  }}
                />
              ))}
            </div>
          )}

          {/* AI — input step */}
          {mode === "AI" && step === "form" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                Describe the scenario context and Claude will generate specific, actionable threats.
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Scenario Context <span className="text-primary">*</span>
                </label>
                <textarea
                  className="military-input resize-none h-32"
                  placeholder="Describe the strategic situation, actors involved, and environment…"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  autoFocus
                />
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
                    {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Manual */}
          {mode === "MANUAL" && (
            <form id="threat-form" onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Threat Name <span className="text-primary">*</span>
                </label>
                <input className="military-input" placeholder="e.g. Supply Chain Hardware Implant" {...field("name")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Description</label>
                <textarea className="military-input resize-none h-24" placeholder="Describe the threat mechanism and impact…" {...field("description")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                    Severity <span className="text-primary">*</span>
                  </label>
                  <select className="military-input appearance-none" {...field("severity")}>
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Category</label>
                  <input className="military-input" placeholder="e.g. Cyber, Supply Chain, Insider" {...field("category")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Domain</label>
                  <select className="military-input appearance-none" {...field("domainId")}>
                    <option value="">— Unassigned —</option>
                    {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Scenario</label>
                  <select className="military-input appearance-none" {...field("scenarioId")}>
                    <option value="">— None —</option>
                    {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
                  Tags <span className="text-muted-foreground/60 normal-case font-sans tracking-normal text-[10px]">(comma-separated)</span>
                </label>
                <input className="military-input" placeholder="supply chain, hardware, adversary" {...field("tags")} />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background/50 flex justify-between items-center gap-3 flex-shrink-0">
          <div>
            {mode === "AI" && step === "review" && (
              <button
                onClick={() => setStep("form")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
              >
                ← Regenerate
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-bold uppercase font-display text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            {mode === "AI" && step === "form" && (
              <button
                onClick={handleGenerate}
                disabled={!aiContext.trim() || isBusy}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isBusy ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate Threats</>}
              </button>
            )}
            {mode === "AI" && step === "review" && (
              <button
                onClick={handleSaveSelected}
                disabled={selected.size === 0 || isBusy}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isBusy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : `Save ${selected.size} Threat${selected.size !== 1 ? "s" : ""}`}
              </button>
            )}
            {mode === "MANUAL" && (
              <button
                type="submit"
                form="threat-form"
                disabled={isBusy}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isBusy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isEditing ? "Save Changes" : "Create Threat"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Threats() {
  const { data: threats, isLoading, refetch } = useGetThreats();
  const { data: domains = [] } = useGetDomains();
  const { mutateAsync: deleteThreat } = useDeleteThreat();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editThreat, setEditThreat] = useState<Threat | null>(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");

  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d]));

  const filtered = (threats ?? []).filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSeverity = !filterSeverity || t.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  function openCreate() {
    setEditThreat(null);
    setModalOpen(true);
  }

  function openEdit(t: Threat) {
    setEditThreat(t);
    setModalOpen(true);
  }

  async function handleDelete(t: Threat) {
    if (!confirm(`Delete "${t.name}"?`)) return;
    try {
      await deleteThreat({ id: t.id });
      toast({ title: "Threat deleted" });
      refetch();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Threat Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and analyze adversary tactics and vulnerabilities</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 transition-all whitespace-nowrap"
        >
          <Plus size={16} /> Add Threat
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search threats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="military-input pl-9 w-full"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="military-input pl-9 pr-8 appearance-none"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Target size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-lg font-bold text-muted-foreground uppercase mb-2">
            {threats?.length === 0 ? "No Threats Logged" : "No Matching Threats"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {threats?.length === 0
              ? "Use AI to generate threats from a scenario context, or add them manually."
              : "Try adjusting your search or severity filter."}
          </p>
          {threats?.length === 0 && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90"
            >
              <Plus size={16} /> Add Threat
            </button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background/50 border-b border-border font-mono text-xs text-muted-foreground uppercase">
              <tr>
                <th className="p-4 font-medium">Threat</th>
                <th className="p-4 font-medium hidden md:table-cell">Category</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium hidden lg:table-cell">Domain</th>
                <th className="p-4 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((threat) => (
                <tr key={threat.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div>
                      <p className="font-bold text-foreground font-display">{threat.name}</p>
                      {threat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">{threat.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                    {threat.category ? (
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-white/5 text-[11px]">
                        {threat.category}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-4">
                    <SeverityBadge severity={threat.severity} />
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                    {threat.domainId && domainMap[threat.domainId] ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: domainMap[threat.domainId].color }} />
                        {domainMap[threat.domainId].name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button
                        onClick={() => openEdit(threat)}
                        className="p-1.5 text-muted-foreground hover:text-foreground bg-background rounded border border-border hover:border-white/20 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(threat)}
                        className="p-1.5 text-muted-foreground hover:text-destructive bg-background rounded border border-border hover:border-destructive/50 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-border bg-background/30 text-xs text-muted-foreground font-mono">
            {filtered.length} threat{filtered.length !== 1 ? "s" : ""}
            {filterSeverity || search ? ` matching filters` : " total"}
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <ThreatModal
            editThreat={editThreat}
            onClose={() => { setModalOpen(false); setEditThreat(null); }}
            onSuccess={() => { setModalOpen(false); setEditThreat(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
