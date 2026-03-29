import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#2E75B6"),
  icon: text("icon").default("globe"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  domainId: integer("domain_id").references(() => domains.id),
  contextDocument: text("context_document"),
  status: text("status").notNull().default("draft"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;

export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  domainId: integer("domain_id").references(() => domains.id),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  severity: text("severity").notNull().default("MEDIUM"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertThreatSchema = createInsertSchema(threats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type Threat = typeof threats.$inferSelect;

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  discipline: text("discipline").notNull(),
  domainId: integer("domain_id").references(() => domains.id),
  personaDescription: text("persona_description"),
  cognitiveBias: text("cognitive_bias"),
  redTeamFocus: text("red_team_focus"),
  severityDefault: text("severity_default").notNull().default("HIGH"),
  vectorHuman: integer("vector_human").default(50),
  vectorTechnical: integer("vector_technical").default(50),
  vectorPhysical: integer("vector_physical").default(50),
  vectorFutures: integer("vector_futures").default(50),
  isAiGenerated: boolean("is_ai_generated").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export const chains = pgTable("chains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  domainId: integer("domain_id").references(() => domains.id),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  threatId: integer("threat_id").references(() => threats.id),
  isAiGenerated: boolean("is_ai_generated").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChainSchema = createInsertSchema(chains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChain = z.infer<typeof insertChainSchema>;
export type Chain = typeof chains.$inferSelect;

export const chainSteps = pgTable("chain_steps", {
  id: serial("id").primaryKey(),
  chainId: integer("chain_id")
    .notNull()
    .references(() => chains.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").references(() => agents.id),
  stepNumber: integer("step_number").notNull(),
  agentLabel: text("agent_label"),
  stepText: text("step_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChainStepSchema = createInsertSchema(chainSteps).omit({
  id: true,
  createdAt: true,
});
export type InsertChainStep = z.infer<typeof insertChainStepSchema>;
export type ChainStep = typeof chainSteps.$inferSelect;

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  domainId: integer("domain_id").references(() => domains.id),
  status: text("status").notNull().default("pending"),
  phaseFocus: text("phase_focus"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const sessionAgents = pgTable("session_agents", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  agentId: integer("agent_id")
    .notNull()
    .references(() => agents.id),
  round1Assessment: text("round1_assessment"),
  round1Severity: text("round1_severity"),
  round2Rebuttal: text("round2_rebuttal"),
  round2RevisedSeverity: text("round2_revised_severity"),
  round2StrongestAllyAgentId: integer("round2_strongest_ally_agent_id").references(
    () => agents.id
  ),
  round2StrongestDisagreeAgentId: integer(
    "round2_strongest_disagree_agent_id"
  ).references(() => agents.id),
  compoundChainText: text("compound_chain_text"),
  generatedAt: timestamp("generated_at"),
});

export const insertSessionAgentSchema = createInsertSchema(sessionAgents).omit({
  id: true,
  generatedAt: true,
});
export type InsertSessionAgent = z.infer<typeof insertSessionAgentSchema>;
export type SessionAgent = typeof sessionAgents.$inferSelect;

export const sessionFindings = pgTable("session_findings", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  findingCode: text("finding_code"),
  severity: text("severity").notNull(),
  findingText: text("finding_text").notNull(),
  agentConsensusCount: integer("agent_consensus_count").default(1),
  isNew: boolean("is_new").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionFindingSchema = createInsertSchema(
  sessionFindings
).omit({ id: true, createdAt: true });
export type InsertSessionFinding = z.infer<typeof insertSessionFindingSchema>;
export type SessionFinding = typeof sessionFindings.$inferSelect;

export const sessionSynthesis = pgTable("session_synthesis", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  consensusFindings: jsonb("consensus_findings").$type<object[]>().default([]),
  contestedFindings: jsonb("contested_findings").$type<object[]>().default([]),
  compoundChains: jsonb("compound_chains").$type<object[]>().default([]),
  blindSpots: jsonb("blind_spots").$type<object[]>().default([]),
  priorityMitigations: jsonb("priority_mitigations").$type<object[]>().default([]),
  sharpestInsights: jsonb("sharpest_insights").$type<object[]>().default([]),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const insertSessionSynthesisSchema = createInsertSchema(
  sessionSynthesis
).omit({ id: true, generatedAt: true });
export type InsertSessionSynthesis = z.infer<
  typeof insertSessionSynthesisSchema
>;
export type SessionSynthesis = typeof sessionSynthesis.$inferSelect;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id),
  title: text("title").notNull(),
  sections: jsonb("sections").$type<string[]>().default([]),
  content: text("content"),
  format: text("format").default("markdown"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
