import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useGetSession, useGenerateSynthesis, useResetSession, useGenerateReport } from "@workspace/api-client-react";
import { useSSE } from "@/hooks/use-sse";
import {
  ShieldAlert, Play, RefreshCw, Layers, CheckCircle2,
  Loader2, Clock, Zap, Brain, AlertTriangle,
  Download, ChevronDown, FileText, RotateCcw, BookOpen, Users, Target
} from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import ReactMarkdown from "react-markdown";
import {
  downloadRound1PDF,
  downloadRound2PDF,
  downloadSynthesisPDF,
  downloadFullReportPDF,
} from "@/lib/pdf";

type StreamingState = {
  activeAgentId: number | null;
  activeAgentName: string;
  content: Record<number, string>;
  completed: Set<number>;
  totalAgents: number;
};

const EMPTY_STREAM: StreamingState = {
  activeAgentId: null,
  activeAgentName: "",
  content: {},
  completed: new Set(),
  totalAgents: 0,
};

export default function SessionWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, refetch } = useGetSession(Number(id));
  const { stream, isStreaming } = useSSE();
  const { mutateAsync: generateSynthesis } = useGenerateSynthesis();
  const { mutateAsync: saveReport } = useGenerateReport();
  const { mutateAsync: resetSession } = useResetSession();

  function saveReportRecord(title: string, sections: string[]) {
    if (!session?.id) return;
    saveReport({ data: { sessionId: session.id, title, sections, format: "markdown" } }).catch(() => {});
  }

  const [activeTab, setActiveTab] = useState<"ROUND1" | "ROUND2" | "SYNTHESIS">("ROUND1");
  const [streamState, setStreamState] = useState<StreamingState>(EMPTY_STREAM);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setShowDownload(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleData = useCallback((data: any) => {
    if (data.type === "start") {
      setStreamState(prev => ({
        ...prev,
        activeAgentId: data.agentId,
        activeAgentName: data.agentName ?? "",
      }));
    } else if (data.type === "chunk") {
      setStreamState(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [data.agentId]: (prev.content[data.agentId] ?? "") + data.text,
        },
      }));
    } else if (data.type === "done") {
      setStreamState(prev => ({
        ...prev,
        activeAgentId: null,
        activeAgentName: "",
        completed: new Set([...prev.completed, data.agentId]),
      }));
    }
  }, []);

  const runRound1 = async () => {
    const total = session?.sessionAgents?.length ?? 0;
    setStreamState({ ...EMPTY_STREAM, totalAgents: total, completed: new Set() });
    setActiveTab("ROUND1");
    await stream(`/api/sessions/${id}/generate-round1`, null, {
      onData: handleData,
      onDone: () => {
        refetch();
        setStreamState(EMPTY_STREAM);
      },
    });
  };

  const runRound2 = async () => {
    const total = session?.sessionAgents?.length ?? 0;
    setStreamState({ ...EMPTY_STREAM, totalAgents: total, completed: new Set() });
    setActiveTab("ROUND2");
    await stream(`/api/sessions/${id}/generate-round2`, null, {
      onData: handleData,
      onDone: () => {
        refetch();
        setStreamState(EMPTY_STREAM);
      },
    });
  };

  const runSynthesis = async () => {
    setIsSynthesizing(true);
    setActiveTab("SYNTHESIS");
    try {
      await generateSynthesis({ id: Number(id) });
      await refetch();
    } finally {
      setIsSynthesizing(false);
    }
  };

  const runReset = async () => {
    setIsResetting(true);
    setShowResetConfirm(false);
    try {
      await resetSession({ id: Number(id) });
      setStreamState(EMPTY_STREAM);
      setActiveTab("ROUND1");
      await refetch();
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-primary">
          <Loader2 size={18} className="animate-spin" />
          CONNECTING TO SESSION...
        </div>
      </div>
    );
  }

  const isProcessing = isStreaming || isSynthesizing;
  const completedCount = streamState.completed.size;
  const totalCount = streamState.totalAgents || session.sessionAgents?.length || 0;

  return (
    <div className="h-full flex flex-col bg-background">

      {/* ── Header ── */}
      <div className="bg-card border-b border-border px-6 py-4 z-10 shadow-lg shrink-0">
        {/* Row 1: title + utility buttons */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-foreground uppercase truncate">{session.name}</h1>
              <span className="text-[10px] px-2 py-1 rounded bg-secondary border border-border font-mono uppercase tracking-widest text-primary shrink-0">
                {session.status}
              </span>
            </div>
            <p className="text-muted-foreground font-mono text-xs truncate">
              SCENARIO: {session.scenario?.name ?? "—"} &nbsp;//&nbsp; FOCUS: {session.phaseFocus ?? "—"}
            </p>
          </div>

          {/* Utility buttons: Reset + PDF */}
          <div className="flex gap-2 items-center shrink-0">
            {/* Reset button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isProcessing || isResetting || session.status === "pending"}
              className="px-3 py-2 bg-secondary border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 font-bold rounded font-display flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Reset session back to pending state"
            >
              {isResetting
                ? <><Loader2 size={14} className="animate-spin" /><span className="text-xs font-mono">RESETTING</span></>
                : <><RotateCcw size={14} /><span className="text-xs font-mono">RESET</span></>
              }
            </button>

            {/* Download dropdown */}
            <div className="relative" ref={downloadRef}>
              <button
                onClick={() => setShowDownload(v => !v)}
                className="px-3 py-2 bg-secondary border border-border text-foreground font-bold rounded hover:bg-white/5 font-display flex items-center gap-1.5 transition-all"
                title="Download PDF reports"
              >
                <Download size={14} />
                <span className="text-xs font-mono">PDF</span>
                <ChevronDown size={12} className={`transition-transform ${showDownload ? "rotate-180" : ""}`} />
              </button>

            {showDownload && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Download PDF</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {[
                    {
                      label: "Round 1 Report",
                      sub: "All agent assessments",
                      fn: () => {
                        downloadRound1PDF(session);
                        saveReportRecord(`${session.name} — Round 1`, ["cover", "agent-roster", "round1-assessments"]);
                        setShowDownload(false);
                      },
                      disabled: !session.sessionAgents?.some((sa: any) => sa.round1Assessment),
                    },
                    {
                      label: "Round 2 Report",
                      sub: "All agent rebuttals",
                      fn: () => {
                        downloadRound2PDF(session);
                        saveReportRecord(`${session.name} — Round 2`, ["cover", "agent-roster", "round2-rebuttals"]);
                        setShowDownload(false);
                      },
                      disabled: !session.sessionAgents?.some((sa: any) => sa.round2Rebuttal),
                    },
                    {
                      label: "Synthesis Report",
                      sub: "Strategic summary",
                      fn: () => {
                        downloadSynthesisPDF(session);
                        saveReportRecord(`${session.name} — Synthesis`, ["cover", "consensus-findings", "compound-chains", "priority-actions", "synthesis"]);
                        setShowDownload(false);
                      },
                      disabled: !session.synthesis,
                    },
                    {
                      label: "Full Report",
                      sub: "All rounds + synthesis",
                      fn: () => {
                        downloadFullReportPDF(session);
                        saveReportRecord(`${session.name} — Full Report`, ["cover", "situation-brief", "agent-roster", "round1-assessments", "round2-rebuttals", "consensus-findings", "compound-chains", "priority-actions", "synthesis"]);
                        setShowDownload(false);
                      },
                      disabled: !session.sessionAgents?.some((sa: any) => sa.round1Assessment),
                    },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.disabled ? undefined : item.fn}
                      disabled={item.disabled}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed text-left group"
                    >
                      <FileText size={14} className="text-muted-foreground group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold font-display text-foreground leading-none mb-0.5">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{item.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Row 2: main action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runRound1}
            disabled={isProcessing || session.status !== "pending"}
            className="px-4 py-2 bg-secondary border border-border text-foreground font-bold rounded hover:bg-white/5 font-display flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title={session.status !== "pending" ? "Round 1 already complete" : "Generate Round 1 assessments"}
          >
            <Play size={14} /> GEN ROUND 1
          </button>
          <button
            onClick={runRound2}
            disabled={isProcessing || session.status !== "round1"}
            className="px-4 py-2 bg-secondary border border-border text-foreground font-bold rounded hover:bg-white/5 font-display flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title={session.status !== "round1" ? "Complete Round 1 first" : "Generate Round 2 rebuttals"}
          >
            <Layers size={14} /> GEN ROUND 2
          </button>
          <button
            onClick={runSynthesis}
            disabled={isProcessing || session.status !== "round2"}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 font-display flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(240,165,0,0.2)]"
            title={session.status !== "round2" ? "Complete Round 2 first" : "Generate final synthesis"}
          >
            {isSynthesizing
              ? <><Loader2 size={14} className="animate-spin" /> SYNTHESIZING...</>
              : <><RefreshCw size={14} /> SYNTHESIZE</>
            }
          </button>
        </div>
      </div>

      {/* ── Processing Banner ── */}
      {isStreaming && (
        <div className="bg-primary/10 border-b border-primary/30 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            <span className="font-mono text-sm text-primary font-bold">
              {streamState.activeAgentId
                ? <>PROCESSING: <span className="text-foreground">{streamState.activeAgentName}</span></>
                : "INITIALIZING AGENTS..."}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-muted-foreground">
              {completedCount} / {totalCount} AGENTS COMPLETE
            </div>
            <div className="flex gap-1">
              {session.sessionAgents?.map(sa => {
                const agentId = sa.agentId ?? sa.id;
                const isDone = streamState.completed.has(agentId);
                const isActive = streamState.activeAgentId === agentId;
                return (
                  <div
                    key={agentId}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isDone ? "bg-green-400" :
                      isActive ? "bg-primary animate-pulse" :
                      "bg-border"
                    }`}
                    title={sa.agent?.name}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex border-b border-border px-6 bg-background/50 shrink-0">
        {(["ROUND1", "ROUND2", "SYNTHESIS"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 font-display font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "ROUND1" ? "Round 1" : tab === "ROUND2" ? "Round 2" : "Synthesis"}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ROUND 1 */}
        {activeTab === "ROUND1" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {session.sessionAgents?.map(sa => {
              const agentId = sa.agentId ?? sa.id;
              const liveText = streamState.content[agentId];
              const savedText = sa.round1Assessment;
              const displayText = liveText || savedText;
              const isDone = streamState.completed.has(agentId);
              const isActive = streamState.activeAgentId === agentId;
              const isQueued = isStreaming && !isDone && !isActive;

              return (
                <div
                  key={sa.id}
                  className={`bg-card border rounded-xl overflow-hidden shadow-lg flex flex-col transition-all duration-300 ${
                    isActive
                      ? "border-primary shadow-[0_0_20px_rgba(240,165,0,0.15)]"
                      : isDone
                      ? "border-green-500/30"
                      : "border-border"
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-white/5 bg-background/30 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold font-display text-foreground">{sa.agent?.name}</h3>
                      <p className="text-xs text-primary font-mono">{sa.agent?.discipline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sa.round1Severity && !isActive && <SeverityBadge severity={sa.round1Severity} />}
                      {isActive && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                          STREAMING
                        </span>
                      )}
                      {isDone && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
                          <CheckCircle2 size={10} /> DONE
                        </span>
                      )}
                      {isQueued && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 border border-border px-2 py-1 rounded">
                          QUEUED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
                    {displayText ? (
                      <div className="prose prose-invert prose-p:text-sm prose-p:leading-relaxed prose-headings:font-display prose-headings:text-foreground max-w-none">
                        <ReactMarkdown>{displayText}</ReactMarkdown>
                        {isActive && (
                          <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>
                    ) : isQueued ? (
                      <div className="space-y-2 py-4">
                        <div className="h-2.5 bg-muted/30 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-muted/30 rounded animate-pulse w-full" />
                        <div className="h-2.5 bg-muted/30 rounded animate-pulse w-5/6" />
                        <div className="h-2.5 bg-muted/20 rounded animate-pulse w-2/3 mt-4" />
                        <div className="h-2.5 bg-muted/20 rounded animate-pulse w-full" />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-10 font-mono text-xs opacity-50 flex flex-col items-center gap-2">
                        <Clock size={24} className="opacity-40" />
                        AWAITING GENERATION
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ROUND 2 */}
        {activeTab === "ROUND2" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {session.sessionAgents?.map(sa => {
              const agentId = sa.agentId ?? sa.id;
              const liveText = streamState.content[agentId];
              const savedText = sa.round2Rebuttal;
              const displayText = liveText || savedText;
              const isDone = streamState.completed.has(agentId);
              const isActive = streamState.activeAgentId === agentId;
              const isQueued = isStreaming && !isDone && !isActive;

              return (
                <div
                  key={sa.id}
                  className={`bg-card border rounded-xl overflow-hidden shadow-lg flex flex-col transition-all duration-300 ${
                    isActive
                      ? "border-primary shadow-[0_0_20px_rgba(240,165,0,0.15)]"
                      : isDone
                      ? "border-green-500/30"
                      : "border-border"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-white/5 bg-background/30 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold font-display text-foreground">{sa.agent?.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-mono">CROSS-DISCIPLINE REBUTTAL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sa.round2RevisedSeverity && !isActive && <SeverityBadge severity={sa.round2RevisedSeverity} />}
                      {isActive && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                          STREAMING
                        </span>
                      )}
                      {isDone && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
                          <CheckCircle2 size={10} /> DONE
                        </span>
                      )}
                      {isQueued && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 border border-border px-2 py-1 rounded">
                          QUEUED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
                    {displayText ? (
                      <div className="prose prose-invert prose-p:text-sm prose-p:leading-relaxed max-w-none">
                        <ReactMarkdown>{displayText}</ReactMarkdown>
                        {isActive && (
                          <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>
                    ) : isQueued ? (
                      <div className="space-y-2 py-4">
                        <div className="h-2.5 bg-muted/30 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-muted/30 rounded animate-pulse w-full" />
                        <div className="h-2.5 bg-muted/30 rounded animate-pulse w-5/6" />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-10 font-mono text-xs opacity-50 flex flex-col items-center gap-2">
                        <Brain size={24} className="opacity-40" />
                        REQUIRES ROUND 1 COMPLETION
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SYNTHESIS */}
        {activeTab === "SYNTHESIS" && (
          <div className="max-w-4xl mx-auto">
            {isSynthesizing ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <Loader2 size={28} className="text-primary animate-spin" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-lg text-primary uppercase tracking-widest mb-1">
                    Synthesizing Intelligence
                  </p>
                  <p className="text-muted-foreground font-mono text-sm">
                    Integrating all agent assessments and rebuttals...
                  </p>
                </div>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : !session.synthesis ? (
              <div className="text-center text-muted-foreground py-24 font-mono border border-dashed border-border rounded-xl flex flex-col items-center gap-3">
                <Zap size={32} className="opacity-30" />
                <p className="text-sm">SYNTHESIS NOT GENERATED YET</p>
                {session.status === "round2" && (
                  <button
                    onClick={runSynthesis}
                    className="mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold rounded font-display uppercase tracking-wider hover:bg-primary/90 transition-colors"
                  >
                    Generate Synthesis
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">

                {/* Scenario Overview */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                  <div className="px-6 py-4 border-b border-border bg-background/30 flex items-center gap-2">
                    <BookOpen size={18} className="text-primary" />
                    <h2 className="text-lg font-display font-bold text-foreground uppercase tracking-wide">Scenario Overview</h2>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                          <FileText size={10} /> Scenario
                        </p>
                        <p className="font-bold font-display text-foreground">{session.scenario?.name ?? "—"}</p>
                        {session.scenario?.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{session.scenario.description}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Target size={10} /> Phase Focus
                        </p>
                        <p className="font-bold font-display text-foreground">{session.phaseFocus ?? "General Assessment"}</p>
                        {session.domain && (
                          <p className="text-sm text-muted-foreground mt-1">Domain: {session.domain.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Agent lineup */}
                    {session.sessionAgents?.length > 0 && (
                      <div className="border-t border-border/50 pt-4">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1">
                          <Users size={10} /> Analyst Team ({session.sessionAgents.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.sessionAgents.map((sa: any) => (
                            <div key={sa.id} className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <div>
                                <p className="text-xs font-bold font-display text-foreground leading-none">{sa.agent?.name}</p>
                                {sa.agent?.discipline && (
                                  <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{sa.agent.discipline}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Context Document */}
                    {session.scenario?.contextDocument && (
                      <div className="border-t border-border/50 pt-4">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1">
                          <BookOpen size={10} /> Intelligence Context
                        </p>
                        <div className="prose prose-invert prose-p:text-sm prose-p:leading-relaxed prose-headings:font-display prose-headings:text-foreground prose-headings:text-sm prose-strong:text-foreground max-w-none bg-background/30 rounded-lg p-4 border border-border/50">
                          <ReactMarkdown>{session.scenario.contextDocument}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Mitigations */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <h2 className="text-xl font-display font-bold text-primary mb-4 flex items-center gap-2">
                    <ShieldAlert size={20} /> PRIORITY MITIGATIONS
                  </h2>
                  <div className="space-y-3">
                    {session.synthesis.priorityMitigations?.map((m: any, i: number) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-foreground text-sm leading-relaxed">
                            {m.action || m.text || JSON.stringify(m)}
                          </p>
                          {m.urgency && (
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{m.urgency}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consensus Findings */}
                {session.synthesis.consensusFindings?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-display font-bold text-foreground mb-4">CONSENSUS FINDINGS</h2>
                    <div className="space-y-3">
                      {session.synthesis.consensusFindings?.map((f: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start p-3 bg-background rounded-lg border border-border">
                          <SeverityBadge severity={f.severity || "MEDIUM"} />
                          <p className="text-sm text-foreground leading-relaxed">{f.finding || JSON.stringify(f)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compound Chains */}
                {session.synthesis.compoundChains?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-display font-bold text-foreground mb-4">COMPOUND CHAINS DETECTED</h2>
                    <div className="space-y-4">
                      {session.synthesis.compoundChains?.map((chain: any, i: number) => (
                        <div key={i} className="p-4 bg-background border border-border rounded-lg">
                          <h4 className="font-bold font-display mb-2">{chain.name || `Chain ${i + 1}`}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{chain.description || JSON.stringify(chain)}</p>
                          {chain.steps?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {chain.steps.map((step: string, si: number) => (
                                <span key={si} className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                                  {si + 1}. {step}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sharpest Insights */}
                {session.synthesis.sharpestInsights?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-display font-bold text-foreground mb-4">SHARPEST INSIGHTS</h2>
                    <div className="space-y-4">
                      {session.synthesis.sharpestInsights?.map((insight: any, i: number) => (
                        <div key={i} className="border-l-2 border-primary/50 pl-4">
                          <p className="text-sm text-foreground italic mb-1">
                            &ldquo;{insight.quote || JSON.stringify(insight)}&rdquo;
                          </p>
                          <p className="text-xs font-mono text-primary">— {insight.agent}</p>
                          {insight.significance && (
                            <p className="text-xs text-muted-foreground mt-1">{insight.significance}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blind Spots */}
                {session.synthesis.blindSpots?.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
                    <h2 className="text-xl font-display font-bold text-amber-400 mb-4 flex items-center gap-2">
                      <AlertTriangle size={20} /> BLIND SPOTS
                    </h2>
                    <div className="space-y-3">
                      {session.synthesis.blindSpots?.map((bs: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-amber-300">{bs.area || ""}</p>
                            <p className="text-sm text-muted-foreground">{bs.description || JSON.stringify(bs)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-red-500/40 rounded-xl p-8 max-w-md w-full mx-4 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <RotateCcw size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground uppercase">Reset Session</h2>
                <p className="text-xs font-mono text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              All generated content for <span className="text-foreground font-bold">{session.name}</span> will be permanently erased — Round 1 assessments, Round 2 rebuttals, and the synthesis report. The session will return to <span className="font-mono text-primary">PENDING</span> status with the same scenario and agents.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-secondary border border-border text-foreground font-bold rounded font-display uppercase tracking-wide hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={runReset}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/40 text-red-400 font-bold rounded font-display uppercase tracking-wide hover:bg-red-500/20 transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
