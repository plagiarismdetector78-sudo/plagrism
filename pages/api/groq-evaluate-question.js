import { query } from "../../lib/db";
import { analyzeQuestionWithGroq } from "../../lib/groq-evaluation";

function clamp100(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function computeTextSimilarityPercent(a, b) {
  const s1 = String(a || "").toLowerCase().trim();
  const s2 = String(b || "").toLowerCase().trim();
  if (!s1 || !s2) return null;

  const toTokens = (s) =>
    s
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

  const A = new Set(toTokens(s1));
  const B = new Set(toTokens(s2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  const jacc = union ? inter / union : 0;
  return Math.round(jacc * 100);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const {
      questionId,
      spokenAnswer,
      typedAnswer,
      voiceTypedSimilarity,
      typedMeta,
      model,
    } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ success: false, message: "questionId is required" });
    }

    const q = await query(
      `SELECT questiontext FROM questions WHERE id = $1 LIMIT 1`,
      [questionId]
    );
    if (!q.rows[0]) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const expected = await query(
      `SELECT answertext FROM expectedanswers WHERE questionid = $1 AND iscorrect = true`,
      [questionId]
    );
    const expectedAnswers = expected.rows.map((r) => r.answertext).filter(Boolean);

    const voiceTypedSimilaritySafe =
      clamp100(voiceTypedSimilarity) ?? computeTextSimilarityPercent(spokenAnswer, typedAnswer);

    console.log("groq-evaluate-question: input snapshot", {
      questionId,
      questionTextLen: String(q.rows[0].questiontext || "").length,
      expectedAnswersCount: expectedAnswers.length,
      expectedAnswer0Len: expectedAnswers[0] ? String(expectedAnswers[0]).length : 0,
      spokenLen: String(spokenAnswer || "").length,
      typedLen: String(typedAnswer || "").length,
      voiceTypedSimilarity,
      voiceTypedSimilaritySafe,
      typedMetaKeys: typedMeta && typeof typedMeta === "object" ? Object.keys(typedMeta) : null,
    });

    const analysis = await analyzeQuestionWithGroq({
      model,
      questionText: q.rows[0].questiontext,
      expectedAnswers,
      spokenAnswer,
      typedAnswer,
      voiceTypedSimilarity: voiceTypedSimilaritySafe,
      typedMeta,
    });

    if (!analysis.ok) {
      console.error("groq-evaluate-question: failed", {
        questionId,
        modelTried: model || process.env.GROQ_EVAL_MODEL || "default",
        code: analysis.code || null,
        error: analysis.error || null,
      });
      return res.status(200).json({
        success: false,
        message: analysis.error || "Groq analysis failed",
        code: analysis.code || null,
        raw: analysis.raw || null,
      });
    }

    console.log("groq-evaluate-question: ok", {
      questionId,
      model: analysis.model,
      spoken_expected_alignment: analysis.spoken_expected_alignment?.score,
      voice_typed_consistency: analysis.voice_typed_consistency?.score,
      typed_authorship_risk: {
        level: analysis.typed_authorship_risk?.level,
        confidence: analysis.typed_authorship_risk?.confidence,
        paste_suspected: analysis.typed_authorship_risk?.paste_suspected,
      },
    });

    return res.status(200).json({
      success: true,
      model: analysis.model,
      analysis,
    });
  } catch (e) {
    console.error("groq-evaluate-question:", e);
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
}

