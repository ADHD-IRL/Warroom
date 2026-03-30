import { jsPDF } from "jspdf";

// ── Colour palette ────────────────────────────────────────────────────────────
const NAVY   = [10, 14, 26]   as [number, number, number];
const AMBER  = [240, 165, 0]  as [number, number, number];
const WHITE  = [255, 255, 255] as [number, number, number];
const LIGHT  = [245, 247, 250] as [number, number, number];
const MUTED  = [100, 110, 130] as [number, number, number];
const DARK   = [30, 37, 53]   as [number, number, number];
const BORDER = [220, 225, 235] as [number, number, number];

const SEVERITY_COLOR: Record<string, [number, number, number]> = {
  CRITICAL: [220, 38, 38],
  HIGH:     [234, 88, 12],
  MEDIUM:   [202, 138, 4],
  LOW:      [22, 163, 74],
};

const PAGE_W  = 210; // A4 mm
const PAGE_H  = 297;
const MARGIN  = 18;
const BODY_W  = PAGE_W - MARGIN * 2;

// Strip markdown syntax for clean PDF text
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, (m) => m)
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function addPageBranding(doc: jsPDF, session: any) {
  const page = doc.getNumberOfPages();
  doc.setPage(page);

  // Thin amber line at top
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, PAGE_W, 1.5, "F");

  // Footer
  doc.setFillColor(...NAVY);
  doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");

  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`WARROOM // ${session.name.toUpperCase()}`, MARGIN, PAGE_H - 3.5);
  doc.text(`PAGE ${page}`, PAGE_W - MARGIN, PAGE_H - 3.5, { align: "right" });
}

function ensureSpace(doc: jsPDF, y: number, needed: number, session: any): number {
  if (y + needed > PAGE_H - 16) {
    doc.addPage();
    addPageBranding(doc, session);
    return 24;
  }
  return y;
}

function sectionHeader(doc: jsPDF, label: string, y: number): number {
  doc.setFillColor(...DARK);
  doc.roundedRect(MARGIN, y, BODY_W, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...AMBER);
  doc.text(label.toUpperCase(), MARGIN + 4, y + 5.5);
  return y + 13;
}

function agentBlock(
  doc: jsPDF,
  name: string,
  discipline: string,
  severity: string | undefined,
  bodyText: string,
  y: number,
  session: any
): number {
  const cleaned = stripMarkdown(bodyText);
  doc.setFontSize(8.5);
  const lines = doc.splitTextToSize(cleaned, BODY_W - 8);
  const blockH = 14 + lines.length * 4.2;

  y = ensureSpace(doc, y, Math.min(blockH, 60), session);

  // Card outline
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, BODY_W, Math.min(blockH, 60), 1.5, 1.5, "D");

  // Agent name bar
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, y, BODY_W, 9, 1.5, 1.5, "F");
  doc.rect(MARGIN, y + 4.5, BODY_W, 4.5, "F"); // square bottom corners

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(name.toUpperCase(), MARGIN + 4, y + 6);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(discipline, MARGIN + 4, y + 12);

  if (severity && SEVERITY_COLOR[severity]) {
    const col = SEVERITY_COLOR[severity];
    doc.setFillColor(...col);
    doc.roundedRect(MARGIN + BODY_W - 22, y + 2, 18, 5, 1, 1, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(severity, MARGIN + BODY_W - 13, y + 5.6, { align: "center" });
  }

  y += 14;

  // Body text — paginate through lines
  for (let i = 0; i < lines.length; i++) {
    y = ensureSpace(doc, y, 5, session);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 55, 65);
    doc.text(lines[i], MARGIN + 4, y);
    y += 4.2;
  }

  return y + 6;
}

// ── Cover Page ────────────────────────────────────────────────────────────────
function addCoverPage(doc: jsPDF, session: any, subtitle: string) {
  // Full navy background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Amber accent bar
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, 4, PAGE_H, "F");

  // WARROOM label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...AMBER);
  doc.text("WARROOM", MARGIN + 6, 32);

  // Title
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize(session.name.toUpperCase(), BODY_W - 10);
  doc.text(titleLines, MARGIN + 6, 55);

  // Subtitle (report type)
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...AMBER);
  doc.text(subtitle.toUpperCase(), MARGIN + 6, 55 + titleLines.length * 12 + 6);

  // Divider
  const divY = 55 + titleLines.length * 12 + 18;
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 6, divY, PAGE_W - MARGIN, divY);

  // Session metadata
  const metaY = divY + 12;
  const meta = [
    ["SCENARIO", session.scenario?.name || "—"],
    ["FOCUS",    session.phaseFocus || "General Analysis"],
    ["STATUS",   session.status?.toUpperCase() || "—"],
    ["AGENTS",   String(session.sessionAgents?.length ?? 0)],
    ["DATE",     new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
  ];

  doc.setFontSize(8.5);
  meta.forEach(([label, value], i) => {
    const rowY = metaY + i * 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN + 6, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...WHITE);
    doc.text(value, MARGIN + 40, rowY);
  });

  // Agent roster
  const rosterY = metaY + meta.length * 10 + 14;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...AMBER);
  doc.text("ANALYST TEAM", MARGIN + 6, rosterY);

  const agents = session.sessionAgents ?? [];
  agents.slice(0, 20).forEach((sa: any, i: number) => {
    const col   = i < 10 ? 0 : 1;
    const row   = i % 10;
    const aX    = MARGIN + 6 + col * (BODY_W / 2);
    const aY    = rosterY + 6 + row * 6.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 185, 200);
    doc.setFontSize(7.5);
    doc.text(`• ${sa.agent?.name || "Agent"}`, aX, aY);
  });

  // Bottom bar
  doc.setFillColor(5, 8, 18);
  doc.rect(0, PAGE_H - 14, PAGE_W, 14, "F");
  doc.setFillColor(...AMBER);
  doc.rect(0, PAGE_H - 14, PAGE_W, 0.8, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("CONFIDENTIAL // WARROOM ANALYSIS PLATFORM", PAGE_W / 2, PAGE_H - 5, { align: "center" });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function downloadRound1PDF(session: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  addCoverPage(doc, session, "Round 1 — Independent Assessments");
  doc.addPage();
  addPageBranding(doc, session);

  let y = 24;
  y = sectionHeader(doc, "Round 1 — Independent Agent Assessments", y);
  y += 4;

  const agents = session.sessionAgents ?? [];
  for (const sa of agents) {
    if (!sa.round1Assessment) continue;
    y = agentBlock(
      doc,
      sa.agent?.name || "Agent",
      sa.agent?.discipline || "",
      sa.round1Severity,
      sa.round1Assessment,
      y,
      session
    );
    y += 4;
  }

  const slug = session.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  doc.save(`warroom_${slug}_round1.pdf`);
}

export function downloadRound2PDF(session: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  addCoverPage(doc, session, "Round 2 — Cross-Discipline Rebuttals");
  doc.addPage();
  addPageBranding(doc, session);

  let y = 24;
  y = sectionHeader(doc, "Round 2 — Cross-Discipline Rebuttals", y);
  y += 4;

  const agents = session.sessionAgents ?? [];
  for (const sa of agents) {
    if (!sa.round2Rebuttal) continue;
    y = agentBlock(
      doc,
      sa.agent?.name || "Agent",
      sa.agent?.discipline || "",
      sa.round2RevisedSeverity,
      sa.round2Rebuttal,
      y,
      session
    );
    y += 4;
  }

  const slug = session.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  doc.save(`warroom_${slug}_round2.pdf`);
}

export function downloadSynthesisPDF(session: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  addCoverPage(doc, session, "Synthesis — Strategic Intelligence Summary");
  doc.addPage();
  addPageBranding(doc, session);

  let y = 24;
  const syn = session.synthesis;

  if (!syn) {
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text("Synthesis not yet generated.", MARGIN, y + 20);
    doc.save(`warroom_synthesis.pdf`);
    return;
  }

  // Priority Mitigations
  if (syn.priorityMitigations?.length) {
    y = sectionHeader(doc, "Priority Mitigations", y);
    for (const m of syn.priorityMitigations) {
      const text = m.action || m.text || JSON.stringify(m);
      const urgency = m.urgency ? ` [${m.urgency.toUpperCase()}]` : "";
      const lines = doc.splitTextToSize(`${text}${urgency}`, BODY_W - 12);
      y = ensureSpace(doc, y, lines.length * 4.5 + 4, session);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...AMBER);
      doc.text("→", MARGIN + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 55, 65);
      doc.text(lines, MARGIN + 8, y);
      y += lines.length * 4.5 + 3;
    }
    y += 4;
  }

  // Consensus Findings
  if (syn.consensusFindings?.length) {
    y = ensureSpace(doc, y, 20, session);
    y = sectionHeader(doc, "Consensus Findings", y);
    for (const f of syn.consensusFindings) {
      const text = f.finding || JSON.stringify(f);
      const sev  = f.severity || "";
      const lines = doc.splitTextToSize(text, BODY_W - 30);
      y = ensureSpace(doc, y, lines.length * 4.5 + 4, session);

      if (sev && SEVERITY_COLOR[sev]) {
        doc.setFillColor(...SEVERITY_COLOR[sev]);
        doc.roundedRect(MARGIN, y - 3, 16, 5, 0.8, 0.8, "F");
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...WHITE);
        doc.text(sev, MARGIN + 8, y + 0.5, { align: "center" });
      }

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 55, 65);
      doc.text(lines, MARGIN + 20, y);
      y += lines.length * 4.5 + 3;
    }
    y += 4;
  }

  // Compound Chains
  if (syn.compoundChains?.length) {
    y = ensureSpace(doc, y, 20, session);
    y = sectionHeader(doc, "Compound Attack Chains", y);
    for (const chain of syn.compoundChains) {
      const name = chain.name || "Chain";
      const desc = chain.description || "";
      const nameLines = doc.splitTextToSize(name.toUpperCase(), BODY_W - 8);
      const descLines = doc.splitTextToSize(desc, BODY_W - 8);
      y = ensureSpace(doc, y, (nameLines.length + descLines.length) * 4.5 + 10, session);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(nameLines, MARGIN + 4, y);
      y += nameLines.length * 4.5 + 1;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(descLines, MARGIN + 4, y);
      y += descLines.length * 4.5 + 4;

      if (chain.steps?.length) {
        chain.steps.forEach((step: string, si: number) => {
          const stepLines = doc.splitTextToSize(`${si + 1}. ${step}`, BODY_W - 12);
          y = ensureSpace(doc, y, stepLines.length * 4.2, session);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 90, 110);
          doc.text(stepLines, MARGIN + 8, y);
          y += stepLines.length * 4.2 + 1.5;
        });
        y += 2;
      }
    }
    y += 4;
  }

  // Sharpest Insights
  if (syn.sharpestInsights?.length) {
    y = ensureSpace(doc, y, 20, session);
    y = sectionHeader(doc, "Sharpest Insights", y);
    for (const insight of syn.sharpestInsights) {
      const quote = `"${insight.quote || JSON.stringify(insight)}"`;
      const agent = `— ${insight.agent || ""}`;
      const sig   = insight.significance || "";
      const qLines = doc.splitTextToSize(quote, BODY_W - 10);
      const sLines = sig ? doc.splitTextToSize(sig, BODY_W - 10) : [];
      y = ensureSpace(doc, y, (qLines.length + sLines.length) * 4.5 + 10, session);

      doc.setFillColor(245, 248, 255);
      doc.roundedRect(MARGIN, y - 3, BODY_W, qLines.length * 4.5 + (sLines.length ? sLines.length * 4.5 + 3 : 0) + 9, 1, 1, "F");
      doc.setDrawColor(...AMBER);
      doc.setLineWidth(0.8);
      doc.line(MARGIN + 1, y - 3, MARGIN + 1, y - 3 + qLines.length * 4.5 + (sLines.length ? sLines.length * 4.5 + 3 : 0) + 9);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(40, 50, 70);
      doc.text(qLines, MARGIN + 5, y);
      y += qLines.length * 4.5 + 2;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...AMBER);
      doc.text(agent, MARGIN + 5, y);
      y += 5;

      if (sLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...MUTED);
        doc.text(sLines, MARGIN + 5, y);
        y += sLines.length * 4.5;
      }
      y += 5;
    }
    y += 4;
  }

  // Blind Spots
  if (syn.blindSpots?.length) {
    y = ensureSpace(doc, y, 20, session);
    y = sectionHeader(doc, "Blind Spots", y);
    for (const bs of syn.blindSpots) {
      const area = bs.area || "";
      const desc = bs.description || "";
      const aLines = doc.splitTextToSize(area, BODY_W - 8);
      const dLines = doc.splitTextToSize(desc, BODY_W - 8);
      y = ensureSpace(doc, y, (aLines.length + dLines.length) * 4.5 + 4, session);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(202, 138, 4);
      doc.text("⚠ " + area, MARGIN + 4, y);
      y += aLines.length * 4.5 + 1;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 90, 110);
      doc.text(dLines, MARGIN + 4, y);
      y += dLines.length * 4.5 + 4;
    }
  }

  const slug = session.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  doc.save(`warroom_${slug}_synthesis.pdf`);
}

export function downloadFullReportPDF(session: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  addCoverPage(doc, session, "Full Analysis Report");

  // ── Round 1 ──
  const r1agents = (session.sessionAgents ?? []).filter((sa: any) => sa.round1Assessment);
  if (r1agents.length > 0) {
    doc.addPage();
    addPageBranding(doc, session);
    let y = 24;
    y = sectionHeader(doc, "Part 1 — Round 1: Independent Assessments", y);
    y += 4;
    for (const sa of r1agents) {
      y = agentBlock(doc, sa.agent?.name || "Agent", sa.agent?.discipline || "", sa.round1Severity, sa.round1Assessment, y, session);
      y += 4;
    }
  }

  // ── Round 2 ──
  const r2agents = (session.sessionAgents ?? []).filter((sa: any) => sa.round2Rebuttal);
  if (r2agents.length > 0) {
    doc.addPage();
    addPageBranding(doc, session);
    let y = 24;
    y = sectionHeader(doc, "Part 2 — Round 2: Cross-Discipline Rebuttals", y);
    y += 4;
    for (const sa of r2agents) {
      y = agentBlock(doc, sa.agent?.name || "Agent", sa.agent?.discipline || "", sa.round2RevisedSeverity, sa.round2Rebuttal, y, session);
      y += 4;
    }
  }

  // ── Synthesis ──
  if (session.synthesis) {
    // Reuse synthesis page generation by creating a temp doc then merging isn't straightforward in jsPDF
    // Instead, inline the synthesis content
    doc.addPage();
    addPageBranding(doc, session);
    let y = 24;
    const syn = session.synthesis;

    y = sectionHeader(doc, "Part 3 — Synthesis: Strategic Intelligence Summary", y);
    y += 4;

    if (syn.priorityMitigations?.length) {
      y = ensureSpace(doc, y, 14, session);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("PRIORITY MITIGATIONS", MARGIN, y);
      y += 6;
      for (const m of syn.priorityMitigations) {
        const text = m.action || m.text || JSON.stringify(m);
        const lines = doc.splitTextToSize(text, BODY_W - 10);
        y = ensureSpace(doc, y, lines.length * 4.5 + 3, session);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...AMBER);
        doc.text("→", MARGIN + 2, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 55, 65);
        doc.text(lines, MARGIN + 8, y);
        y += lines.length * 4.5 + 3;
      }
      y += 4;
    }

    if (syn.consensusFindings?.length) {
      y = ensureSpace(doc, y, 14, session);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("CONSENSUS FINDINGS", MARGIN, y);
      y += 6;
      for (const f of syn.consensusFindings) {
        const text = f.finding || JSON.stringify(f);
        const lines = doc.splitTextToSize(text, BODY_W - 10);
        y = ensureSpace(doc, y, lines.length * 4.5 + 3, session);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 55, 65);
        doc.text(lines, MARGIN + 4, y);
        y += lines.length * 4.5 + 3;
      }
      y += 4;
    }

    if (syn.compoundChains?.length) {
      y = ensureSpace(doc, y, 14, session);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("COMPOUND ATTACK CHAINS", MARGIN, y);
      y += 6;
      for (const chain of syn.compoundChains) {
        const name = chain.name || "Chain";
        const desc = chain.description || "";
        const nameLines = doc.splitTextToSize(name, BODY_W - 8);
        const descLines = doc.splitTextToSize(desc, BODY_W - 8);
        y = ensureSpace(doc, y, (nameLines.length + descLines.length) * 4.5 + 6, session);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...NAVY);
        doc.text(nameLines, MARGIN + 4, y);
        y += nameLines.length * 4.5 + 1;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...MUTED);
        doc.text(descLines, MARGIN + 4, y);
        y += descLines.length * 4.5 + 4;
      }
      y += 4;
    }

    if (syn.sharpestInsights?.length) {
      y = ensureSpace(doc, y, 14, session);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("SHARPEST INSIGHTS", MARGIN, y);
      y += 6;
      for (const insight of syn.sharpestInsights) {
        const quote = `"${insight.quote || JSON.stringify(insight)}"`;
        const agent = `— ${insight.agent || ""}`;
        const qLines = doc.splitTextToSize(quote, BODY_W - 10);
        y = ensureSpace(doc, y, qLines.length * 4.5 + 8, session);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(40, 50, 70);
        doc.text(qLines, MARGIN + 4, y);
        y += qLines.length * 4.5 + 2;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...AMBER);
        doc.text(agent, MARGIN + 4, y);
        y += 6;
      }
    }
  }

  const slug = session.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  doc.save(`warroom_${slug}_full_report.pdf`);
}
