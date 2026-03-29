import React from "react";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex items-center justify-center mb-6 text-primary animate-pulse">
        <AlertCircle size={64} />
      </div>
      <h1 className="text-4xl font-display font-bold mb-4 tracking-widest">404 - FILE NOT FOUND</h1>
      <p className="text-muted-foreground font-mono mb-8">The requested intelligence brief does not exist in the database.</p>
      <Link href="/">
        <button className="px-6 py-2 bg-primary text-primary-foreground font-bold font-display uppercase tracking-widest rounded hover:bg-primary/90 transition-colors">
          Return to Dashboard
        </button>
      </Link>
    </div>
  );
}
