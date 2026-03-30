import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  Globe2,
  Users,
  FileText,
  Target,
  GitMerge,
  PlayCircle,
  FileOutput,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Shield,
  Crosshair,
  Network,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Step {
  number: number;
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  tagline: string;
}

interface ConceptCard {
  icon: React.ElementType;
  color: string;
  label: string;
  path: string;
  analogy: string;
  what: string;
  tip: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const SEQUENCE: Step[] = [
  { number: 1, label: "Define Domains",    href: "/domains",   icon: Globe2,      color: "#2E75B6", tagline: "Set the arena" },
  { number: 2, label: "Build Agents",      href: "/agents",    icon: Users,       color: "#8E44AD", tagline: "Assemble your analysts" },
  { number: 3, label: "Write Scenarios",   href: "/scenarios", icon: FileText,    color: "#27AE60", tagline: "Frame the situation" },
  { number: 4, label: "Log Threats",       href: "/threats",   icon: Target,      color: "#C0392B", tagline: "Map the dangers" },
  { number: 5, label: "Build Chains",      href: "/chains",    icon: GitMerge,    color: "#D68910", tagline: "Connect the dots" },
  { number: 6, label: "Run a Session",     href: "/sessions",  icon: PlayCircle,  color: "#F0A500", tagline: "Debate & pressure-test" },
  { number: 7, label: "Review Reports",    href: "/reports",   icon: FileOutput,  color: "#16A085", tagline: "Extract the signal" },
];

const CONCEPTS: ConceptCard[] = [
  {
    icon: Globe2,
    color: "#2E75B6",
    label: "Domains",
    path: "/domains",
    analogy: "Think of Domains like the different rooms in a headquarters building — Cyber, Energy, Geopolitics. Each room houses its own specialists, maps, and playbooks.",
    what: "Domains are top-level categories that organize everything else. Every Agent, Scenario, Chain, and Session belongs to a Domain. They let you keep Defense Acquisition analysis separate from Energy Infrastructure work.",
    tip: "Start by creating one Domain per major strategic area you care about. You can always add more later.",
  },
  {
    icon: Users,
    color: "#8E44AD",
    label: "Agents",
    path: "/agents",
    analogy: "Agents are like the experts around the table in a real war room — the HUMINT officer, the supply-chain lawyer, the behavioral psychologist. Each sees the same problem but through a completely different lens.",
    what: "Agents are AI-powered expert personas. Each one has a discipline focus (Human, Technical, Physical, Futures), a cognitive bias they can't escape, and a specific red-team hunt list. In sessions, they debate each other.",
    tip: "Use AI Generate to build agents fast. The more diverse the disciplines, the more unexpected the insights. Include at least one agent who thinks in human behavior and one who thinks in systems.",
  },
  {
    icon: FileText,
    color: "#27AE60",
    label: "Scenarios",
    path: "/scenarios",
    analogy: "A Scenario is the mission briefing handed out before the war game begins. It states the situation clearly enough that every analyst knows what they're analyzing — without yet telling them what to think.",
    what: "Scenarios are structured situation briefings. They contain a title, a status (draft / active / archived), and a context document that provides background. Scenarios anchor Sessions and Threats to a specific real-world situation.",
    tip: "Write scenarios like a good journalist: who, what, where, when. Leave 'why' and 'so what' for the agents to debate. The more specific the scenario, the sharper the session output.",
  },
  {
    icon: Target,
    color: "#C0392B",
    label: "Threats",
    path: "/threats",
    analogy: "Threats are the flags pinned to the map — each one marks a specific danger that could materialize from this situation. Like a chess player listing every piece that could threaten the king.",
    what: "Threats are discrete adversary tactics, vulnerabilities, or risks tied to a Scenario or Domain. They have severity ratings (CRITICAL → LOW) and categories. When you run a session, any threats in the registry matching that session's Domain or Scenario are automatically surfaced to every agent as Prior Intelligence — grounding their analysis in known history rather than starting from scratch.",
    tip: "Build your threat registry before running sessions. Even a handful of logged threats will sharpen agent outputs significantly — they'll reference, challenge, and build on the prior intelligence rather than re-discovering the same surface-level risks.",
  },
  {
    icon: GitMerge,
    color: "#D68910",
    label: "Chains",
    path: "/chains",
    analogy: "A Chain is like a storyboard for how a threat unfolds — frame by frame, step by step, each handled by a different specialist. Like a heist movie where each scene is owned by a different character.",
    what: "Chains are multi-step compound threat sequences. Each step is attributed to a discipline or agent, and describes what happens in that stage. Together they map how a complex operation cascades across domains. Chains flow both directions: you can build them manually or with AI, and any compound chain discovered during a session synthesis can be saved back to the library with one click from the Synthesis tab.",
    tip: "After running a session, check the Synthesis tab for compound chains your agents discovered in debate. Use 'Save to Library' to persist the best ones — they become institutional memory for future sessions and manual analysis.",
  },
  {
    icon: PlayCircle,
    color: "#F0A500",
    label: "Sessions",
    path: "/sessions",
    analogy: "A Session is the actual war game. You gather your agents, hand them the scenario, and let them argue. Round 1 is independent analysis — everyone speaks without hearing others. Round 2 is cross-examination — each agent challenges the others.",
    what: "Sessions are structured two-round AI debates. Before agents write a single word, the system automatically pulls any known threats from the registry that match the session's Domain or Scenario and provides them as Prior Intelligence. Round 1 generates each agent's independent assessment; Round 2 generates cross-disciplinary challenges. A final synthesis extracts consensus findings, compound chains, and priority mitigations.",
    tip: "Select agents with deliberately opposing viewpoints — a pure technical thinker paired with a behavioral psychologist. The friction between them is where the insight lives. After synthesis, save the strongest compound chains to the library before closing the session.",
  },
  {
    icon: FileOutput,
    color: "#16A085",
    label: "Reports",
    path: "/reports",
    analogy: "Reports are the after-action brief — the distilled product that decision-makers actually read. Like taking a whiteboard full of argument and turning it into a one-pager with the key bullets.",
    what: "Reports are exported session outputs. They capture the scenario, which agents participated, the Round 1 and Round 2 debate, and the AI-generated synthesis. Available as structured documents for briefing, filing, or sharing.",
    tip: "Generate reports from sessions where agents strongly disagreed. Disagreement is a signal, not noise — it means you've found a genuine decision point.",
  },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Do I need to create everything before running a session?",
    a: "No. You only need at least one Agent and one Scenario to run a session. Domains, Threats, and Chains enrich the analysis but aren't required. Start simple — you can always add depth later.",
  },
  {
    q: "How many agents should I put in a session?",
    a: "3 to 6 agents tends to produce the best output. Fewer than 3 and you lose cross-disciplinary friction. More than 6 and the synthesis becomes unwieldy. Aim for agents with genuinely different disciplines — a cyber thinker, a human behavior expert, and a futures analyst is a strong core team.",
  },
  {
    q: "What's the difference between a Threat and a Chain?",
    a: "A Threat is a single danger — a vulnerability, a tactic, a risk. A Chain is how multiple threats connect and cascade over time. Think of Threats as individual chess pieces and a Chain as the sequence of moves that leads to checkmate.",
  },
  {
    q: "How do Threats in the registry affect my sessions?",
    a: "Automatically. When a session runs Round 1 or Round 2, the system queries your threat registry for any threats tied to the same Domain or Scenario as the session. Those threats are injected into each agent's prompt as 'Prior Intelligence' — a briefing block they receive before writing their assessment. This means agents build on accumulated institutional knowledge rather than starting cold every time. If no matching threats exist, the block is simply omitted and agents proceed normally.",
  },
  {
    q: "How do I get compound chains from a session into the Chains library?",
    a: "After running a synthesis, open the Synthesis tab and scroll to the 'Compound Chains Detected' section. Each chain card has a 'Save to Library' button. Clicking it writes that chain (including its steps) to the Chains registry, tagged as session-derived. The button changes to 'Saved' so you know it's been persisted. From there it appears on the Chains page and is available for reference in future work.",
  },
  {
    q: "Should I use AI Generate or manual for agents?",
    a: "AI Generate is best for speed and coverage — Claude will produce a realistic expert persona with realistic cognitive biases in seconds. Use Manual when you have a very specific real-world archetype in mind that AI might miss, or when you want precise control over the vector weights.",
  },
  {
    q: "What are the vector bars on agent cards?",
    a: "The four vectors (Human, Technical, Physical, Futures) show which quadrant of threat space the agent prioritizes. A high Human score means the agent focuses on behavior, psychology, and insider risk. High Technical means cyber and systems. Physical means kinetic and infrastructure. Futures means emerging and long-horizon risks. Together they show which blind spots a team of agents might have.",
  },
  {
    q: "What makes a good scenario context?",
    a: "Specificity beats vagueness every time. Name the actors, the geography, the timeline, and the specific capability or event in question. A scenario that says 'a nation-state is targeting US defense contractors' will generate weaker analysis than one that says 'a tier-3 PCB subcontractor in Malaysia with known PRC investment has been awarded contracts on three ACAT-I programs — their software development process is unvetted.'",
  },
];

// ── Components ────────────────────────────────────────────────────────────────
function FAQItem({ faq }: { faq: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-card/80 transition-colors"
      >
        <span className="font-display font-bold text-sm uppercase tracking-wide text-foreground pr-4">{faq.q}</span>
        {open ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
      </button>
      <AnimatedContent open={open}>
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
          {faq.a}
        </div>
      </AnimatedContent>
    </div>
  );
}

function AnimatedContent({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Guide() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-12 md:py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen size={20} className="text-primary" />
            </div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Field Manual</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            HOW WARROOM WORKS
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            WARROOM is a structured red-team and strategic analysis platform. It lets you assemble expert AI analysts, put them in the same room, and make them argue about your most complex scenarios — then distill what they find.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-2xl">
            <div className="flex gap-3">
              <Lightbulb size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">The core idea:</span> No single expert sees the full picture. A supply-chain lawyer misses what the HUMINT officer sees. The HUMINT officer misses what the behavioral psychologist sees. WARROOM forces all those lenses onto the same problem at the same time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10 md:py-14 space-y-16">

        {/* The Recommended Sequence */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Crosshair size={18} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-wide">The Recommended Sequence</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Follow this order when setting up WARROOM for the first time, or when starting a new analysis thread.
          </p>

          {/* Steps — desktop flow */}
          <div className="hidden md:flex items-start gap-0 overflow-x-auto pb-4">
            {SEQUENCE.map((step, i) => (
              <React.Fragment key={step.number}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex-shrink-0 w-32"
                >
                  <Link
                    href={step.href}
                    className="flex flex-col items-center group cursor-pointer rounded-xl p-2 transition-colors hover:bg-white/5"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border-2 transition-all group-hover:scale-110 group-hover:shadow-lg"
                      style={{ backgroundColor: `${step.color}15`, borderColor: `${step.color}40` }}
                    >
                      <step.icon size={22} style={{ color: step.color }} />
                    </div>
                    <div
                      className="text-xs font-display font-bold mb-1 uppercase text-center leading-tight group-hover:underline"
                      style={{ color: step.color }}
                    >
                      {step.number}. {step.label}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center font-mono">{step.tagline}</p>
                  </Link>
                </motion.div>
                {i < SEQUENCE.length - 1 && (
                  <div className="flex-shrink-0 flex items-center justify-center w-8 mt-5">
                    <ArrowRight size={14} className="text-muted-foreground/40" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Steps — mobile stacked */}
          <div className="md:hidden space-y-3">
            {SEQUENCE.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={step.href}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-white/5 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{ backgroundColor: `${step.color}15`, borderColor: `${step.color}40` }}
                  >
                    <step.icon size={18} style={{ color: step.color }} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm uppercase" style={{ color: step.color }}>
                      {step.number}. {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{step.tagline}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/30 ml-auto flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick note */}
          <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground flex gap-3 max-w-2xl">
            <Shield size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <span>
              You don't have to follow this order rigidly. The minimum to run a session is{" "}
              <span className="text-foreground font-semibold">one Agent + one Scenario</span>. Everything else adds depth and specificity.
            </span>
          </div>
        </section>

        {/* Concepts */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Network size={18} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-wide">The Building Blocks</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Each section of WARROOM has a specific role. Here's what each one does, in plain language.
          </p>

          <div className="space-y-6">
            {CONCEPTS.map((concept, i) => (
              <motion.div
                key={concept.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Card header */}
                <Link
                  href={concept.path}
                  className="px-6 py-4 flex items-center gap-4 border-b border-border/50 group hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: `${concept.color}08` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${concept.color}15`, borderColor: `${concept.color}30` }}
                  >
                    <concept.icon size={18} style={{ color: concept.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold uppercase tracking-widest group-hover:underline" style={{ color: concept.color }}>
                      {concept.label}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{concept.path}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                </Link>

                {/* Card body */}
                <div className="p-6 grid md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-2">The Analogy</p>
                    <p className="text-sm text-foreground leading-relaxed italic">"{concept.analogy}"</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-2">What It Does</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{concept.what}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5">
                      <Zap size={10} className="text-primary" /> Operator Tip
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{concept.tip}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={18} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-wide">Common Questions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Quick answers to questions that come up when first running analyses.
          </p>
          <div className="space-y-3 max-w-3xl">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </section>

        {/* Quick reference table */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-wide">Quick Reference</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">At-a-glance cheatsheet for every section.</p>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/60 border-b border-border font-mono text-[11px] text-muted-foreground uppercase">
                <tr>
                  <th className="p-4 font-medium">Section</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Think of it as…</th>
                  <th className="p-4 font-medium hidden md:table-cell">Required for sessions?</th>
                  <th className="p-4 font-medium">AI Assist?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  { name: "Domains",   analogy: "Headquarters rooms",       required: "No — organizes everything",       ai: "—" },
                  { name: "Agents",    analogy: "Expert analysts at the table", required: "Yes — minimum 1",             ai: "✓ Full profile generation" },
                  { name: "Scenarios", analogy: "Mission briefing",         required: "Yes — minimum 1",                 ai: "✓ AI-assisted drafting" },
                  { name: "Threats",   analogy: "Flags on the map",         required: "No — auto-feeds sessions",        ai: "✓ Batch generation from context" },
                  { name: "Chains",    analogy: "Storyboard of the attack",  required: "No — exports from sessions",     ai: "✓ Full multi-step generation" },
                  { name: "Sessions",  analogy: "The war game itself",       required: "N/A — this is the output",       ai: "✓ Round 1 + Round 2 + Synthesis" },
                  { name: "Reports",   analogy: "After-action brief",        required: "N/A — generated from sessions",  ai: "✓ Automatic from session" },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-display font-bold text-foreground uppercase text-xs">{row.name}</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">{row.analogy}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{row.required}</td>
                    <td className="p-4 text-muted-foreground">
                      {row.ai.startsWith("✓") ? (
                        <span className="flex items-center gap-1.5 text-primary">
                          <Zap size={11} />
                          <span className="text-xs">{row.ai.slice(2)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-8">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <PlayCircle size={24} className="text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold uppercase mb-3">Ready to Run Your First Session?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              The fastest path: create one agent using AI Generate, write a one-paragraph scenario, then hit "Start New Session."
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/agents"
                className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg font-display uppercase text-sm hover:bg-primary/90 transition-colors"
              >
                Create an Agent
              </a>
              <a
                href="/scenarios"
                className="px-5 py-2.5 border border-border text-muted-foreground font-bold rounded-lg font-display uppercase text-sm hover:text-foreground hover:border-white/30 transition-colors"
              >
                Write a Scenario
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
