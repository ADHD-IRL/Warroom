import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scenarios } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

router.get("/", async (req, res) => {
  try {
    let query = db.select().from(scenarios);
    const all = await query.orderBy(scenarios.name);
    let result = all;
    if (req.query.domainId) {
      result = all.filter((s) => s.domainId === parseInt(req.query.domainId as string));
    }
    if (req.query.status) {
      result = result.filter((s) => s.status === req.query.status);
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get scenarios" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    if (!scenario) return res.status(404).json({ error: "Not found" });
    res.json(scenario);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get scenario" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, domainId, contextDocument, status, tags } = req.body;
    const [scenario] = await db
      .insert(scenarios)
      .values({
        name,
        description,
        domainId,
        contextDocument,
        status: status || "draft",
        tags: tags || [],
      })
      .returning();
    res.status(201).json(scenario);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create scenario" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, domainId, contextDocument, status, tags } = req.body;
    const [scenario] = await db
      .update(scenarios)
      .set({ name, description, domainId, contextDocument, status, tags, updatedAt: new Date() })
      .where(eq(scenarios.id, id))
      .returning();
    if (!scenario) return res.status(404).json({ error: "Not found" });
    res.json(scenario);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update scenario" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(scenarios).where(eq(scenarios.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete scenario" });
  }
});

router.post("/generate-context", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are drafting a strategic scenario context document for the WARROOM red-team analysis platform.

Scenario title: ${name}
${description ? `Brief description: ${description}` : ""}

Write a detailed, professional intelligence-briefing-style context document for this scenario. Structure it with these sections:

## Situation Overview
## Key Actors & Stakeholders
## Timeline & Current Status
## Critical Decision Points
## Known Vulnerabilities & Risk Factors
## Operational Context

Be specific, analytical, and useful for red-team analysis. Write in the present tense. Return ONLY the context document — no preamble, no commentary.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const contextDocument = raw.trim().replace(/^```(?:markdown|text)?\s*/i, "").replace(/\s*```$/, "");
    res.json({ contextDocument });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate context" });
  }
});

router.post("/:id/ai-assist", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    if (!scenario) return res.status(404).json({ error: "Not found" });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are improving a strategic scenario context document for the WARROOM analysis platform.
          
Current context document:
${scenario.contextDocument || "(empty)"}

Scenario name: ${scenario.name}

Improve and expand this context document to be more comprehensive, specific, and useful for red-team analysis. Include:
1. Situation overview
2. Key actors and stakeholders  
3. Timeline and current status
4. Critical decision points
5. Known vulnerabilities and risk factors
6. Relevant geopolitical, technical, or operational context

Write in a professional intelligence briefing style. Keep it factual and analytical. Return ONLY the improved context document text, no preamble.`,
        },
      ],
    });

    const improved = message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ context_document: improved });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate AI assist" });
  }
});

export default router;
