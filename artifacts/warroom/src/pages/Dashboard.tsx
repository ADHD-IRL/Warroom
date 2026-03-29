import React from "react";
import { useGetStats } from "@workspace/api-client-react";
import { Users, PlayCircle, GitMerge, FileText, Activity, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Activity className="animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Total Agents", value: stats?.totalAgents || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { label: "Active Sessions", value: stats?.activeSessions || 0, icon: PlayCircle, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Compound Chains", value: stats?.totalChains || 0, icon: GitMerge, color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20" },
    { label: "Scenarios", value: stats?.totalScenarios || 0, icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-10 border border-white/10 shadow-2xl shadow-black/50">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero" 
            className="w-full h-full object-cover opacity-30 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            SYSTEM OPERATIONAL
          </div>
          <h1 className="text-5xl font-display font-bold text-white mb-4 leading-tight">
            STRATEGIC ANALYSIS <br/> <span className="text-primary">COMMAND CENTER</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Deploy specialized AI agents to analyze complex scenarios, uncover compound threat chains, and red-team strategic plans.
          </p>
          <div className="flex gap-4">
            <Link href="/sessions" className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-bold font-display uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(240,165,0,0.3)]">
              Start New Session
            </Link>
            <Link href="/agents" className="px-6 py-3 rounded-md bg-secondary border border-white/10 text-foreground font-bold font-display uppercase tracking-wider hover:bg-white/5 transition-colors">
              Manage Agents
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-card rounded-xl p-6 border border-border flex items-center gap-5 hover:border-white/20 transition-colors tech-border"
          >
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${stat.bg} ${stat.border} border`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground uppercase">{stat.label}</p>
              <h3 className="text-3xl font-display font-bold text-foreground">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground">Recent Sessions</h2>
            <Link href="/sessions" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-mono">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            {stats?.recentSessions?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No recent sessions found.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-background/50 border-b border-border text-left text-xs font-mono uppercase text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Session Name</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Agents</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stats?.recentSessions?.slice(0, 5).map(session => (
                    <tr key={session.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => window.location.href = `/sessions/${session.id}`}>
                      <td className="p-4">
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{session.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{session.phaseFocus}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-mono px-2 py-1 rounded bg-secondary border border-border uppercase">
                          {session.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{session.agentCount}</td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">
                        {new Date(session.createdAt || '').toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-foreground">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { title: "Generate New AI Agent", desc: "Create a custom expert profile", href: "/agents", icon: Users },
              { title: "Build Compound Chain", desc: "Map multi-discipline scenarios", href: "/chains", icon: GitMerge },
              { title: "Draft Scenario Context", desc: "Write briefing documents", href: "/scenarios", icon: FileText },
            ].map(action => (
              <Link key={action.title} href={action.href} className="block p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-background border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:text-primary transition-colors">
                    <action.icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
