// pages/api/save-interview-response.js
import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const {
      interviewId,
      questionId,
      transcribedAnswer,
      plagiarismScore = null,
      audioFileUrl = null,
    } = req.body;

    // ✅ HARD VALIDATION
    if (!interviewId || !questionId) {
      return res.status(400).json({
        success: false,
        message: "interviewId and questionId are required",
      });
    }

    /**
     * 🔥 FORCE STRING ANSWER
     * Frontend may send:
     * - string
     * - object (per question)
     */
    let answerText = "";

    if (typeof transcribedAnswer === "string") {
      answerText = transcribedAnswer.trim();
    } else if (typeof transcribedAnswer === "object" && transcribedAnswer !== null) {
      // Expecting { candidate: "...", interviewer: "..." }
      answerText = transcribedAnswer.candidate || "";
    }

    if (!answerText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Candidate answer is empty",
      });
    }

    console.log("📝 Saving interview response:", {
      interviewId,
      questionId,
      answerText,
      plagiarismScore,
    });

    // ✅ INSERT — MATCHES NEON TABLE 1:1
    const result = await query(
      `
      INSERT INTO interviewresponses
        (interviewid, questionid, transcribedanswer, plagiarismscore, audiofileurl)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        interviewId,
        questionId,
        answerText,
        plagiarismScore,
        audioFileUrl,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Interview response saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving interview response:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save interview response",
      error: error.message,
    });
  }
}
