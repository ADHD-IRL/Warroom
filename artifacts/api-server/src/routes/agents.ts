import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agents } from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(agents).orderBy(agents.name);
    let result = all;
    if (req.query.domainId) {
      result = result.filter((a) => a.domainId === parseInt(req.query.domainId as string));
    }
    if (req.query.search) {
      const s = (req.query.search as string).toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.discipline.toLowerCase().includes(s)
      );
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get agents" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!agent) return res.status(404).json({ error: "Not found" });
    res.json(agent);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get agent" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name, discipline, domainId, personaDescription, cognitiveBias,
      redTeamFocus, severityDefault, vectorHuman, vectorTechnical,
      vectorPhysical, vectorFutures, isAiGenerated, tags,
    } = req.body;
    const [agent] = await db
      .insert(agents)
      .values({
        name, discipline, domainId, personaDescription, cognitiveBias,
        redTeamFocus, severityDefault: severityDefault || "HIGH",
        vectorHuman: vectorHuman ?? 50, vectorTechnical: vectorTechnical ?? 50,
        vectorPhysical: vectorPhysical ?? 50, vectorFutures: vectorFutures ?? 50,
        isAiGenerated: isAiGenerated || false, tags: tags || [],
      })
      .returning();
    res.status(201).json(agent);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create agent" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { expert_type, domain, domain_id, prior_background, key_focus_area, known_bias } = req.body;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are building an expert agent profile for the WARROOM strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${expert_type}
Domain: ${domain}
Prior background hints: ${prior_background || "None provided"}
Key focus area: ${key_focus_area || "None provided"}
Known bias toward: ${known_bias || "None provided"}

Return a JSON object with exactly these fields:
{
  "name": "short descriptive name (e.g. 'Maritime & Naval Expert')",
  "discipline": "2-4 word discipline label",
  "persona_description": "3-4 sentence description of who this expert is, how they think, what they have seen in their career, what they prioritize above all else",
  "cognitive_bias": "1-2 sentences describing what this expert systematically underweights or misses due to their discipline focus",
  "red_team_focus": "2-3 sentences on what specifically this agent hunts for when analyzing any scenario or threat",
  "severity_default": "CRITICAL or HIGH or MEDIUM",
  "vector_human": integer 0-100,
  "vector_technical": integer 0-100,
  "vector_physical": integer 0-100,
  "vector_futures": integer 0-100,
  "tags": ["array", "of", "3-5", "relevant", "tags"]
}

Return ONLY the JSON object. No preamble, no explanation.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const parsed = JSON.parse(text.trim());

    res.json({
      name: parsed.name,
      discipline: parsed.discipline,
      domainId: domain_id || null,
      personaDescription: parsed.persona_description,
      cognitiveBias: parsed.cognitive_bias,
      redTeamFocus: parsed.red_team_focus,
      severityDefault: parsed.severity_default || "HIGH",
      vectorHuman: parsed.vector_human ?? 50,
      vectorTechnical: parsed.vector_technical ?? 50,
      vectorPhysical: parsed.vector_physical ?? 50,
      vectorFutures: parsed.vector_futures ?? 50,
      isAiGenerated: true,
      tags: parsed.tags || [],
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate agent" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name, discipline, domainId, personaDescription, cognitiveBias,
      redTeamFocus, severityDefault, vectorHuman, vectorTechnical,
      vectorPhysical, vectorFutures, isAiGenerated, tags,
    } = req.body;
    const [agent] = await db
      .update(agents)
      .set({
        name, discipline, domainId, personaDescription, cognitiveBias,
        redTeamFocus, severityDefault, vectorHuman, vectorTechnical,
        vectorPhysical, vectorFutures, isAiGenerated, tags,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id))
      .returning();
    if (!agent) return res.status(404).json({ error: "Not found" });
    res.json(agent);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update agent" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(agents).where(eq(agents.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

export default router;
