import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface VectorBarProps {
  label: "Human" | "Technical" | "Physical" | "Futures";
  value: number; // 0-100
  className?: string;
}

export function VectorBar({ label, value, className }: VectorBarProps) {
  const getColor = () => {
    switch (label) {
      case "Human": return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
      case "Technical": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
      case "Physical": return "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]";
      case "Futures": return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]";
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-foreground/70">{value}%</span>
      </div>
      <div className="h-1 w-full bg-background/50 rounded-full overflow-hidden border border-border/30">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", getColor())} 
        />
      </div>
    </div>
  );
}
