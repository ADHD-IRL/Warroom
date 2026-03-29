import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Menu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground flex relative overflow-x-hidden">
      {/* Global Background effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sidebar/40 via-background to-background"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <span className="ml-3 font-display font-bold text-lg tracking-widest text-primary drop-shadow-[0_0_4px_rgba(240,165,0,0.3)]">
          WARROOM
        </span>
      </div>

      <main className="flex-1 md:ml-64 relative z-10 h-screen overflow-y-auto overflow-x-hidden pt-14 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
