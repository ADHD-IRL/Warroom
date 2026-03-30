import React from "react";
import { useGetReports } from "@workspace/api-client-react";
import { FileOutput, Download, Clock, Layers } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  "cover":              "Cover",
  "situation-brief":    "Situation Brief",
  "agent-roster":       "Agent Roster",
  "round1-assessments": "Round 1",
  "round2-rebuttals":   "Round 2",
  "consensus-findings": "Consensus",
  "compound-chains":    "Chains",
  "priority-actions":   "Mitigations",
  "synthesis":          "Synthesis",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function Reports() {
  const { data: reports, isLoading } = useGetReports();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Generated Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reports are saved automatically each time a PDF is downloaded from a session
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse h-44" />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <FileOutput size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-lg font-bold text-muted-foreground uppercase mb-2">
            No Reports Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Download a PDF from any session workspace — reports will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report: any) => (
            <div
              key={report.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <FileOutput size={22} className="text-primary shrink-0 mt-0.5" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground bg-background/60 border border-border px-2 py-0.5 rounded">
                  {report.format || "markdown"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-display text-foreground leading-snug">
                  {report.title}
                </h3>
                {report.createdAt && (
                  <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(report.createdAt)}
                  </p>
                )}
              </div>

              {report.sections?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {report.sections.filter((s: string) => s !== "cover").map((s: string) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-mono uppercase tracking-wide"
                    >
                      {SECTION_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Layers size={11} />
                Session #{report.sessionId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
