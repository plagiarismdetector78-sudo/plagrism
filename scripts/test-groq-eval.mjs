#!/usr/bin/env node
/**
 * Groq smoke test — same chat prompt + JSON schema as lib/groq-evaluation.js (first request only).
 * Does NOT use Next.js, DB, or meeting code. Use this to verify API key, model, and raw model scores.
 *
 * Run from repo root:
 *   node scripts/test-groq-eval.mjs
 *   node scripts/test-groq-eval.mjs --raw-only
 *
 * Loads env from .env.local then .env (same idea as Next).
 *
 * If this script returns sensible JSON but the app shows 0, the issue is in app wiring/timing/payload.
 * If this script errors or returns garbage, the issue is key, model, or Groq availability.
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Groq from "groq-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
dotenv.config({ path: path.join(root, ".env"), quiet: true });

function clamp100(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function extractJson(text) {
  const s = String(text || "").trim();
  try {
    return JSON.parse(s);
  } catch {}
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(s.slice(start, end + 1));
    } catch {}
  }
  return null;
}

async function groqCreateJson(groq, { model, system, user, jsonSchema }) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const base = { model, messages, temperature: 0.2, max_tokens: 900 };
  const trySchema =
    process.env.GROQ_USE_JSON_SCHEMA === "1" || process.env.GROQ_USE_JSON_SCHEMA === "true";

  if (trySchema) {
    try {
      return await groq.chat.completions.create({
        ...base,
        response_format: { type: "json_schema", json_schema: jsonSchema },
      });
    } catch (e) {
      console.warn("[test-groq-eval] json_schema failed, using json_object:", e?.message || e);
    }
  }

  return await groq.chat.completions.create({
    ...base,
    response_format: { type: "json_object" },
  });
}

/** Same shape as the app sends into analyzeQuestionWithGroq (sample data). */
const SAMPLE_INPUT = {
  questionText: "Explain the concept of deadlock.",
  expectedAnswers: [
    "Deadlock occurs when processes block each other waiting for resources. Four conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Prevention includes ordering resources, timeouts, and avoiding hold-and-wait.",
  ],
  spokenAnswer:
    "Deadlock is when two or more processes are waiting on each other for resources so nothing can proceed. You need things like mutual exclusion and circular wait.",
  typedAnswer:
    "Deadlock happens when processes circularly wait for locks; breaking circular wait or using ordering can help.",
  voiceTypedSimilarity: 42,
  typedMeta: {
    firstInputAt: Date.now() - 20000,
    lastInputAt: Date.now(),
    activeMs: 12000,
    keystrokes: 80,
    pasteCount: 0,
    pastedChars: 0,
    changeCount: 80,
  },
};

function buildPromptPayload(input) {
  return {
    questionText: String(input.questionText || ""),
    expectedAnswers: (input.expectedAnswers || []).map((x) => String(x || "")).filter(Boolean),
    spokenAnswer: String(input.spokenAnswer || ""),
    typedAnswer: String(input.typedAnswer || ""),
    voiceTypedSimilarity: clamp100(input.voiceTypedSimilarity),
    typedMeta: input.typedMeta || null,
  };
}

function buildMessages(payload) {
  const system = `You are an interview evaluator and integrity analyst.
Return ONLY valid JSON matching the requested schema.
Never output 0 scores unless the content is completely unrelated OR the relevant answer is empty.`;

  const user = `Analyze this question/answer pair.

INPUT JSON:
${JSON.stringify(payload, null, 2)}

Return JSON exactly in this schema:
{
  "spoken_expected_alignment": { "score": 0-100, "reasons": [string], "missing_key_points": [string] },
  "voice_typed_consistency": { "score": 0-100, "reasons": [string] },
  "typed_authorship_risk": {
    "level": "low" | "medium" | "high",
    "confidence": 0-100,
    "reasons": [string],
    "paste_suspected": true | false
  },
  "overall_notes": [string]
}

Scoring rubric:
- spoken_expected_alignment.score:
  - 0 ONLY if spokenAnswer is empty OR totally unrelated to questionText + expectedAnswers
  - 20 if it mentions at least one correct key concept but is incomplete
  - 50 if it is partially correct with several missing points
  - 80+ if it covers most key points accurately
- voice_typed_consistency.score:
  - Use voiceTypedSimilarity (0-100) as the BASE score.
  - If spokenAnswer or typedAnswer is empty, score MUST be 0.`;

  const jsonSchema = {
    name: "interview_eval",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "spoken_expected_alignment",
        "voice_typed_consistency",
        "typed_authorship_risk",
        "overall_notes",
      ],
      properties: {
        spoken_expected_alignment: {
          type: "object",
          additionalProperties: false,
          required: ["score", "reasons", "missing_key_points"],
          properties: {
            score: { type: "number" },
            reasons: { type: "array", items: { type: "string" } },
            missing_key_points: { type: "array", items: { type: "string" } },
          },
        },
        voice_typed_consistency: {
          type: "object",
          additionalProperties: false,
          required: ["score", "reasons"],
          properties: {
            score: { type: "number" },
            reasons: { type: "array", items: { type: "string" } },
          },
        },
        typed_authorship_risk: {
          type: "object",
          additionalProperties: false,
          required: ["level", "confidence", "reasons", "paste_suspected"],
          properties: {
            level: { type: "string", enum: ["low", "medium", "high"] },
            confidence: { type: "number" },
            reasons: { type: "array", items: { type: "string" } },
            paste_suspected: { type: "boolean" },
          },
        },
        overall_notes: { type: "array", items: { type: "string" } },
      },
    },
  };

  return { system, user, jsonSchema };
}

async function main() {
  const rawOnly = process.argv.includes("--raw-only");
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Missing GROQ_API_KEY. Set it in .env.local or .env at repo root.");
    process.exit(1);
  }

  const model = process.env.GROQ_EVAL_MODEL || "llama-3.3-70b-versatile";
  const groq = new Groq({ apiKey });
  const payload = buildPromptPayload(SAMPLE_INPUT);
  const { system, user, jsonSchema } = buildMessages(payload);

  console.log("=== Groq smoke test ===");
  console.log("Model:", model);
  console.log("Payload summary:", {
    questionLen: payload.questionText.length,
    expectedCount: payload.expectedAnswers.length,
    spokenLen: payload.spokenAnswer.length,
    typedLen: payload.typedAnswer.length,
    voiceTypedSimilarity: payload.voiceTypedSimilarity,
  });
  console.log("");

  let resp;
  try {
    resp = await groqCreateJson(groq, { model, system, user, jsonSchema });
  } catch (e) {
    console.error("Groq request failed:", e?.message || e);
    console.error(JSON.stringify(e?.error || e, null, 2));
    process.exit(1);
  }

  const content = resp?.choices?.[0]?.message?.content || "";
  if (rawOnly) {
    console.log("--- Raw message content ---");
    console.log(content);
    process.exit(0);
  }

  const parsed = extractJson(content);
  console.log("--- Usage ---");
  console.log(JSON.stringify(resp?.usage || null, null, 2));
  console.log("");
  console.log("--- Parsed JSON (three tasks in one response) ---");
  if (!parsed) {
    console.log("Could not parse JSON. Raw:");
    console.log(content);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        spoken_expected_alignment: parsed.spoken_expected_alignment,
        voice_typed_consistency: parsed.voice_typed_consistency,
        typed_authorship_risk: parsed.typed_authorship_risk,
        overall_notes: parsed.overall_notes,
      },
      null,
      2
    )
  );

  console.log("");
  console.log("--- Score quick view ---");
  console.log({
    spokenVsExpected: parsed?.spoken_expected_alignment?.score,
    voiceVsTyped: parsed?.voice_typed_consistency?.score,
    typedAiRisk: parsed?.typed_authorship_risk
      ? {
          level: parsed.typed_authorship_risk.level,
          confidence: parsed.typed_authorship_risk.confidence,
          paste_suspected: parsed.typed_authorship_risk.paste_suspected,
        }
      : null,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
