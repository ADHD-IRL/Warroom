import React, { useState } from "react";
import {
  useGetScenarios,
  useCreateScenario,
  useUpdateScenario,
  useDeleteScenario,
  useAiAssistScenario,
  useGetDomains,
  getGetScenariosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  X,
  Edit2,
  Zap,
  Loader2,
  Tag,
  Calendar,
  Globe2,
  CheckCircle,
  Clock,
  Archive,
  Save,
  Sparkles,
  ChevronDown,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  draft:    { label: "Draft",    color: "text-muted-foreground", bg: "bg-muted/20",        border: "border-muted-foreground/30", Icon: Clock },
  active:   { label: "Active",   color: "text-green-400",        bg: "bg-green-400/10",    border: "border-green-400/30",        Icon: CheckCircle },
  archived: { label: "Archived", color: "text-amber-400",        bg: "bg-amber-400/10",    border: "border-amber-400/30",        Icon: Archive },
};

const STATUS_CYCLE: Record<string, string> = { draft: "active", active: "archived", archived: "draft" };

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const m = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase border font-bold tracking-widest transition-all ${m.color} ${m.bg} ${m.border} ${onClick ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
    >
      <m.Icon size={10} />
      {m.label}
    </button>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Scenario Modal ─────────────────────────────────────────────────────────────
interface ModalProps {
  editing?: any;
  onClose: () => void;
  onSuccess: (s: any) => void;
}

function ScenarioModal({ editing, onClose, onSuccess }: ModalProps) {
  const { data: domains = [] } = useGetDomains();
  const { mutateAsync: createScenario } = useCreateScenario();
  const { mutateAsync: updateScenario } = useUpdateScenario();
  const { mutateAsync: aiAssist } = useAiAssistScenario();
  const { toast } = useToast();

  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [status, setStatus] = useState<"draft" | "active" | "archived">(editing?.status ?? "draft");
  const [domainId, setDomainId] = useState<string>(editing?.domainId ? String(editing.domainId) : "");
  const [tagsRaw, setTagsRaw] = useState<string>((editing?.tags ?? []).join(", "));
  const [context, setContext] = useState(editing?.contextDocument ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const isEdit = !!editing;

  async function handleDraftContext() {
    if (!name.trim()) { toast({ title: "Enter a scenario name first", variant: "destructive" }); return; }
    setIsDrafting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/scenarios/generate-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (data.contextDocument) {
        setContext(data.contextDocument);
        toast({ title: "Context drafted by AI" });
      } else {
        throw new Error("No content");
      }
    } catch {
      toast({ title: "AI draft failed", variant: "destructive" });
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleImprove() {
    if (!editing?.id) return;
    setIsImproving(true);
    try {
      const result = await aiAssist({ id: editing.id });
      if (result.context_document) {
        setContext(result.context_document);
        toast({ title: "Context improved by AI" });
      }
    } catch {
      toast({ title: "AI improve failed", variant: "destructive" });
    } finally {
      setIsImproving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setIsSaving(true);
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      domainId: domainId ? Number(domainId) : undefined,
      contextDocument: context.trim() || undefined,
      tags,
    };
    try {
      let result: any;
      if (isEdit) {
        result = await updateScenario({ id: editing.id, data: payload });
      } else {
        result = await createScenario({ data: payload });
      }
      toast({ title: isEdit ? "Scenario updated" : "Scenario created", description: result.name });
      onSuccess(result);
    } catch {
      toast({ title: isEdit ? "Update failed" : "Create failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/50 flex-shrink-0">
          <h2 className="text-xl font-display font-bold uppercase">
            {isEdit ? "Edit Scenario" : "New Scenario"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {/* Body */}
        <form id="scenario-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">
              Scenario Name <span className="text-primary">*</span>
            </label>
            <input
              className="military-input"
              placeholder="e.g. Operation Silent Vector"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Brief Description</label>
            <textarea
              className="military-input resize-none h-20"
              placeholder="One or two sentences describing the core situation…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Status + Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Status</label>
              <div className="relative">
                <select
                  className="military-input appearance-none pr-8"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Domain</label>
              <div className="relative">
                <select
                  className="military-input appearance-none pr-8"
                  value={domainId}
                  onChange={(e) => setDomainId(e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Tags</label>
            <input
              className="military-input"
              placeholder="comma-separated: supply-chain, cyber, ITAR…"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
            />
          </div>

          {/* Context Document */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Context Document</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDraftContext}
                  disabled={isDrafting || !name.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-display uppercase bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-40 transition-colors"
                >
                  {isDrafting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {isDrafting ? "Drafting…" : "AI Draft"}
                </button>
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleImprove}
                    disabled={isImproving}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-display uppercase bg-secondary border border-border text-muted-foreground rounded-lg hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    {isImproving ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                    {isImproving ? "Improving…" : "AI Improve"}
                  </button>
                )}
              </div>
            </div>
            <textarea
              className="military-input resize-none h-56 font-mono text-sm"
              placeholder="Write the scenario briefing here, or click AI Draft to generate it from the name and description…"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground font-mono">
              {context.length > 0 ? `${context.length} chars · ${context.split(/\s+/).filter(Boolean).length} words` : "Supports markdown headings and bullet points"}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background/50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-bold uppercase font-display text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="scenario-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> {isEdit ? "Save Changes" : "Create Scenario"}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Context renderer — simple markdown-like formatting ────────────────────────
function ContextDoc({ text }: { text: string }) {
  if (!text) return <p className="text-muted-foreground italic text-sm">No context document yet.</p>;
  const lines = text.split("\n");
  return (
    <div className="space-y-2 font-mono text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return <h3 key={i} className="text-base font-display font-bold text-primary uppercase tracking-widest mt-5 first:mt-0 border-b border-border/50 pb-1">{line.slice(3)}</h3>;
        if (line.startsWith("# "))
          return <h2 key={i} className="text-lg font-display font-bold text-foreground uppercase tracking-wide mt-6 first:mt-0">{line.slice(2)}</h2>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <p key={i} className="text-muted-foreground pl-4 before:content-['▸'] before:mr-2 before:text-primary/60 before:text-xs">{line.slice(2)}</p>;
        if (line.trim() === "")
          return <div key={i} className="h-1" />;
        return <p key={i} className="text-muted-foreground">{line}</p>;
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const STATUS_FILTERS = ["all", "draft", "active", "archived"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function Scenarios() {
  const queryClient = useQueryClient();
  const { data: scenarios = [], isLoading, refetch } = useGetScenarios();
  const { data: domains = [] } = useGetDomains();
  const { mutateAsync: updateScenario } = useUpdateScenario();
  const { mutateAsync: deleteScenario } = useDeleteScenario();
  const { toast } = useToast();

  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d]));

  const filtered = scenarios.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openCreate() { setEditTarget(null); setModalOpen(true); }
  function openEdit(s: any) { setEditTarget(s); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function cycleStatus(s: any) {
    const next = STATUS_CYCLE[s.status] ?? "draft";
    try {
      const updated = await updateScenario({ id: s.id, data: { ...s, status: next } });
      refetch();
      if (selected?.id === s.id) setSelected(updated);
    } catch {
      toast({ title: "Status update failed", variant: "destructive" });
    }
  }

  async function handleDelete(s: any) {
    if (!confirm(`Delete scenario "${s.name}"?`)) return;
    try {
      await deleteScenario({ id: s.id });
      if (selected?.id === s.id) setSelected(null);
      refetch();
      toast({ title: "Scenario deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  function onModalSuccess(result: any) {
    closeModal();
    queryClient.invalidateQueries({ queryKey: getGetScenariosQueryKey() });
    refetch();
    setSelected(result);
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-background/50 flex flex-col md:h-full max-h-72 md:max-h-none flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-border flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-bold">Scenarios</h1>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-xs hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} /> New
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search scenarios…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="military-input pl-9 text-sm"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border transition-all ${
                  statusFilter === f
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:border-white/20"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <FileText size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-mono">
                {scenarios.length === 0 ? "No scenarios yet." : "No matches."}
              </p>
            </div>
          ) : (
            filtered.map((s) => {
              const domain = domainMap[s.domainId!];
              return (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                    selected?.id === s.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold font-display text-sm text-foreground leading-tight flex-1 pr-2 truncate">
                      {s.name}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={s.status} />
                    {domain && (
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded border truncate max-w-[90px]"
                        style={{ color: domain.color ?? "#888", borderColor: `${domain.color ?? "#888"}40`, backgroundColor: `${domain.color ?? "#888"}10` }}
                      >
                        {domain.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-5">
              <FileText size={28} className="text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-display font-bold uppercase mb-2">Mission Briefings</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
              {scenarios.length === 0
                ? "No scenarios yet. Create one to begin analysis."
                : "Select a scenario from the list to view its context document."}
            </p>
            {scenarios.length === 0 && (
              <button
                onClick={openCreate}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg uppercase tracking-wider font-display hover:bg-primary/90 transition-colors"
              >
                Create First Scenario
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 md:px-8 py-6 border-b border-border bg-card/50 flex-shrink-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground truncate mb-2">
                    {selected.name}
                  </h2>
                  {selected.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {selected.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(selected)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-bold font-display uppercase text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selected)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={selected.status} onClick={() => cycleStatus(selected)} />

                {domainMap[selected.domainId!] && (
                  <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                    <Globe2 size={11} />
                    {domainMap[selected.domainId!].name}
                  </span>
                )}

                <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                  <Calendar size={11} />
                  {formatDate(selected.createdAt)}
                </span>

                {(selected.tags ?? []).length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                    <Tag size={11} />
                    {(selected.tags as string[]).join(" · ")}
                  </span>
                )}
              </div>
            </div>

            {/* Context document */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest">Context Document</p>
                  {!selected.contextDocument && (
                    <button
                      onClick={() => openEdit(selected)}
                      className="flex items-center gap-1.5 text-xs text-primary font-bold font-display uppercase hover:underline"
                    >
                      <Sparkles size={11} /> Add Context
                    </button>
                  )}
                </div>
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-6 min-h-40"
                >
                  <ContextDoc text={selected.contextDocument ?? ""} />
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ScenarioModal
            editing={editTarget}
            onClose={closeModal}
            onSuccess={onModalSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
