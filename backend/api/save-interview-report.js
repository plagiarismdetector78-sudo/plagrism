// pages/api/save-interview-report.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
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
            transcribedAnswer,
            evaluation,
            roomId,
            duration,
            durationMs
        } = req.body;
        
        console.log('💾 === SAVING INTERVIEW REPORT ===');
        console.log('📋 Interview ID:', interviewId);
        console.log('👤 Candidate Info:', { id: candidateId, name: candidateName, email: candidateEmail });
        console.log('👔 Interviewer Info:', { id: interviewerId, name: interviewerName, email: interviewerEmail });
        console.log('⏱️ Duration:', duration, 'Questions count:', questionsCount);
        console.log('📝 Transcript length:', fullTranscript?.length || 0);
        console.log('🤖 AI Detection:', evaluation?.aiDetection);
        console.log('================================\n');
        
        // Validate candidate info before saving
        if (!candidateId || !candidateName) {
            console.warn('⚠️ WARNING: Missing candidate information!');
            console.warn('candidateId:', candidateId);
            console.warn('candidateName:', candidateName);
        }

        // Add questionsCount to evaluation data so it persists
        const enhancedEvaluation = {
            ...evaluation,
            questionsCount: questionsCount
        };
        
        console.log('📊 Enhanced evaluation with questionsCount:', enhancedEvaluation.questionsCount);

        // Save to database
        // report_data is JSONB type, so we need to cast it properly
        const result = await query(
            `INSERT INTO interview_reports 
             (interview_id, interviewer_id, candidate_id, interviewer_name, candidate_name, 
              interviewer_email, candidate_email, question_category, questions_asked, 
              full_transcript, evaluation_data, room_id, duration, report_type, report_data, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, NOW())
             RETURNING id`,
            [
                interviewId,
                interviewerId,
                candidateId,
                interviewerName,
                candidateName,
                interviewerEmail,
                candidateEmail,
                questionCategory,
                JSON.stringify(questionsAsked),
                fullTranscript,
                JSON.stringify(enhancedEvaluation),
                roomId,
                duration,
                'interview',
                JSON.stringify(enhancedEvaluation)
            ]
        );

        const reportId = result.rows[0].id;

        res.status(200).json({
            success: true,
            reportId,
            message: 'Interview report saved successfully'
        });
    } catch (error) {
        console.error('❌ Error saving interview report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save interview report',
            error: error.message
        });
    }
}
