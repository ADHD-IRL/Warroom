import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: LucideIcon;
  image?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, image, title, description, action }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-lg mx-auto"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
        {image ? (
          <img src={image} alt="Empty" className="w-48 h-48 object-contain relative z-10 drop-shadow-2xl" />
        ) : Icon ? (
          <div className="w-24 h-24 rounded-2xl bg-secondary border border-border flex items-center justify-center relative z-10 shadow-2xl">
            <Icon size={48} className="text-primary opacity-80" />
          </div>
        ) : null}
      </div>
      
      <h3 className="text-2xl font-display font-bold text-foreground mb-3 uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        {description}
      </p>
      
      {action}
    </motion.div>
  );
}
