import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  sessions,
  sessionAgents,
  sessionFindings,
  sessionSynthesis,
  agents,
  scenarios,
  domains,
  chains,
  chainSteps,
  threats,
} from "@workspace/db/schema";
import { eq, and, or } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function getSessionDetail(sessionId: number) {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session) return null;

  const sa = await db
    .select()
    .from(sessionAgents)
    .where(eq(sessionAgents.sessionId, sessionId));

  const agentsWithData = await Promise.all(
    sa.map(async (a) => {
      const [agent] = await db.select().from(agents).where(eq(agents.id, a.agentId));
      return { ...a, agent };
    })
  );

  const findings = await db
    .select()
    .from(sessionFindings)
    .where(eq(sessionFindings.sessionId, sessionId));

  const [synthesis] = await db
    .select()
    .from(sessionSynthesis)
    .where(eq(sessionSynthesis.sessionId, sessionId));

  let scenario = null;
  let domain = null;
  if (session.scenarioId) {
    const [s] = await db.select().from(scenarios).where(eq(scenarios.id, session.scenarioId));
    scenario = s || null;
  }
  if (session.domainId) {
    const [d] = await db.select().from(domains).where(eq(domains.id, session.domainId));
    domain = d || null;
  }

  return {
    ...session,
    scenario,
    domain,
    sessionAgents: agentsWithData,
    findings,
    synthesis: synthesis || null,
  };
}

router.get("/", async (req, res) => {
  try {
    const allSessions = await db.select().from(sessions).orderBy(sessions.createdAt);
    const withAgentCount = await Promise.all(
      allSessions.map(async (s) => {
        const sas = await db
          .select()
          .from(sessionAgents)
          .where(eq(sessionAgents.sessionId, s.id));
        return { ...s, agentCount: sas.length };
      })
    );
    res.json(withAgentCount.reverse());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const detail = await getSessionDetail(id);
    if (!detail) return res.status(404).json({ error: "Not found" });
    res.json(detail);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get session" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, scenarioId, domainId, phaseFocus, agentIds } = req.body;
    const [session] = await db
      .insert(sessions)
      .values({ name, scenarioId, domainId, phaseFocus, status: "pending" })
      .returning();

    if (agentIds && agentIds.length > 0) {
      await db.insert(sessionAgents).values(
        agentIds.map((agentId: number) => ({ sessionId: session.id, agentId }))
      );
    }

    const detail = await getSessionDetail(session.id);
    res.status(201).json(detail);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phaseFocus, status } = req.body;
    const [session] = await db
      .update(sessions)
      .set({ name, phaseFocus, status, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    if (!session) return res.status(404).json({ error: "Not found" });
    res.json(session);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(sessions).where(eq(sessions.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

async function generateRound1ForAgent(
  sessionId: number,
  agentId: number,
  sendEvent: (data: object) => void
) {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
  if (!session || !agent) throw new Error("Session or agent not found");

  let contextDoc = "";
  if (session.scenarioId) {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, session.scenarioId));
    contextDoc = scenario?.contextDocument || "";
  }

  let priorThreats: typeof threats.$inferSelect[] = [];
  if (session.domainId || session.scenarioId) {
    priorThreats = await db
      .select()
      .from(threats)
      .where(
        or(
          session.domainId ? eq(threats.domainId, session.domainId) : undefined,
          session.scenarioId ? eq(threats.scenarioId, session.scenarioId) : undefined
        )
      )
      .limit(10);
  }

  const priorIntelBlock = priorThreats.length > 0
    ? `\nPRIOR INTELLIGENCE — Known threats from the registry relevant to this domain/scenario:\n${priorThreats
        .map((t) => `- [${t.severity}] ${t.name}${t.description ? `: ${t.description}` : ""}`)
        .join("\n")}\n`
    : "";

  const [sa] = await db
    .select()
    .from(sessionAgents)
    .where(and(eq(sessionAgents.sessionId, sessionId), eq(sessionAgents.agentId, agentId)));

  sendEvent({ type: "start", agentId, agentName: agent.name });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are ${agent.name}, ${agent.personaDescription}
Your cognitive bias: ${agent.cognitiveBias}
Your red-team focus: ${agent.redTeamFocus}
${priorIntelBlock}
SCENARIO CONTEXT:
${contextDoc || "No context provided."}

PHASE/FOCUS: ${session.phaseFocus || "General analysis"}

Write a Round 1 independent threat/scenario assessment (600-900 words) covering:
1. Opening position — your primary framing of the situation from your discipline
2. Threat/Finding 1 — with specific mechanism, what defenders/analysts are missing, and severity (CRITICAL/HIGH/MEDIUM) with rationale
3. Threat/Finding 2 — same structure
4. Threat/Finding 3 — same structure
5. Invalidating assumption — one assumption that if wrong would change your entire assessment
6. Key finding — one-sentence bottom line

Write in first person as the expert. Be specific, opinionated, and willing to disagree with conventional wisdom.`,
      },
    ],
  });

  let fullText = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      sendEvent({ type: "chunk", agentId, text: event.delta.text });
    }
  }

  await db
    .update(sessionAgents)
    .set({ round1Assessment: fullText, round1Severity: agent.severityDefault, generatedAt: new Date() })
    .where(and(eq(sessionAgents.sessionId, sessionId), eq(sessionAgents.agentId, agentId)));

  sendEvent({ type: "done", agentId });
  return fullText;
}

router.post("/:id/generate-round1", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const sas = await db.select().from(sessionAgents).where(eq(sessionAgents.sessionId, sessionId));

    await db.update(sessions).set({ status: "round1", updatedAt: new Date() }).where(eq(sessions.id, sessionId));

    for (const sa of sas) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await generateRound1ForAgent(sessionId, sa.agentId, sendEvent);
    }

    sendEvent({ type: "complete" });
    res.end();
  } catch (err) {
    sendEvent({ type: "error", message: String(err) });
    res.end();
  }
});

router.post("/:id/generate-round1/:agentId", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const agentId = parseInt(req.params.agentId);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    await generateRound1ForAgent(sessionId, agentId, sendEvent);
    sendEvent({ type: "complete" });
    res.end();
  } catch (err) {
    sendEvent({ type: "error", message: String(err) });
    res.end();
  }
});

async function generateRound2ForAgent(
  sessionId: number,
  agentId: number,
  sendEvent: (data: object) => void
) {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
  if (!session || !agent) throw new Error("Session or agent not found");

  const allSas = await db.select().from(sessionAgents).where(eq(sessionAgents.sessionId, sessionId));
  const otherAssessments = await Promise.all(
    allSas
      .filter((sa) => sa.agentId !== agentId && sa.round1Assessment)
      .map(async (sa) => {
        const [a] = await db.select().from(agents).where(eq(agents.id, sa.agentId));
        return `## ${a?.name || "Unknown Agent"} (${a?.discipline || "Unknown"})\n${sa.round1Assessment}`;
      })
  );

  let priorThreats: typeof threats.$inferSelect[] = [];
  if (session.domainId || session.scenarioId) {
    priorThreats = await db
      .select()
      .from(threats)
      .where(
        or(
          session.domainId ? eq(threats.domainId, session.domainId) : undefined,
          session.scenarioId ? eq(threats.scenarioId, session.scenarioId) : undefined
        )
      )
      .limit(10);
  }

  const priorIntelBlock = priorThreats.length > 0
    ? `\nPRIOR INTELLIGENCE — Known threats from the registry relevant to this domain/scenario:\n${priorThreats
        .map((t) => `- [${t.severity}] ${t.name}${t.description ? `: ${t.description}` : ""}`)
        .join("\n")}\n`
    : "";

  sendEvent({ type: "start", agentId, agentName: agent.name });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are ${agent.name}, ${agent.personaDescription}
Your cognitive bias: ${agent.cognitiveBias}
${priorIntelBlock}
You have just read all Round 1 assessments from the other experts. Here they are:

${otherAssessments.join("\n\n---\n\n")}

Now write your Round 2 rebuttal (400-600 words) covering:
1. Strongest alliance — which other agent's findings combine most powerfully with yours, and build the compound chain that emerges (name the agent explicitly)
2. Strongest disagreement — which agent you disagree with most and exactly why (name them, reference their specific argument)
3. Whether you've revised your severity rating and why
4. ONE compound chain narrative — a multi-step sequence threading your discipline with at least one other agent's discipline

Be direct. Name names. Quote other agents' arguments when disagreeing. Change your position if another agent persuaded you.`,
      },
    ],
  });

  let fullText = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      sendEvent({ type: "chunk", agentId, text: event.delta.text });
    }
  }

  await db
    .update(sessionAgents)
    .set({ round2Rebuttal: fullText, round2RevisedSeverity: agent.severityDefault, generatedAt: new Date() })
    .where(and(eq(sessionAgents.sessionId, sessionId), eq(sessionAgents.agentId, agentId)));

  sendEvent({ type: "done", agentId });
  return fullText;
}

router.post("/:id/generate-round2", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const sas = await db.select().from(sessionAgents).where(eq(sessionAgents.sessionId, sessionId));

    await db.update(sessions).set({ status: "round2", updatedAt: new Date() }).where(eq(sessions.id, sessionId));

    for (const sa of sas) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await generateRound2ForAgent(sessionId, sa.agentId, sendEvent);
    }

    sendEvent({ type: "complete" });
    res.end();
  } catch (err) {
    sendEvent({ type: "error", message: String(err) });
    res.end();
  }
});

router.post("/:id/generate-round2/:agentId", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const agentId = parseInt(req.params.agentId);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    await generateRound2ForAgent(sessionId, agentId, sendEvent);
    sendEvent({ type: "complete" });
    res.end();
  } catch (err) {
    sendEvent({ type: "error", message: String(err) });
    res.end();
  }
});

router.post("/:id/generate-synthesis", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const detail = await getSessionDetail(sessionId);
    if (!detail) return res.status(404).json({ error: "Not found" });

    const agentSummaries = detail.sessionAgents
      .map((sa) => `${sa.agent?.name}: Round1: ${sa.round1Assessment?.slice(0, 300)}... Round2: ${sa.round2Rebuttal?.slice(0, 300)}...`)
      .join("\n\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are synthesizing a WARROOM multi-agent red-team session.

Session: ${detail.name}
Phase Focus: ${detail.phaseFocus || "General"}

Agent assessments and rebuttals:
${agentSummaries}

Generate a comprehensive synthesis. Return a JSON object:
{
  "consensus_findings": [
    {"finding": "text", "severity": "CRITICAL/HIGH/MEDIUM/LOW", "agents": ["agent names"], "count": N}
  ],
  "contested_findings": [
    {"topic": "text", "position_a": {"agent": "name", "view": "text"}, "position_b": {"agent": "name", "view": "text"}}
  ],
  "compound_chains": [
    {"name": "chain name", "description": "text", "agents": ["names"], "steps": ["step1", "step2"]}
  ],
  "blind_spots": [
    {"area": "text", "description": "text"}
  ],
  "priority_mitigations": [
    {"priority": N, "action": "text", "rationale": "text", "urgency": "immediate/near-term/long-term"}
  ],
  "sharpest_insights": [
    {"quote": "exact quote from agent", "agent": "agent name", "significance": "why this matters"}
  ]
}

Return ONLY the JSON.`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "{}";
    const text = rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const parsed = JSON.parse(text);

    const existing = await db
      .select()
      .from(sessionSynthesis)
      .where(eq(sessionSynthesis.sessionId, sessionId));

    let synthesis;
    if (existing.length > 0) {
      const [updated] = await db
        .update(sessionSynthesis)
        .set({
          consensusFindings: parsed.consensus_findings || [],
          contestedFindings: parsed.contested_findings || [],
          compoundChains: parsed.compound_chains || [],
          blindSpots: parsed.blind_spots || [],
          priorityMitigations: parsed.priority_mitigations || [],
          sharpestInsights: parsed.sharpest_insights || [],
          generatedAt: new Date(),
        })
        .where(eq(sessionSynthesis.sessionId, sessionId))
        .returning();
      synthesis = updated;
    } else {
      const [created] = await db
        .insert(sessionSynthesis)
        .values({
          sessionId,
          consensusFindings: parsed.consensus_findings || [],
          contestedFindings: parsed.contested_findings || [],
          compoundChains: parsed.compound_chains || [],
          blindSpots: parsed.blind_spots || [],
          priorityMitigations: parsed.priority_mitigations || [],
          sharpestInsights: parsed.sharpest_insights || [],
        })
        .returning();
      synthesis = created;
    }

    await db.update(sessions).set({ status: "complete", updatedAt: new Date() }).where(eq(sessions.id, sessionId));

    res.json(synthesis);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate synthesis" });
  }
});

router.post("/:id/reset", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db
      .update(sessionAgents)
      .set({
        round1Assessment: null,
        round1Severity: null,
        round2Rebuttal: null,
        round2RevisedSeverity: null,
        round2StrongestAllyAgentId: null,
        round2StrongestDisagreeAgentId: null,
        compoundChainText: null,
        generatedAt: null,
      })
      .where(eq(sessionAgents.sessionId, id));

    await db.delete(sessionFindings).where(eq(sessionFindings.sessionId, id));
    await db.delete(sessionSynthesis).where(eq(sessionSynthesis.sessionId, id));

    await db
      .update(sessions)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(sessions.id, id));

    const detail = await getSessionDetail(id);
    if (!detail) return res.status(404).json({ error: "Not found" });
    res.json(detail);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reset session" });
  }
});

router.post("/:id/save-chain", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const { chainText, chainName, agentIds } = req.body;
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return res.status(404).json({ error: "Not found" });

    const [chain] = await db
      .insert(chains)
      .values({
        name: chainName,
        description: chainText.slice(0, 200),
        domainId: session.domainId,
        scenarioId: session.scenarioId,
        isAiGenerated: true,
        tags: ["session-derived", "compound-chain"],
      })
      .returning();

    const sentences = chainText.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
    if (sentences.length > 0) {
      await db.insert(chainSteps).values(
        sentences.slice(0, 8).map((s: string, i: number) => ({
          chainId: chain.id,
          stepNumber: i + 1,
          agentLabel: agentIds?.[i] ? `Agent ${agentIds[i]}` : `Step ${i + 1}`,
          stepText: s.trim(),
        }))
      );
    }

    const result = { ...chain, steps: [] };
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save chain" });
  }
});

export default router;
