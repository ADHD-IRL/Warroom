import React from "react";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const getColors = () => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-[#C0392B] text-white border-[#C0392B]/50 shadow-[0_0_10px_rgba(192,57,43,0.3)]";
      case "HIGH":
        return "bg-[#D68910] text-[#1A1A1A] border-[#D68910]/50 shadow-[0_0_10px_rgba(214,137,16,0.3)]";
      case "MEDIUM":
        return "bg-[#2E86AB] text-white border-[#2E86AB]/50";
      case "LOW":
        return "bg-[#27AE60] text-white border-[#27AE60]/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-display border",
      getColors(),
      className
    )}>
      {severity}
    </span>
  );
}
