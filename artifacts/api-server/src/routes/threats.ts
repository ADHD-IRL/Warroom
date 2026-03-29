import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { threats } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(threats).orderBy(threats.name);
    let result = all;
    if (req.query.domainId) {
      result = result.filter((t) => t.domainId === parseInt(req.query.domainId as string));
    }
    if (req.query.severity) {
      result = result.filter((t) => t.severity === req.query.severity);
    }
    if (req.query.scenarioId) {
      result = result.filter((t) => t.scenarioId === parseInt(req.query.scenarioId as string));
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get threats" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, domainId, scenarioId, severity, category, tags } = req.body;
    const [threat] = await db
      .insert(threats)
      .values({ name, description, domainId, scenarioId, severity, category, tags: tags || [] })
      .returning();
    res.status(201).json(threat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create threat" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { context, scenarioId } = req.body;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are a threat intelligence analyst for the WARROOM strategic analysis system.

Based on the following scenario context, generate 7-10 specific, actionable threats:

${context}

Return a JSON array of threats:
[
  {
    "name": "Concise threat name",
    "description": "2-3 sentence description of the threat mechanism and impact",
    "severity": "CRITICAL" or "HIGH" or "MEDIUM" or "LOW",
    "category": "short category label (e.g. Supply Chain, Cyber, Insider, Physical, Influence)"
  }
]

Make threats specific to this scenario. Focus on realistic, non-obvious threats that analysts might miss. Return ONLY the JSON array.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const parsed = JSON.parse(text.trim());

    const result = parsed.map((t: {
      name: string;
      description: string;
      severity: string;
      category: string;
    }) => ({
      ...t,
      scenarioId: scenarioId || null,
      tags: [],
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate threats" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, domainId, scenarioId, severity, category, tags } = req.body;
    const [threat] = await db
      .update(threats)
      .set({ name, description, domainId, scenarioId, severity, category, tags, updatedAt: new Date() })
      .where(eq(threats.id, id))
      .returning();
    if (!threat) return res.status(404).json({ error: "Not found" });
    res.json(threat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update threat" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(threats).where(eq(threats.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete threat" });
  }
});

export default router;
