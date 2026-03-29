import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reports,
  sessions,
  sessionAgents,
  sessionFindings,
  sessionSynthesis,
  agents,
  scenarios,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const allReports = await db.select().from(reports).orderBy(reports.createdAt);
    res.json(allReports.reverse());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get reports" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    if (!report) return res.status(404).json({ error: "Not found" });
    res.json(report);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get report" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { sessionId, title, sections, format } = req.body;
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const sas = await db
      .select()
      .from(sessionAgents)
      .where(eq(sessionAgents.sessionId, sessionId));

    const agentsWithData = await Promise.all(
      sas.map(async (sa) => {
        const [agent] = await db.select().from(agents).where(eq(agents.id, sa.agentId));
        return { ...sa, agent };
      })
    );

    const [scenario] = session.scenarioId
      ? await db.select().from(scenarios).where(eq(scenarios.id, session.scenarioId))
      : [null];

    const [synthesis] = await db
      .select()
      .from(sessionSynthesis)
      .where(eq(sessionSynthesis.sessionId, sessionId));

    const requestedSections = sections || ["cover", "agent-roster", "consensus-findings", "synthesis"];

    let content = "";

    if (requestedSections.includes("cover")) {
      content += `# ${title}\n\n`;
      content += `**Session:** ${session.name}\n`;
      content += `**Phase Focus:** ${session.phaseFocus || "General"}\n`;
      content += `**Date:** ${new Date().toLocaleDateString()}\n`;
      content += `**Status:** ${session.status.toUpperCase()}\n\n---\n\n`;
    }

    if (requestedSections.includes("situation-brief") && scenario) {
      content += `## Situation Brief\n\n${scenario.contextDocument || "No context document provided."}\n\n---\n\n`;
    }

    if (requestedSections.includes("agent-roster")) {
      content += `## Agent Roster\n\n`;
      agentsWithData.forEach((sa, i) => {
        if (sa.agent) {
          content += `### ${i + 1}. ${sa.agent.name}\n`;
          content += `**Discipline:** ${sa.agent.discipline}\n`;
          content += `**Severity Default:** ${sa.agent.severityDefault}\n\n`;
        }
      });
      content += `---\n\n`;
    }

    if (requestedSections.includes("round1-assessments")) {
      content += `## Round 1 — Independent Assessments\n\n`;
      agentsWithData.forEach((sa) => {
        if (sa.agent && sa.round1Assessment) {
          content += `### ${sa.agent.name}\n\n${sa.round1Assessment}\n\n---\n\n`;
        }
      });
    }

    if (requestedSections.includes("round2-rebuttals")) {
      content += `## Round 2 — Cross-Discipline Debate\n\n`;
      agentsWithData.forEach((sa) => {
        if (sa.agent && sa.round2Rebuttal) {
          content += `### ${sa.agent.name}\n\n${sa.round2Rebuttal}\n\n---\n\n`;
        }
      });
    }

    if (requestedSections.includes("consensus-findings") && synthesis) {
      content += `## Consensus Findings\n\n`;
      const findings = (synthesis.consensusFindings as Array<{finding: string; severity: string; agents: string[]}>) || [];
      findings.forEach((f, i) => {
        content += `${i + 1}. **[${f.severity}]** ${f.finding}\n`;
        if (f.agents?.length) content += `   *Agents: ${f.agents.join(", ")}*\n`;
        content += "\n";
      });
      content += `---\n\n`;
    }

    if (requestedSections.includes("compound-chains") && synthesis) {
      content += `## Compound Chains\n\n`;
      const chains = (synthesis.compoundChains as Array<{name: string; description: string; steps: string[]}>) || [];
      chains.forEach((c) => {
        content += `### ${c.name}\n\n${c.description}\n\n`;
        if (c.steps?.length) {
          c.steps.forEach((step, i) => {
            content += `${i + 1}. ${step}\n`;
          });
        }
        content += "\n";
      });
      content += `---\n\n`;
    }

    if (requestedSections.includes("priority-actions") && synthesis) {
      content += `## Priority Mitigations\n\n`;
      const mitigations = (synthesis.priorityMitigations as Array<{priority: number; action: string; rationale: string; urgency: string}>) || [];
      mitigations.forEach((m) => {
        content += `${m.priority}. **${m.action}** (${m.urgency})\n   ${m.rationale}\n\n`;
      });
      content += `---\n\n`;
    }

    if (requestedSections.includes("synthesis") && synthesis) {
      content += `## Synthesis Summary\n\n`;
      const insights = (synthesis.sharpestInsights as Array<{quote: string; agent: string; significance: string}>) || [];
      if (insights.length > 0) {
        content += `### Sharpest Insights\n\n`;
        insights.forEach((insight) => {
          content += `> "${insight.quote}"\n> — ${insight.agent}\n\n*${insight.significance}*\n\n`;
        });
      }
    }

    const [report] = await db
      .insert(reports)
      .values({
        sessionId,
        title,
        sections: requestedSections,
        content,
        format: format || "markdown",
      })
      .returning();

    res.status(201).json(report);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
