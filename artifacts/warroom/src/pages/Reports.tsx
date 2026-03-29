import React from "react";
import { useGetReports } from "@workspace/api-client-react";
import { FileOutput, Download } from "lucide-react";

export default function Reports() {
  const { data: reports, isLoading } = useGetReports();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Generated Reports</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded font-display uppercase">New Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports?.map(report => (
          <div key={report.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <FileOutput size={24} className="text-primary" />
              <button className="text-muted-foreground hover:text-white"><Download size={18} /></button>
            </div>
            <h3 className="text-xl font-bold font-display mb-2">{report.title}</h3>
            <p className="text-xs font-mono text-muted-foreground uppercase">{report.format} format</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {report.sections?.map(s => <span key={s} className="text-[10px] px-2 py-1 bg-background border border-border rounded">{s}</span>)}
            </div>
          </div>
        ))}
        {(!reports || reports.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground font-mono border border-dashed border-border rounded-xl">
            No reports generated yet. Run a session synthesis to generate reports.
          </div>
        )}
      </div>
    </div>
  );
}
