import React, { useState } from "react";
import {
  useGetDomains,
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain,
  getGetDomainsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Globe2, Plus, Trash2, X, Pencil } from "lucide-react";

const PRESET_COLORS = [
  "#2E75B6", "#F0A500", "#C0392B", "#27AE60",
  "#8E44AD", "#16A085", "#D68910", "#2980B9",
];

function DomainFormFields({
  name, setName,
  description, setDescription,
  color, setColor,
}: {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  color: string; setColor: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
          Domain Name <span className="text-primary">*</span>
        </label>
        <input
          className="military-input"
          placeholder="e.g. Cyber Operations"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
          Description
        </label>
        <textarea
          className="military-input resize-none h-24"
          placeholder="Brief description of this operational domain…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
          Accent Color
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "white" : "transparent",
                transform: color === c ? "scale(1.2)" : "scale(1)",
              }}
              aria-label={c}
            />
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border border-border"
              title="Custom color"
            />
            <span className="text-xs font-mono text-muted-foreground">{color}</span>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-4 border bg-background/40 flex items-center gap-3"
        style={{ borderColor: `${color}40` }}
      >
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <Globe2 size={20} style={{ color }} />
        <div>
          <p className="font-display font-bold text-sm uppercase">{name || "Domain Name"}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {description || "Description will appear here"}
          </p>
        </div>
      </div>
    </>
  );
}

function AddDomainDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState("");
  const { mutateAsync, isPending } = useCreateDomain();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Domain name is required."); return; }
    try {
      await mutateAsync({ data: { name: name.trim(), description: description.trim() || undefined, color } });
      onSuccess();
    } catch {
      setError("Failed to create domain. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl shadow-black/60 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
            New Operational Domain
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <DomainFormFields
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            color={color} setColor={setColor}
          />
          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 rounded-lg font-display uppercase text-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-display uppercase text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Creating…" : "Create Domain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDomainDialog({
  domain,
  onClose,
  onSuccess,
}: {
  domain: { id: number; name: string; description?: string | null; color: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(domain.name);
  const [description, setDescription] = useState(domain.description ?? "");
  const [color, setColor] = useState(domain.color);
  const [error, setError] = useState("");
  const { mutateAsync, isPending } = useUpdateDomain();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Domain name is required."); return; }
    try {
      await mutateAsync({ id: domain.id, data: { name: name.trim(), description: description.trim() || undefined, color } });
      onSuccess();
    } catch {
      setError("Failed to update domain. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl shadow-black/60 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
            Edit Domain
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <DomainFormFields
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            color={color} setColor={setColor}
          />
          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 rounded-lg font-display uppercase text-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-display uppercase text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Domains() {
  const queryClient = useQueryClient();
  const { data: domains, isLoading } = useGetDomains();
  const { mutateAsync: deleteDomain } = useDeleteDomain();
  const [showAdd, setShowAdd] = useState(false);
  const [editingDomain, setEditingDomain] = useState<{ id: number; name: string; description?: string | null; color: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: getGetDomainsQueryKey() });
    setShowAdd(false);
    setEditingDomain(null);
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this domain? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteDomain({ id });
      queryClient.invalidateQueries({ queryKey: getGetDomainsQueryKey() });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Operational Domains
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize agents, scenarios, and chains by strategic area
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 transition-all whitespace-nowrap"
        >
          <Plus size={16} />
          Add Domain
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse h-48" />
          ))}
        </div>
      ) : domains?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Globe2 size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-lg font-bold text-muted-foreground uppercase mb-2">
            No Domains Yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create your first operational domain to start organizing agents and scenarios.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 transition-all"
          >
            <Plus size={16} />
            Add Domain
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains?.map((domain) => (
            <div
              key={domain.id}
              onClick={() => setEditingDomain(domain)}
              className="bg-card rounded-xl p-6 border shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
              style={{ borderColor: `${domain.color}40` }}
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: domain.color }} />

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingDomain(domain); }}
                  className="text-muted-foreground hover:text-primary p-1.5 rounded hover:bg-primary/10 transition-colors"
                  aria-label="Edit domain"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(domain.id, e)}
                  disabled={deletingId === domain.id}
                  className="text-muted-foreground hover:text-red-400 p-1.5 rounded hover:bg-red-400/10 transition-colors"
                  aria-label="Delete domain"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Globe2 size={24} style={{ color: domain.color }} />
                <h2 className="text-lg font-display font-bold">{domain.name}</h2>
              </div>

              {domain.description && (
                <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
                  {domain.description}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-4 mt-auto">
                <div className="text-center">
                  <p className="text-lg font-bold font-mono">{domain.agentCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agents</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-mono">{domain.scenarioCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scenarios</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-mono">{domain.chainCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Chains</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddDomainDialog
          onClose={() => setShowAdd(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editingDomain && (
        <EditDomainDialog
          domain={editingDomain}
          onClose={() => setEditingDomain(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
