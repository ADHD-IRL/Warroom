import React, { useState } from "react";
import { useGetSessions, useCreateSession, useGetAgents, useGetScenarios } from "@workspace/api-client-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlayCircle, Plus, Users, LayoutDashboard, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sessions() {
  const { data: sessions, isLoading } = useGetSessions();
  const { data: agents } = useGetAgents({});
  const { data: scenarios } = useGetScenarios({});
  const { mutateAsync: createSession } = useCreateSession();
  const [, setLocation] = useLocation();

  const [isCreating, setIsCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<number>();
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  const handleCreate = async () => {
    if (!newSessionName || !selectedScenario || selectedAgents.length < 3) return;
    try {
      const session = await createSession({
        data: {
          name: newSessionName,
          scenarioId: selectedScenario,
          agentIds: selectedAgents,
          phaseFocus: "Initial Assessment"
        }
      });
      setLocation(`/sessions/${session.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-muted text-muted-foreground border-border';
      case 'round1': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'round2': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'complete': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-border text-foreground';
    }
  };

  if (isCreating) {
    return (
      <div className="h-full flex flex-col p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Configure Session</h1>
        
        <div className="grid grid-cols-2 gap-8 flex-1">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-lg font-display font-bold mb-4 uppercase">1. Basic Details</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Session Name (e.g. Operation Winter Storm)" 
                  value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  className="military-input"
                />
                <select 
                  className="military-input appearance-none"
                  value={selectedScenario || ''}
                  onChange={e => setSelectedScenario(Number(e.target.value))}
                >
                  <option value="" disabled>Select Scenario Context...</option>
                  {scenarios?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-lg font-display font-bold mb-4 uppercase">2. Select Agents (Min 3)</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {agents?.map(agent => (
                  <div 
                    key={agent.id}
                    onClick={() => {
                      if (selectedAgents.includes(agent.id)) {
                        setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
                      } else {
                        setSelectedAgents([...selectedAgents, agent.id]);
                      }
                    }}
                    className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${selectedAgents.includes(agent.id) ? 'bg-primary/10 border-primary' : 'bg-background border-border hover:border-white/20'}`}
                  >
                    <div>
                      <p className="font-bold font-display">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.discipline}</p>
                    </div>
                    {selectedAgents.includes(agent.id) && <div className="w-4 h-4 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-8 bg-card p-6 rounded-xl border border-primary/50 shadow-[0_0_30px_rgba(240,165,0,0.1)]">
              <h3 className="text-lg font-display font-bold mb-6 uppercase text-primary">Pre-flight Checklist</h3>
              
              <ul className="space-y-4 font-mono text-sm mb-8">
                <li className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${newSessionName ? 'bg-primary/20 border-primary' : 'border-border'}`}>
                    {newSessionName && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className={newSessionName ? 'text-foreground' : 'text-muted-foreground'}>Name specified</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedScenario ? 'bg-primary/20 border-primary' : 'border-border'}`}>
                    {selectedScenario && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className={selectedScenario ? 'text-foreground' : 'text-muted-foreground'}>Scenario selected</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedAgents.length >= 3 ? 'bg-primary/20 border-primary' : 'border-border'}`}>
                    {selectedAgents.length >= 3 && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className={selectedAgents.length >= 3 ? 'text-foreground' : 'text-muted-foreground'}>Team assembled ({selectedAgents.length}/3 min)</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleCreate}
                  disabled={!newSessionName || !selectedScenario || selectedAgents.length < 3}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-md font-display text-lg uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(240,165,0,0.3)]"
                >
                  Initialize Session
                </button>
                <button onClick={() => setIsCreating(false)} className="w-full py-3 text-muted-foreground font-bold hover:text-white transition-colors">
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Warroom Sessions</h1>
          <p className="text-muted-foreground">Manage and run active analysis operations.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-md uppercase font-display tracking-widest hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(240,165,0,0.2)]"
        >
          <PlayCircle size={20} /> New Session
        </button>
      </div>

      {sessions?.length === 0 ? (
        <EmptyState 
          icon={LayoutDashboard}
          title="No Active Sessions"
          description="A session runs your selected agents through a structured two-round analysis of any scenario."
          action={
            <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-md font-display uppercase">
              Start Session
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions?.map(session => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all group cursor-pointer shadow-lg hover:shadow-primary/10">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-mono px-2 py-1 rounded border uppercase ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {session.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mt-6">
                  <span className="flex items-center gap-1.5"><Users size={14}/> {session.agentCount} Agents</span>
                  <span className="flex items-center gap-1.5"><FileText size={14}/> Context Attached</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
