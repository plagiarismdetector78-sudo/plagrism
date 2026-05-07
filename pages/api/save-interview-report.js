// pages/api/save-interview-report.js
import { saveReportWithBlock } from "../../lib/saveReportWithBlock";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const {
      interviewId,
      interviewerId,
      candidateId,
      interviewerName,
      candidateName,
      interviewerEmail,
      candidateEmail,
      questionCategory,
      questionsAsked,
      questionsCount,
      fullTranscript,
      evaluation,
      roomId,
      duration,
    } = req.body;

    console.log("💾 === SAVING INTERVIEW REPORT ===");
    console.log("📋 Interview ID:", interviewId);
    console.log("👤 Candidate:", { id: candidateId, name: candidateName, email: candidateEmail });
    console.log("👔 Interviewer:", { id: interviewerId, name: interviewerName, email: interviewerEmail });
    console.log("⏱️  Duration:", duration, "| Questions:", questionsCount);
    console.log("📝 Transcript length:", fullTranscript?.length || 0);
    console.log("================================\n");

    if (!candidateId || !candidateName) {
      console.warn("⚠️  WARNING: Missing candidate information!");
    }

    const enhancedEvaluation = { ...evaluation, questionsCount };

    const { reportId, blockIndex, blockId, blockHash, createdAt } =
      await saveReportWithBlock({
        interview_id:      interviewId,
        interviewer_id:    interviewerId,
        candidate_id:      candidateId,
        interviewer_name:  interviewerName,
        candidate_name:    candidateName,
        interviewer_email: interviewerEmail,
        candidate_email:   candidateEmail,
        question_category: questionCategory,
        questions_asked:   JSON.stringify(questionsAsked),
        full_transcript:   fullTranscript,
        evaluation_data:   JSON.stringify(enhancedEvaluation),
        room_id:           roomId,
        duration,
        report_type:       "interview",
        report_data:       enhancedEvaluation,
      });

    console.log(`🔗 Block #${blockIndex} created | block_hash: ${blockHash.slice(0, 16)}…`);

    return res.status(200).json({
      success: true,
      reportId,
      blockIndex,
      blockHash,
      createdAt,
      message: "Interview report saved and sealed on blockchain",
    });
  } catch (error) {
    console.error("❌ Error saving interview report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save interview report",
      error: error.message,
    });
  }
}
