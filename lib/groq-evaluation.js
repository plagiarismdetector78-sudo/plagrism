import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clamp100(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** Tokens for overlap metrics (aligned with meeting room Jaccard helper). */
function tokenSet(s) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3)
  );
}

function jaccardPercentStrings(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union ? Math.round((inter / union) * 100) : 0;
}

/** Best overlap of spoken answer vs any expected answer or the question text. */
function spokenExpectedHeuristicPercent(spokenAnswer, questionText, expectedAnswers) {
  const spoken = String(spokenAnswer || "").trim();
  if (!spoken) return 0;
  let best = 0;
  for (const exp of expectedAnswers || []) {
    best = Math.max(best, jaccardPercentStrings(spoken, exp));
  }
  best = Math.max(best, jaccardPercentStrings(spoken, questionText));
  return clamp100(best);
}

function extractJson(text) {
  const s = String(text || "").trim();
  // Try direct parse
  try {
    return JSON.parse(s);
  } catch {}
  // Try to find first {...} block
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = s.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  return null;
}

async function groqCreateJson({ model, system, user, jsonSchema }) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const base = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 900,
  };

  // llama-3.3 / many Groq chat models do NOT support response_format json_schema (400).
  // Default matches the working path from scripts/test-groq-eval.mjs: json_object only.
  // Set GROQ_USE_JSON_SCHEMA=1 to try json_schema first (e.g. models listed on Groq structured outputs docs).
  const trySchemaFirst =
    process.env.GROQ_USE_JSON_SCHEMA === "1" || process.env.GROQ_USE_JSON_SCHEMA === "true";

  if (trySchemaFirst) {
    try {
      return await groq.chat.completions.create({
        ...base,
        response_format: { type: "json_schema", json_schema: jsonSchema },
      });
    } catch (e) {
      const msg = String(e?.error?.message || e?.message || "");
      if (!msg.includes("json_schema") && !msg.includes("response format")) {
        throw e;
      }
      console.warn("[GroqEval] json_schema failed, using json_object", { model, detail: msg.slice(0, 120) });
    }
  }

  return await groq.chat.completions.create({
    ...base,
    response_format: { type: "json_object" },
  });
}

/**
 * Calls a Groq chat model and returns a strict JSON analysis.
 */
export async function analyzeQuestionWithGroq({
  model,
  questionText,
  expectedAnswers,
  spokenAnswer,
  typedAnswer,
  voiceTypedSimilarity,
  typedMeta,
}) {
  if (!process.env.GROQ_API_KEY) {
    return {
      ok: false,
      error: "GROQ_API_KEY not configured",
    };
  }

  const preferredModel =
    model ||
    process.env.GROQ_EVAL_MODEL ||
    "llama-3.3-70b-versatile";
  const fallbackModels = [
    preferredModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
  ].filter(Boolean);

  const payload = {
    questionText: String(questionText || ""),
    expectedAnswers: (expectedAnswers || []).map((x) => String(x || "")).filter(Boolean),
    spokenAnswer: String(spokenAnswer || ""),
    typedAnswer: String(typedAnswer || ""),
    voiceTypedSimilarity: clamp100(voiceTypedSimilarity),
    typedMeta: typedMeta || null,
  };

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

  let lastErr = null;
  let usedModel = null;
  let resp = null;
  for (const m of fallbackModels) {
    try {
      usedModel = m;
      resp = await groqCreateJson({ model: m, system, user, jsonSchema });
      break;
    } catch (e) {
      lastErr = e;
      const code = e?.error?.error?.code || e?.code || null;
      const msg = e?.error?.error?.message || e?.message || String(e);
      console.error("[GroqEval] model failed:", { model: m, code, msg });
      // If it's a model decommission error, try next fallback. Otherwise still try next.
      continue;
    }
  }

  if (!resp) {
    const code = lastErr?.error?.error?.code || lastErr?.code || null;
    const msg = lastErr?.error?.error?.message || lastErr?.message || "Groq request failed";
    return { ok: false, error: msg, code };
  }

  const content = resp?.choices?.[0]?.message?.content || "";
  const json = extractJson(content);
  if (!json) {
    return { ok: false, error: "Groq returned non-JSON", raw: content, model: usedModel };
  }

  // normalize (may be updated by retry below)
  let alignment = json.spoken_expected_alignment || {};
  let consistency = json.voice_typed_consistency || {};
  let risk = json.typed_authorship_risk || {};

  let alignmentScoreRaw = Number(alignment?.score);
  let consistencyScoreRaw = Number(consistency?.score);
  if (alignmentScoreRaw === 0 || consistencyScoreRaw === 0) {
    console.warn("[GroqEval] suspicious zero score(s)", {
      model: usedModel,
      expectedAnswersCount: payload.expectedAnswers.length,
      spokenLen: payload.spokenAnswer.length,
      typedLen: payload.typedAnswer.length,
      voiceTypedSimilarity: payload.voiceTypedSimilarity,
      parsed: {
        spoken_expected_alignment: alignment,
        voice_typed_consistency: consistency,
        typed_authorship_risk: risk,
      },
    });
  }

  // Retry once when we have real inputs but got zeros anyway.
  // This protects against occasional "everything is 0" model behavior.
  if (
    alignmentScoreRaw === 0 &&
    payload.spokenAnswer.length >= 12 &&
    payload.expectedAnswers.length >= 1
  ) {
    console.warn("[GroqEval] retrying due to 0 alignment", {
      model: usedModel,
      spokenLen: payload.spokenAnswer.length,
      expectedAnswersCount: payload.expectedAnswers.length,
    });
    const retryUser =
      user +
      `\n\nYou returned 0 before. Re-evaluate carefully. If the spokenAnswer contains ANY relevant concept, the score must be > 0.\n`;
    try {
      const retryResp = await groqCreateJson({
        model: usedModel,
        system,
        user: retryUser,
        jsonSchema,
      });
      const retryContent = retryResp?.choices?.[0]?.message?.content || "";
      const retryJson = extractJson(retryContent);
      if (retryJson?.spoken_expected_alignment) {
        const a2 = retryJson.spoken_expected_alignment || {};
        const c2 = retryJson.voice_typed_consistency || consistency;
        const r2 = retryJson.typed_authorship_risk || risk;
        json.spoken_expected_alignment = a2;
        json.voice_typed_consistency = c2;
        json.typed_authorship_risk = r2;
        alignment = a2;
        consistency = c2;
        risk = r2;
        alignmentScoreRaw = Number(alignment?.score);
        consistencyScoreRaw = Number(consistency?.score);
      }
    } catch (e) {
      console.warn("[GroqEval] retry failed", { model: usedModel, message: e?.message || String(e) });
    }
  }

  // --- Deterministic floors: Groq often ignores rubric / similarity; merge with heuristics ---
  const spokenHeuristic = spokenExpectedHeuristicPercent(
    payload.spokenAnswer,
    payload.questionText,
    payload.expectedAnswers
  );
  const groqAlignmentScore = clamp100(alignment.score);
  let alignmentScore = groqAlignmentScore;
  if (payload.spokenAnswer.trim() && payload.expectedAnswers.length >= 1) {
    const merged = Math.max(alignmentScore, spokenHeuristic);
    if (merged !== alignmentScore) {
      console.log("[GroqEval] spoken_expected_alignment floor from token overlap", {
        groq: groqAlignmentScore,
        heuristic: spokenHeuristic,
        final: merged,
      });
      alignmentScore = merged;
    }
  }

  const hasSpoken = payload.spokenAnswer.trim().length > 0;
  const hasTyped = payload.typedAnswer.trim().length > 0;
  const sim = clamp100(payload.voiceTypedSimilarity);
  const groqConsistencyScore = clamp100(consistency.score);
  let consistencyScore = groqConsistencyScore;
  if (hasSpoken && hasTyped) {
    const merged = Math.max(consistencyScore, sim);
    if (merged !== consistencyScore) {
      console.log("[GroqEval] voice_typed_consistency floor from voiceTypedSimilarity", {
        groq: groqConsistencyScore,
        similarity: sim,
        final: merged,
      });
      consistencyScore = merged;
    }
  } else {
    consistencyScore = 0;
  }

  let consistencyReasons = Array.isArray(consistency.reasons)
    ? consistency.reasons.map(String).slice(0, 12)
    : [];
  if (
    hasSpoken &&
    hasTyped &&
    consistencyScore === sim &&
    sim > 0 &&
    !consistencyReasons.some((r) => /overlap|similarity|typed/i.test(r))
  ) {
    consistencyReasons = [
      `Voice vs typed overlap (token Jaccard): ~${sim}%.`,
      ...consistencyReasons,
    ].slice(0, 12);
  }

  let alignmentReasons = Array.isArray(alignment.reasons)
    ? alignment.reasons.map(String).slice(0, 12)
    : [];
  if (alignmentScore > groqAlignmentScore && spokenHeuristic > 0) {
    alignmentReasons = [
      `Token overlap vs expected answer / question (floor): ~${spokenHeuristic}%.`,
      ...alignmentReasons,
    ].slice(0, 12);
  }

  return {
    ok: true,
    model: usedModel,
    spoken_expected_alignment: {
      score: alignmentScore,
      reasons: alignmentReasons,
      missing_key_points: Array.isArray(alignment.missing_key_points)
        ? alignment.missing_key_points.map(String).slice(0, 12)
        : [],
    },
    voice_typed_consistency: {
      score: consistencyScore,
      reasons: consistencyReasons,
    },
    typed_authorship_risk: {
      level: ["low", "medium", "high"].includes(String(risk.level)) ? String(risk.level) : "low",
      confidence: clamp100(risk.confidence),
      reasons: Array.isArray(risk.reasons) ? risk.reasons.map(String).slice(0, 12) : [],
      paste_suspected: Boolean(risk.paste_suspected),
    },
    overall_notes: Array.isArray(json.overall_notes) ? json.overall_notes.map(String).slice(0, 12) : [],
    raw: json,
    usage: resp?.usage || null,
  };
}

