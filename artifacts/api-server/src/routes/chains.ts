import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chains, chainSteps, agents } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function getChainWithSteps(chainId: number) {
  const [chain] = await db.select().from(chains).where(eq(chains.id, chainId));
  if (!chain) return null;
  const steps = await db
    .select()
    .from(chainSteps)
    .where(eq(chainSteps.chainId, chainId))
    .orderBy(chainSteps.stepNumber);
  return { ...chain, steps };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(chains).orderBy(chains.name);
    let result = all;
    if (req.query.domainId) {
      result = result.filter((c) => c.domainId === parseInt(req.query.domainId as string));
    }
    if (req.query.scenarioId) {
      result = result.filter((c) => c.scenarioId === parseInt(req.query.scenarioId as string));
    }

    const withSteps = await Promise.all(
      result.map(async (c) => {
        const steps = await db
          .select()
          .from(chainSteps)
          .where(eq(chainSteps.chainId, c.id))
          .orderBy(chainSteps.stepNumber);
        return { ...c, steps };
      })
    );
    res.json(withSteps);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get chains" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const chain = await getChainWithSteps(id);
    if (!chain) return res.status(404).json({ error: "Not found" });
    res.json(chain);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get chain" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, domainId, scenarioId, threatId, isAiGenerated, tags, steps } = req.body;
    const [chain] = await db
      .insert(chains)
      .values({ name, description, domainId, scenarioId, threatId, isAiGenerated: isAiGenerated || false, tags: tags || [] })
      .returning();

    if (steps && steps.length > 0) {
      await db.insert(chainSteps).values(
        steps.map((s: { stepNumber: number; agentLabel?: string; stepText: string; agentId?: number }) => ({
          chainId: chain.id,
          stepNumber: s.stepNumber,
          agentLabel: s.agentLabel,
          stepText: s.stepText,
          agentId: s.agentId || null,
        }))
      );
    }

    const result = await getChainWithSteps(chain.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create chain" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { scenarioId, scenarioContext, agentIds, chainType, numSteps, focusArea, domainId } = req.body;

    let agentListText = "";
    if (agentIds && agentIds.length > 0) {
      const agentList = await Promise.all(
        agentIds.map(async (id: number) => {
          const [a] = await db.select().from(agents).where(eq(agents.id, id));
          return a;
        })
      );
      agentListText = agentList
        .filter(Boolean)
        .map((a) => `- ${a.name} (${a.discipline}): ${a.personaDescription?.slice(0, 100)}`)
        .join("\n");
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are generating a compound scenario chain for the WARROOM strategic analysis system.

A chain is a multi-step sequence showing how a scenario, threat, or adversary operation unfolds across multiple disciplines. Each step is attributed to one or more expert disciplines and describes what happens in that stage.

Scenario Context:
${scenarioContext || "Not provided"}

Available Agents and their disciplines:
${agentListText || "Any discipline"}

Chain Type: ${chainType}
Focus Area: ${focusArea || "General"}
Number of Steps: ${numSteps}

Generate a compound chain with ${numSteps} steps. Return a JSON object:
{
  "name": "Evocative chain name in quotes — e.g. 'The Long Game' or 'Price Cascade'",
  "description": "2-3 sentence summary of what this chain represents",
  "steps": [
    {
      "step_number": 1,
      "agent_label": "Agent name or discipline label",
      "step_text": "Clear description of what happens in this step and why it matters"
    }
  ]
}

Make the chain operationally coherent — each step should flow logically from the previous. The chain should represent something that no single discipline would identify alone. Return ONLY the JSON.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);

    const [chain] = await db
      .insert(chains)
      .values({
        name: parsed.name,
        description: parsed.description,
        domainId: domainId || null,
        scenarioId: scenarioId || null,
        isAiGenerated: true,
        tags: ["ai-generated"],
      })
      .returning();

    if (parsed.steps && parsed.steps.length > 0) {
      await db.insert(chainSteps).values(
        parsed.steps.map((s: { step_number: number; agent_label: string; step_text: string }) => ({
          chainId: chain.id,
          stepNumber: s.step_number,
          agentLabel: s.agent_label,
          stepText: s.step_text,
        }))
      );
    }

    const result = await getChainWithSteps(chain.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate chain" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, domainId, scenarioId, threatId, isAiGenerated, tags, steps } = req.body;
    const [chain] = await db
      .update(chains)
      .set({ name, description, domainId, scenarioId, threatId, isAiGenerated, tags, updatedAt: new Date() })
      .where(eq(chains.id, id))
      .returning();
    if (!chain) return res.status(404).json({ error: "Not found" });

    if (steps !== undefined) {
      await db.delete(chainSteps).where(eq(chainSteps.chainId, id));
      if (steps.length > 0) {
        await db.insert(chainSteps).values(
          steps.map((s: { stepNumber: number; agentLabel?: string; stepText: string; agentId?: number }) => ({
            chainId: id,
            stepNumber: s.stepNumber,
            agentLabel: s.agentLabel,
            stepText: s.stepText,
            agentId: s.agentId || null,
          }))
        );
      }
    }

    const result = await getChainWithSteps(id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update chain" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(chains).where(eq(chains.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete chain" });
  }
});

export default router;
