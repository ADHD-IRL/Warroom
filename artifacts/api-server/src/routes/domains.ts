import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  domains,
  agents,
  scenarios,
  chains,
  sessions,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const allDomains = await db.select().from(domains).orderBy(domains.name);

    const result = await Promise.all(
      allDomains.map(async (d) => {
        const [agentCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(agents)
          .where(eq(agents.domainId, d.id));
        const [scenarioCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(scenarios)
          .where(eq(scenarios.domainId, d.id));
        const [chainCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(chains)
          .where(eq(chains.domainId, d.id));
        const [sessionCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(sessions)
          .where(eq(sessions.domainId, d.id));
        return {
          ...d,
          agentCount: agentCount?.count ?? 0,
          scenarioCount: scenarioCount?.count ?? 0,
          chainCount: chainCount?.count ?? 0,
          sessionCount: sessionCount?.count ?? 0,
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get domains" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    if (!domain) return res.status(404).json({ error: "Not found" });
    res.json(domain);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get domain" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const [domain] = await db
      .insert(domains)
      .values({ name, description, color: color || "#2E75B6", icon })
      .returning();
    res.status(201).json(domain);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create domain" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, color, icon } = req.body;
    const [domain] = await db
      .update(domains)
      .set({ name, description, color, icon, updatedAt: new Date() })
      .where(eq(domains.id, id))
      .returning();
    if (!domain) return res.status(404).json({ error: "Not found" });
    res.json(domain);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update domain" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(domains).where(eq(domains.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete domain" });
  }
});

export default router;
