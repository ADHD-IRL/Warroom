import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Globe2, 
  FileText, 
  Target, 
  Users, 
  GitMerge, 
  PlayCircle, 
  FileOutput,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetStats } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe2 },
  { href: "/scenarios", label: "Scenarios", icon: FileText },
  { href: "/threats", label: "Threats", icon: Target },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/chains", label: "Chains", icon: GitMerge },
  { href: "/sessions", label: "Sessions", icon: PlayCircle },
  { href: "/reports", label: "Reports", icon: FileOutput },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useGetStats();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-background/50">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo-mark.png`} alt="Logo" className="w-8 h-8 opacity-90 drop-shadow-[0_0_8px_rgba(240,165,0,0.5)]" />
          <h1 className="font-display font-bold text-xl tracking-widest text-primary drop-shadow-[0_0_4px_rgba(240,165,0,0.3)]">
            WARROOM
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_12px_rgba(240,165,0,0.05)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-colors duration-200",
                isActive ? "text-primary drop-shadow-[0_0_5px_rgba(240,165,0,0.5)]" : "group-hover:text-foreground"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-sidebar-border bg-background/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Activity size={12} className="text-green-500 animate-pulse" />
            SYSTEM ONLINE
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-mono">v1.0.0</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/50 rounded p-2 border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase">Agents</p>
            <p className="text-sm font-bold font-mono text-foreground">{stats?.totalAgents || 0}</p>
          </div>
          <div className="bg-background/50 rounded p-2 border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase">Active Ops</p>
            <p className="text-sm font-bold font-mono text-primary">{stats?.activeSessions || 0}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
