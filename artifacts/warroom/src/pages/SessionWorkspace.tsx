import React, { useState } from "react";
import { useParams } from "wouter";
import { useGetSession, useGenerateSynthesis } from "@workspace/api-client-react";
import { useSSE } from "@/hooks/use-sse";
import { ShieldAlert, Play, RefreshCw, Layers, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import ReactMarkdown from "react-markdown";

export default function SessionWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, refetch } = useGetSession(Number(id));
  const { stream, isStreaming } = useSSE();
  const { mutateAsync: generateSynthesis } = useGenerateSynthesis();

  const [activeTab, setActiveTab] = useState<"ROUND1" | "ROUND2" | "SYNTHESIS">("ROUND1");
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  if (isLoading || !session) {
    return <div className="h-full flex items-center justify-center font-mono text-primary animate-pulse">CONNECTING TO SESSION...</div>;
  }

  const runRound1 = async () => {
    await stream(`/api/sessions/${id}/generate-round1`, null, {
      onDone: () => refetch()
    });
  };

  const runRound2 = async () => {
    await stream(`/api/sessions/${id}/generate-round2`, null, {
      onDone: () => refetch()
    });
  };

  const runSynthesis = async () => {
    await generateSynthesis({ id: Number(id) });
    refetch();
  };

  const toggleExpand = (agentId: number) => {
    setExpandedCards(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Workspace Header */}
      <div className="bg-card border-b border-border p-6 flex items-start justify-between z-10 shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold text-foreground uppercase">{session.name}</h1>
            <span className="text-[10px] px-2 py-1 rounded bg-secondary border border-border font-mono uppercase tracking-widest text-primary">
              {session.status}
            </span>
          </div>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl truncate">
            SCENARIO: {session.scenario?.name} // FOCUS: {session.phaseFocus}
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={runRound1} disabled={isStreaming || session.status !== 'pending'}
            className="px-4 py-2 bg-secondary border border-border text-foreground font-bold rounded hover:bg-white/5 font-display flex items-center gap-2 disabled:opacity-50"
          >
            <Play size={16} /> GEN ROUND 1
          </button>
          <button 
            onClick={runRound2} disabled={isStreaming || session.status !== 'round1'}
            className="px-4 py-2 bg-secondary border border-border text-foreground font-bold rounded hover:bg-white/5 font-display flex items-center gap-2 disabled:opacity-50"
          >
            <Layers size={16} /> GEN ROUND 2
          </button>
          <button 
            onClick={runSynthesis} disabled={isStreaming || session.status !== 'round2'}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 font-display flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} /> SYNTHESIZE
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6 bg-background/50">
        {(["ROUND1", "ROUND2", "SYNTHESIS"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 font-display font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab.replace('ROUND', 'ROUND ')}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {/* Streaming overlay */}
        {isStreaming && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary/20 border border-primary/50 text-primary px-6 py-2 rounded-full font-mono text-sm flex items-center gap-3 backdrop-blur shadow-[0_0_20px_rgba(240,165,0,0.2)] z-50">
            <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
            GENERATING ANALYSIS STREAM...
          </div>
        )}

        {activeTab === "ROUND1" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {session.sessionAgents?.map(sa => (
              <div key={sa.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[600px]">
                <div className="p-4 border-b border-white/5 bg-background/30 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold font-display text-lg text-foreground">{sa.agent?.name}</h3>
                    <p className="text-xs text-primary font-mono">{sa.agent?.discipline}</p>
                  </div>
                  {sa.round1Severity && <SeverityBadge severity={sa.round1Severity} />}
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto prose prose-invert prose-p:text-sm prose-p:leading-relaxed prose-headings:font-display max-w-none">
                  {sa.round1Assessment ? (
                    <ReactMarkdown>{sa.round1Assessment}</ReactMarkdown>
                  ) : (
                    <div className="text-center text-muted-foreground py-10 font-mono text-sm opacity-50">
                      AWAITING GENERATION
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "ROUND2" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {session.sessionAgents?.map(sa => (
              <div key={sa.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[600px]">
                <div className="p-4 border-b border-white/5 bg-background/30 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold font-display text-lg text-foreground">{sa.agent?.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono">CROSS-DISCIPLINE REBUTTAL</span>
                  </div>
                  {sa.round2RevisedSeverity && <SeverityBadge severity={sa.round2RevisedSeverity} />}
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto prose prose-invert prose-p:text-sm max-w-none">
                  {sa.round2Rebuttal ? (
                    <ReactMarkdown>{sa.round2Rebuttal}</ReactMarkdown>
                  ) : (
                    <div className="text-center text-muted-foreground py-10 font-mono text-sm opacity-50">
                      REQUIRES ROUND 1 COMPLETION
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "SYNTHESIS" && (
          <div className="max-w-4xl mx-auto">
            {!session.synthesis ? (
               <div className="text-center text-muted-foreground py-20 font-mono border border-dashed border-border rounded-xl">
                 SYNTHESIS NOT GENERATED YET
               </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
                  <h2 className="text-2xl font-display font-bold text-primary mb-6 flex items-center gap-3">
                    <ShieldAlert /> PRIORITY MITIGATIONS
                  </h2>
                  <div className="space-y-4">
                    {session.synthesis.priorityMitigations?.map((m: any, i: number) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">{i+1}</div>
                        <p className="text-foreground leading-relaxed">{m.text || JSON.stringify(m)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
                  <h2 className="text-2xl font-display font-bold text-foreground mb-6">COMPOUND CHAINS DETECTED</h2>
                  <div className="space-y-4">
                    {session.synthesis.compoundChains?.map((chain: any, i: number) => (
                      <div key={i} className="p-4 bg-background border border-border rounded-lg">
                        <h4 className="font-bold text-lg mb-2">{chain.name || `Chain ${i+1}`}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{chain.description || JSON.stringify(chain)}</p>
                        <button className="text-xs bg-secondary px-3 py-1 rounded font-mono hover:bg-white/10 text-white">SAVE TO LIBRARY</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
