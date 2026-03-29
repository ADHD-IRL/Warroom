import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  agents,
  sessions,
  chains,
  scenarios,
  domains,
  sessionAgents,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const [{ count: totalAgents }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents);

    const [{ count: totalSessions }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions);

    const allSessions = await db.select().from(sessions);
    const activeSessions = allSessions.filter(
      (s) => s.status === "round1" || s.status === "round2"
    ).length;

    const [{ count: totalChains }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chains);

    const [{ count: totalScenarios }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scenarios);

    const [{ count: totalDomains }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(domains);

    const allDomains = await db.select().from(domains);
    const agentsByDomain = await Promise.all(
      allDomains.map(async (d) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(agents)
          .where(eq(agents.domainId, d.id));
        return { domainId: d.id, domainName: d.name, color: d.color, count };
      })
    );

    const recentSessions = await db
      .select()
      .from(sessions)
      .orderBy(sessions.createdAt)
      .limit(5);

    const recentWithCounts = await Promise.all(
      recentSessions.reverse().map(async (s) => {
        const sas = await db
          .select()
          .from(sessionAgents)
          .where(eq(sessionAgents.sessionId, s.id));
        return { ...s, agentCount: sas.length };
      })
    );

    res.json({
      totalAgents,
      totalSessions,
      activeSessions,
      totalChains,
      totalScenarios,
      totalDomains,
      agentsByDomain,
      recentSessions: recentWithCounts,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
