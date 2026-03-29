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
  Activity,
  X,
  BookOpen,
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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { data: stats } = useGetStats();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-transform duration-300",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border bg-background/50">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}images/logo-mark.png`} alt="Logo" className="w-8 h-8 opacity-90 drop-shadow-[0_0_8px_rgba(240,165,0,0.5)]" />
            <h1 className="font-display font-bold text-xl tracking-widest text-primary drop-shadow-[0_0_4px_rgba(240,165,0,0.3)]">
              WARROOM
            </h1>
          </div>
          {/* Close button — mobile only */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto flex flex-col">
          <div className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
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
          </div>

          {/* Reference section */}
          <div className="mt-4 pt-4 border-t border-sidebar-border/50 space-y-1">
            <p className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-widest px-3 mb-2">Reference</p>
            {(() => {
              const isActive = location === "/guide";
              return (
                <Link
                  href="/guide"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_12px_rgba(240,165,0,0.05)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  <BookOpen size={18} className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-primary drop-shadow-[0_0_5px_rgba(240,165,0,0.5)]" : "group-hover:text-foreground"
                  )} />
                  Field Manual
                </Link>
              );
            })()}
          </div>
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
    </>
  );
}
