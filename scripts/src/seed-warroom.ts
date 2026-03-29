import { db } from "@workspace/db";
import {
  domains,
  agents,
  scenarios,
  chains,
  chainSteps,
} from "@workspace/db/schema";

async function seed() {
  console.log("Seeding WARROOM database...");

  // Domains
  const [defenseAcq] = await db
    .insert(domains)
    .values({
      name: "Defense Acquisition",
      description: "Hardware, software, and supply chain vulnerabilities in defense procurement programs.",
      color: "#2E75B6",
      icon: "shield",
    })
    .onConflictDoNothing()
    .returning();

  const [energy] = await db
    .insert(domains)
    .values({
      name: "Energy & Infrastructure",
      description: "Critical energy infrastructure, supply disruptions, and geopolitical energy leverage.",
      color: "#F0A500",
      icon: "zap",
    })
    .onConflictDoNothing()
    .returning();

  const [geopolitics] = await db
    .insert(domains)
    .values({
      name: "Geopolitics & Economics",
      description: "State-level strategic competition, economic coercion, and influence operations.",
      color: "#27AE60",
      icon: "globe",
    })
    .onConflictDoNothing()
    .returning();

  if (!defenseAcq || !energy || !geopolitics) {
    console.log("Domains already exist, skipping seed.");
    return;
  }

  console.log("Domains created.");

  // Defense Acquisition Agents
  const defenseAgents = await db
    .insert(agents)
    .values([
      {
        name: "CI / HUMINT Officer",
        discipline: "Counterintelligence",
        domainId: defenseAcq.id,
        personaDescription: "A career counterintelligence officer with 20 years tracking foreign intelligence operations targeting US defense programs. I've seen how adversaries recruit insiders, exploit academic partnerships, and use front companies to penetrate supply chains. I prioritize the human angle above all else.",
        cognitiveBias: "I tend to over-index on foreign intelligence collection as the primary threat vector, sometimes underweighting purely technical or systemic vulnerabilities that don't have a clear human orchestrator.",
        redTeamFocus: "I hunt for indicators of foreign intelligence penetration: anomalous access patterns, unexpected foreign relationships, travel to adversary countries, and unusual financial transactions among cleared personnel.",
        severityDefault: "CRITICAL",
        vectorHuman: 95,
        vectorTechnical: 45,
        vectorPhysical: 35,
        vectorFutures: 50,
        tags: ["intelligence", "HUMINT", "insider-threat"],
      },
      {
        name: "Offensive Cyber Operator",
        discipline: "Cyber / CNO",
        domainId: defenseAcq.id,
        personaDescription: "Former NSA TAO operator now working on red team assessments for defense contractors. I think like an adversary — nation-state level. I've built implants, exfiltrated data, and understand exactly how modern networks are compromised from the inside.",
        cognitiveBias: "I sometimes underweight physical and human vectors because I spend most of my time in the technical realm. I also tend to assume adversaries are more technically sophisticated than they sometimes need to be.",
        redTeamFocus: "I'm hunting for software supply chain compromises, firmware implants, trusted update mechanisms that can be weaponized, and engineering workstation vulnerabilities in air-gapped environments.",
        severityDefault: "CRITICAL",
        vectorHuman: 30,
        vectorTechnical: 98,
        vectorPhysical: 40,
        vectorFutures: 65,
        tags: ["cyber", "CNO", "NSA", "red-team"],
      },
      {
        name: "Supply Chain Analyst",
        discipline: "HW/SW Supply Chain",
        domainId: defenseAcq.id,
        personaDescription: "A supply chain security specialist who has spent 15 years mapping semiconductor and electronic component supply chains. I understand exactly where counterfeits enter the system, which Tier-2 and Tier-3 suppliers are invisible to primes, and how adversaries use legitimate commercial channels.",
        cognitiveBias: "I can get lost in the complexity of supply chain mapping and sometimes fail to prioritize which vulnerabilities are actually exploitable versus theoretically concerning. I also underweight the insider threat dimension.",
        redTeamFocus: "I'm looking for single-source dependencies on adversary-controlled manufacturers, counterfeit component insertion points, software bill of materials gaps, and undisclosed subcontractor relationships.",
        severityDefault: "HIGH",
        vectorHuman: 45,
        vectorTechnical: 80,
        vectorPhysical: 60,
        vectorFutures: 55,
        tags: ["supply-chain", "hardware", "semiconductors"],
      },
      {
        name: "Insider Threat Investigator",
        discipline: "Personnel Security",
        domainId: defenseAcq.id,
        personaDescription: "A former DIA investigator with 18 years conducting personnel security investigations and insider threat program management. I've seen the full spectrum — from ideological spies to financially motivated leakers to accidental insiders who didn't know they were being used.",
        cognitiveBias: "I sometimes focus too heavily on individual actors and miss systemic organizational failures that enable insider threats. I also underweight the technical mechanisms adversaries use to facilitate insider operations.",
        redTeamFocus: "I'm looking for personnel who have financial stress, foreign contacts, ideological grievances, or access beyond their need-to-know. I also hunt for policy gaps that make insider exfiltration easy.",
        severityDefault: "HIGH",
        vectorHuman: 98,
        vectorTechnical: 30,
        vectorPhysical: 55,
        vectorFutures: 40,
        tags: ["insider-threat", "personnel", "investigation"],
      },
      {
        name: "Physical Security / TSCM",
        discipline: "Physical Security",
        domainId: defenseAcq.id,
        personaDescription: "A Technical Surveillance Countermeasures expert with 22 years conducting TSCM sweeps and physical penetration testing at cleared defense facilities. I think about everything that happens in three-dimensional space — what can be seen, heard, photographed, or accessed physically.",
        cognitiveBias: "I sometimes underweight cyber and supply chain vectors because my entire career has been focused on physical space. I also tend to assume physical controls are more robust than they actually are.",
        redTeamFocus: "I'm looking for weak perimeter controls, visitor escort failures, uncontrolled photography opportunities, RF emanation vulnerabilities, and classified conversations in insecure spaces.",
        severityDefault: "MEDIUM",
        vectorHuman: 60,
        vectorTechnical: 50,
        vectorPhysical: 98,
        vectorFutures: 30,
        tags: ["physical-security", "TSCM", "facility"],
      },
      {
        name: "IO / Influence Operations",
        discipline: "Information Operations",
        domainId: defenseAcq.id,
        personaDescription: "A former PSYOP officer and now private sector influence operations analyst. I understand how adversaries shape narratives, manipulate decision-makers, and use information warfare to achieve strategic objectives without firing a shot.",
        cognitiveBias: "I can over-attribute normal events to coordinated influence operations when they might just be organic. I also sometimes underweight the technical and physical vectors that enable information operations.",
        redTeamFocus: "I'm hunting for narrative injection points, key decision-maker targeting through social media and academic channels, deceptive industry relationships, and disinformation designed to drive poor procurement decisions.",
        severityDefault: "HIGH",
        vectorHuman: 85,
        vectorTechnical: 55,
        vectorPhysical: 20,
        vectorFutures: 80,
        tags: ["IO", "influence", "PSYOP", "disinformation"],
      },
      {
        name: "Futures / Foresight Analyst",
        discipline: "Strategic Foresight",
        domainId: defenseAcq.id,
        personaDescription: "A strategic foresight specialist who has spent a decade gaming out second and third-order effects of technology decisions. I think 10-20 years out and I'm obsessed with the capabilities adversaries are developing today that will matter when today's acquisition programs reach full operational capability.",
        cognitiveBias: "I sometimes prioritize long-horizon threats over near-term vulnerabilities that are actually exploitable right now. Decision-makers often dismiss my analysis as too speculative.",
        redTeamFocus: "I'm looking for embedded vulnerabilities designed to be activated in a future conflict, technology dependencies that will create leverage for adversaries in 2030-2040, and acquisition decisions that lock in structural vulnerabilities.",
        severityDefault: "HIGH",
        vectorHuman: 45,
        vectorTechnical: 70,
        vectorPhysical: 30,
        vectorFutures: 98,
        tags: ["foresight", "futures", "long-range", "strategic"],
      },
      {
        name: "Behavioral Science SME",
        discipline: "Cognitive Psychology",
        domainId: defenseAcq.id,
        personaDescription: "A behavioral scientist who has spent 15 years studying how decision-makers in high-stakes environments are systematically manipulated. I understand cognitive biases, social engineering, and how adversaries engineer environments to make targets make predictable mistakes.",
        cognitiveBias: "I sometimes focus so heavily on individual cognitive vulnerabilities that I miss systemic organizational and technical failures. I also struggle to translate behavioral insights into concrete security recommendations.",
        redTeamFocus: "I'm hunting for decision-maker vulnerabilities: who can be pressured, who has ego-driven blind spots, which program managers are too invested in their programs to see warning signs, and how adversaries engineer social contexts to extract information.",
        severityDefault: "HIGH",
        vectorHuman: 98,
        vectorTechnical: 25,
        vectorPhysical: 20,
        vectorFutures: 70,
        tags: ["behavioral", "psychology", "social-engineering", "cognitive-bias"],
      },
    ])
    .returning();

  console.log(`Created ${defenseAgents.length} Defense Acquisition agents.`);

  // Energy & Infrastructure Agents
  const energyAgents = await db
    .insert(agents)
    .values([
      {
        name: "Energy Markets Analyst",
        discipline: "Supply / Price Dynamics",
        domainId: energy.id,
        personaDescription: "A commodity market specialist with 20 years tracking oil, gas, and LNG markets. I understand how supply disruptions cascade through global energy markets, who the price-setters are, and how geopolitical actors manipulate energy prices for strategic effect.",
        cognitiveBias: "I tend to frame everything through market mechanisms and sometimes underweight the physical and geopolitical dimensions that don't show up cleanly in price signals.",
        redTeamFocus: "I'm hunting for price manipulation schemes, strategic reserve drawdown vulnerabilities, long-term contract vulnerabilities that lock in dependencies, and financial instruments that create market instability.",
        severityDefault: "HIGH",
        vectorHuman: 40,
        vectorTechnical: 50,
        vectorPhysical: 60,
        vectorFutures: 75,
        tags: ["energy-markets", "commodities", "LNG", "oil"],
      },
      {
        name: "Geopolitical Strategist",
        discipline: "Regime Calculus / Negotiation",
        domainId: energy.id,
        personaDescription: "A former State Department strategist who has spent 25 years analyzing how authoritarian regimes make decisions. I understand how Tehran, Beijing, and Moscow think — their red lines, their leverage points, their domestic constraints.",
        cognitiveBias: "I sometimes assume rational actor behavior from regimes that are actually driven by domestic political survival. I also underweight technical and economic factors in my analysis.",
        redTeamFocus: "I'm hunting for regime decision points where escalation is likely, misunderstandings about US resolve that could trigger military action, and diplomatic signals that are being misread by policymakers.",
        severityDefault: "CRITICAL",
        vectorHuman: 80,
        vectorTechnical: 30,
        vectorPhysical: 55,
        vectorFutures: 85,
        tags: ["geopolitics", "regime", "diplomacy", "Iran", "China"],
      },
      {
        name: "Maritime & Naval Expert",
        discipline: "Shipping / Mine Clearance",
        domainId: energy.id,
        personaDescription: "A retired Navy captain with 30 years of experience in maritime operations including mine warfare and strait transits. I've commanded vessels through contested waterways and understand exactly what a determined adversary could do to shut down maritime commerce.",
        cognitiveBias: "I sometimes underestimate how quickly commercial shipping companies will reroute or halt operations under far lower threat levels than what it would take to actually close a strait militarily.",
        redTeamFocus: "I'm hunting for naval chokepoints, mine laying scenarios, tanker vulnerabilities, port infrastructure weaknesses, and the cascade effects of even partial shipping disruptions.",
        severityDefault: "CRITICAL",
        vectorHuman: 40,
        vectorTechnical: 65,
        vectorPhysical: 95,
        vectorFutures: 50,
        tags: ["maritime", "naval", "shipping", "Hormuz", "mine-warfare"],
      },
      {
        name: "LNG / Gas Specialist",
        discipline: "Natural Gas / Asia Power",
        domainId: energy.id,
        personaDescription: "An LNG market specialist with 18 years analyzing liquefied natural gas markets, infrastructure, and geopolitics. I understand the global LNG trade system in fine detail — who needs what, who has surplus, and where the single points of failure are.",
        cognitiveBias: "I sometimes get too deep into the technical and commercial details of LNG trade and miss the broader geopolitical context that determines whether markets can actually function.",
        redTeamFocus: "I'm hunting for LNG supply chain vulnerabilities, regasification terminal single points of failure, long-term contract exposure, and Asian market dynamics that create leverage for adversaries.",
        severityDefault: "HIGH",
        vectorHuman: 35,
        vectorTechnical: 70,
        vectorPhysical: 65,
        vectorFutures: 80,
        tags: ["LNG", "natural-gas", "Asia", "infrastructure"],
      },
      {
        name: "Macro Economist",
        discipline: "Stagflation / Central Banks",
        domainId: energy.id,
        personaDescription: "A macroeconomist who specializes in energy price shocks and their systemic economic effects. I've modeled every major energy crisis since 1973 and I know exactly how supply disruptions translate into inflation, recession, and political instability.",
        cognitiveBias: "I tend to model economic effects assuming governments and central banks will respond rationally. Political constraints on policy responses often invalidate my models.",
        redTeamFocus: "I'm hunting for economic cascade effects: how energy price spikes translate to food price inflation, how central bank responses create secondary crises, and which economies are most vulnerable to energy-driven stagflation.",
        severityDefault: "HIGH",
        vectorHuman: 35,
        vectorTechnical: 45,
        vectorPhysical: 40,
        vectorFutures: 90,
        tags: ["macroeconomics", "stagflation", "inflation", "central-banks"],
      },
    ])
    .returning();

  console.log(`Created ${energyAgents.length} Energy agents.`);

  // Scenarios
  const [designPhaseScenario] = await db
    .insert(scenarios)
    .values({
      name: "Design Phase — Hardware Component Selection",
      description: "A major defense program in the design phase is selecting hardware components from a complex global supply chain. Multiple foreign-manufactured components are under consideration due to cost and performance advantages.",
      domainId: defenseAcq.id,
      contextDocument: `PROGRAM BRIEFING: ADVANCED RADAR SYSTEM — DESIGN PHASE

PROGRAM OVERVIEW:
The Integrated Air Defense Radar (IADR) program is a next-generation active electronically scanned array (AESA) radar system intended for deployment across three major platform types: destroyers, land-based air defense batteries, and fifth-generation aircraft. The program is currently in the System Design and Development (SDD) phase with an estimated production run of 400+ units and a program value of $12.8B over 15 years.

CURRENT DECISION POINT:
Program managers are evaluating hardware component selections across three critical subsystems:

1. GALLIUM NITRIDE (GaN) POWER AMPLIFIERS
   - Prime contractor Raytheon Technologies is considering Tier-2 suppliers from Taiwan (WIN Semiconductors), South Korea (Wolfspeed Korea), and a newly qualified US facility (Wolfspeed NC — not yet at full production scale).
   - Taiwan option is 40% cheaper and available immediately. US option has 14-month lead time and unproven yield rates.

2. FIELD-PROGRAMMABLE GATE ARRAYS (FPGAs)
   - Three finalists: Xilinx (now AMD) US-manufactured, Intel Altera (Malaysia assembly), and a Chinese-owned subsidiary with US offices (recently acquired by a Beijing-backed PE fund).
   - The Chinese subsidiary's FPGA has superior performance characteristics and is 35% cheaper.
   - The acquisition was completed 8 months ago and has not yet been reviewed by CFIUS.

3. RARE EARTH ELEMENT PERMANENT MAGNETS
   - Used in cooling systems and antenna positioning motors. China produces 85% of global supply of processed rare earth magnets.
   - No qualified US alternative exists at the required specifications. UK-based MP Materials is 18 months from qualifying their product.
   - Program schedule pressure is significant — any delay risks a Nunn-McCurdy breach.

SCHEDULE PRESSURE:
The program is currently 4 months behind schedule following an engineering change proposal on the antenna cooling system. Program management is under pressure to recover schedule without increasing cost. Component selection decisions must be finalized within 90 days to maintain the critical path.

KEY STAKEHOLDERS:
- Program Executive Officer (PEO): Vice Admiral [REDACTED], prioritizing schedule recovery
- Prime Contractor PM: Under cost pressure, has financial incentives tied to schedule milestone achievement  
- DCSA: Conducting routine facility clearance reviews, has flagged the FPGA supplier for further review
- Congressional Oversight: HASC has expressed concern about Chinese components in defense systems

THREAT CONTEXT:
Chinese intelligence services (MSS) have demonstrated sustained interest in AESA radar technology dating back to at least 2012. Operation CLOUDHOPPER (APT10) successfully penetrated multiple defense contractor networks between 2014-2017, specifically targeting radar and electronic warfare programs. Three of the prime contractor's engineering managers attended a Beijing-sponsored academic conference 18 months ago.`,
      status: "active",
      tags: ["defense-acquisition", "hardware", "supply-chain", "radar"],
    })
    .returning();

  const [hormuzScenario] = await db
    .insert(scenarios)
    .values({
      name: "Strait of Hormuz Crisis — Week 4",
      description: "Iran has partially closed the Strait of Hormuz following escalating tensions. Four tankers have been seized or damaged in the past three weeks. Global oil markets are in chaos.",
      domainId: energy.id,
      contextDocument: `STRAIT OF HORMUZ CRISIS — WEEK 4 SITUATION REPORT

SITUATION OVERVIEW:
On Day 1, following a US airstrike that killed three senior IRGC commanders, Iran announced a temporary closure of the Strait of Hormuz to tanker traffic. While Iran lacks the capability to fully close the Strait against military opposition, commercial shipping companies have largely complied — commercial insurance has been suspended for Hormuz transits, effectively halting voluntary commercial traffic.

CURRENT STATUS (Day 28):
- Oil price: $147/barrel (up 68% from pre-crisis levels)
- LNG spot prices: $42/MMBtu in Asia (up 285%)
- 23 tankers are anchored outside the Strait awaiting security clearance
- 4 tankers have been seized or damaged in IRGC harassment operations
- US Navy has established convoy operations but commercial operators remain reluctant
- Saudi Arabia has offered 500,000 bbl/day from Yanbu Red Sea terminal (limited by pipeline capacity)

GLOBAL ENERGY IMPACT:
- Japan: 86% of oil imports transit Hormuz; strategic reserves at 145-day supply
- South Korea: 72% exposure; POSCO steel has begun emergency rationing of energy-intensive production
- Europe: Germany has declared energy emergency; LNG terminals operating at 100% capacity
- US: Domestic producers are ramping but Permian infrastructure constraints limit pace

IRAN'S CALCULUS:
IRGC hardliners appear to have consolidated control of the policy response following the strikes. Supreme Leader Khamenei has stated publicly that the closure will continue "until US forces leave the region." Moderate factions within the Iranian government are reportedly attempting to negotiate a face-saving off-ramp through Swiss intermediaries.

FINANCIAL MARKETS:
- Dollar has strengthened significantly as commodity currencies have collapsed
- Emerging market sovereign debt is under stress — Pakistan, Sri Lanka, Bangladesh facing balance-of-payments crises
- Fed has paused rate cycle; ECB is facing stagflation scenario
- Gulf Cooperation Council (GCC) sovereign wealth funds are deploying into distressed assets

WEEK 4 KEY DECISION POINTS:
1. Iran is signaling potential escalation to drone/missile attacks on Saudi oil infrastructure (Abqaiq/Khurais)
2. Chinese tankers are transiting under Iranian escort — straining US-China relations
3. IEA emergency stock release decision pending; US opposing full activation
4. Israeli intelligence indicates Hezbollah is positioning for potential Northern Front escalation
5. Global food prices up 23% in 4 weeks — wheat, palm oil, and fertilizer supply chains disrupted`,
      status: "active",
      tags: ["energy", "Iran", "Hormuz", "oil-crisis", "geopolitics"],
    })
    .returning();

  console.log("Scenarios created.");

  // Chains
  const [chain1] = await db
    .insert(chains)
    .values({
      name: "The Silent Compromise",
      description: "A multi-step adversary operation targeting a defense program through supply chain insertion, cyber exploitation, and insider recruitment — designed to achieve persistent access without triggering security protocols.",
      domainId: defenseAcq.id,
      scenarioId: designPhaseScenario.id,
      isAiGenerated: false,
      tags: ["supply-chain", "cyber", "insider", "persistent-access"],
    })
    .returning();

  const defenseAgentMap = defenseAgents.reduce((acc: Record<string, typeof defenseAgents[0]>, a) => {
    acc[a.discipline] = a;
    return acc;
  }, {});

  await db.insert(chainSteps).values([
    {
      chainId: chain1.id,
      stepNumber: 1,
      agentId: defenseAgentMap["HW/SW Supply Chain"]?.id,
      agentLabel: "Supply Chain Analyst",
      stepText: "Adversary-controlled Tier-3 supplier quietly acquires a legitimate US PCB manufacturer. The acquisition goes unreviewed by CFIUS due to multi-layered shell company structure. The supplier begins winning subcontracts for non-critical components.",
    },
    {
      chainId: chain1.id,
      stepNumber: 2,
      agentId: defenseAgentMap["Cyber / CNO"]?.id,
      agentLabel: "Offensive Cyber Operator",
      stepText: "A compromised firmware update is pushed to field-programmable components sourced from the Tier-3 supplier. The implant is dormant — it activates only when it detects specific RF signatures associated with adversary radar frequencies.",
    },
    {
      chainId: chain1.id,
      stepNumber: 3,
      agentId: defenseAgentMap["Counterintelligence"]?.id,
      agentLabel: "CI / HUMINT Officer",
      stepText: "MSS identifies a financially stressed program manager through open source analysis. A honey trap operation at a defense conference creates leverage. The insider begins providing system architecture documents, including the RF signature detection specifications.",
    },
    {
      chainId: chain1.id,
      stepNumber: 4,
      agentId: defenseAgentMap["Strategic Foresight"]?.id,
      agentLabel: "Futures / Foresight Analyst",
      stepText: "The compromised components are now embedded across 400 production units. The adversary's database maps exact serial numbers to platform deployments. On Day 1 of a conflict, a coordinated activation signal causes radar systems to fail or provide false data precisely when they are needed most.",
    },
  ]);

  const [chain2] = await db
    .insert(chains)
    .values({
      name: "Price Cascade",
      description: "How a Hormuz closure cascades from oil price shock to food security crisis to political instability in vulnerable nations — a compound effect no single analyst sees whole.",
      domainId: energy.id,
      scenarioId: hormuzScenario.id,
      isAiGenerated: false,
      tags: ["oil", "food-security", "cascade", "geopolitics"],
    })
    .returning();

  const energyAgentMap = energyAgents.reduce((acc: Record<string, typeof energyAgents[0]>, a) => {
    acc[a.discipline] = a;
    return acc;
  }, {});

  await db.insert(chainSteps).values([
    {
      chainId: chain2.id,
      stepNumber: 1,
      agentId: energyAgentMap["Supply / Price Dynamics"]?.id,
      agentLabel: "Energy Markets Analyst",
      stepText: "Commercial insurance suspension triggers voluntary shipping halt. Spot oil prices spike to $147/bbl within 72 hours. LNG spot prices follow — Asian buyers face allocation decisions within the week.",
    },
    {
      chainId: chain2.id,
      stepNumber: 2,
      agentId: energyAgentMap["Stagflation / Central Banks"]?.id,
      agentLabel: "Macro Economist",
      stepText: "Energy price shock transmits to food prices through fertilizer costs (natural gas is feedstock), diesel for agricultural machinery, and shipping costs for grain. Global food price index rises 23% in 4 weeks — emerging market governments face import bills they cannot finance.",
    },
    {
      chainId: chain2.id,
      stepNumber: 3,
      agentId: energyAgentMap["Regime Calculus / Negotiation"]?.id,
      agentLabel: "Geopolitical Strategist",
      stepText: "Pakistan, Egypt, and Bangladesh — all net food and energy importers with limited reserves — face balance-of-payments crises. Governments cut fuel subsidies under IMF pressure. Street protests begin. Iran's leadership reads the political instability in US-aligned countries as validation of their strategy.",
    },
    {
      chainId: chain2.id,
      stepNumber: 4,
      agentId: energyAgentMap["Natural Gas / Asia Power"]?.id,
      agentLabel: "LNG / Gas Specialist",
      stepText: "China, which transits under Iranian escort, continues to receive reliable LNG supplies. Beijing uses access to Chinese-escorted LNG supply as leverage to pull wavering Asian allies away from US coalition positions. The energy crisis becomes a geopolitical realignment instrument.",
    },
  ]);

  console.log("Chains created.");
  console.log("\n✓ WARROOM database seeded successfully!");
}

seed().catch(console.error).finally(() => process.exit(0));
