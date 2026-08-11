import type { ProjectContext, Question } from "@/lib/types";
import { hasDocumentContext } from "@/lib/files/document-context";

/** Scenario-first: people relate to stories before specs */
const QUESTIONS: Question[] = [
  {
    id: "scenario",
    text: "Walk me through the scenario: what happens day-to-day that this system needs to support?",
    placeholder:
      "e.g. Operators at 3 plants monitor live OEE dashboards; alarms route to on-call when…",
    chips: [
      "Operators monitor equipment remotely in real time",
      "Field crews capture jobsite data on mobile devices",
      "Plant telemetry flows to a historian for analytics",
      "Fleet vehicles stream GPS + sensor data to dispatch",
      "Engineers investigate quality issues using historical trends",
      "Control room coordinates SCADA + enterprise IT systems",
    ],
  },
  {
    id: "industry",
    text: "What industry or domain is this for?",
    placeholder: "e.g. Construction, Energy, Utilities, Mining, Logistics...",
    chips: [
      "Manufacturing",
      "Construction",
      "Energy & Utilities",
      "Oil & Gas",
      "Mining",
      "Logistics & Fleet",
      "Building Automation",
      "Pharma & Life Sciences",
    ],
  },
  {
    id: "deployment",
    text: "Cloud, on-prem, edge, or hybrid deployment?",
    chips: ["Cloud", "On-prem", "Edge-heavy", "Hybrid"],
  },
  {
    id: "facilities",
    text: "How many sites, plants, or deployments?",
    placeholder: "e.g. 12 construction sites, 3 refineries, 50 vehicles",
    chips: ["Single site", "2–10 sites", "10–50 sites", "50+ distributed"],
  },
  {
    id: "scale",
    text: "What's the expected scale?",
    placeholder: "e.g. 50k IoT devices, 500 users, 10TB/day",
    chips: ["Small (<1k endpoints)", "Medium (1k–50k)", "Large (50k+)", "Enterprise"],
  },
  {
    id: "existingSystems",
    text: "What existing systems or software are in place?",
    placeholder: "e.g. SAP, Procore, SCADA, CMMS, custom apps",
    chips: ["SCADA/OT", "ERP/CMMS", "Historian/IoT", "Greenfield"],
  },
  {
    id: "budget",
    text: "What's your budget range?",
    chips: ["<$100k", "$100k–$500k", "$500k–$2M", "$2M+"],
  },
];

function countAnswers(ctx: ProjectContext): number {
  let count = QUESTIONS.filter((q) => ctx[q.id]).length;
  if (hasDocumentContext(ctx)) count += 2;
  if (ctx.naturalNotes?.trim()) count += 2;
  return count;
}

export function getNextQuestion(ctx: ProjectContext): Question | null {
  if (ctx.intakeMode === "natural") return null;
  if (countAnswers(ctx) >= 4) return null;
  return QUESTIONS.find((q) => !ctx[q.id]) ?? null;
}

export function getScenarioQuestion(): Question {
  return QUESTIONS[0];
}

export function getTotalQuestions(): number {
  return QUESTIONS.length;
}

export function getAnsweredCount(ctx: ProjectContext): number {
  return Math.min(countAnswers(ctx), QUESTIONS.length);
}

export function normalizeAnswer(
  questionId: Question["id"],
  answer: string
): string {
  if (questionId === "deployment") {
    const lower = answer.toLowerCase();
    if (lower.includes("cloud") && !lower.includes("hybrid")) return "cloud";
    if (lower.includes("on-prem") || lower.includes("on prem")) return "on-prem";
    if (lower.includes("edge")) return "hybrid";
    if (lower.includes("hybrid")) return "hybrid";
  }
  return answer;
}

export function getAnsweredFields(ctx: ProjectContext): string[] {
  return QUESTIONS.filter((q) => ctx[q.id]).map((q) => q.id);
}

export const NATURAL_MODE_INTRO =
  "Tell me everything in your own words: the scenario, who's involved, scale, constraints, and existing systems. Add as much detail as you like, then hit **Build blueprint** when you're ready. No forms required.";

export const GUIDED_MODE_INTRO =
  "Let's start with the scenario: I'll ask what happens day-to-day before we get into specs. Prefer to skip the questions? Switch to **natural language** anytime.";
