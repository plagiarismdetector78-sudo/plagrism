// pages/api/calculate-plagiarism.js
import { query } from '../../lib/db';
import { evaluateAnswerWithHuggingFace } from '../../lib/huggingface-evaluation';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { questionId, transcribedAnswer } = req.body;

        if (!questionId || !transcribedAnswer) {
            return res.status(400).json({
                success: false,
                message: 'Question ID and transcribed answer are required'
            });
        }

        // Fetch question text and expected answer from database
        const questionResult = await query(
            `SELECT questiontext 
             FROM questions 
             WHERE id = $1 
             LIMIT 1`,
            [questionId]
        );

        const answerResult = await query(
            `SELECT answertext FROM expectedanswers 
             WHERE questionid = $1 AND iscorrect = true 
             LIMIT 1`,
            [questionId]
        );

        if (questionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        if (answerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expected answer not found for this question'
            });
        }

        const questionText = questionResult.rows[0].questiontext;
        const expectedAnswer = answerResult.rows[0].answertext;

        console.log('🤖 Starting Hugging Face evaluation for question:', questionId);

        // Use Hugging Face semantic similarity evaluation
        const evaluation = await evaluateAnswerWithHuggingFace(
            questionText,
            expectedAnswer,
            transcribedAnswer
        );

        console.log('✅ Hugging Face Evaluation completed:', evaluation.overallScore);
        console.log('📊 Full Evaluation Data:', JSON.stringify(evaluation, null, 2));

        const responseData = {
            success: true,
            plagiarismScore: evaluation.overallScore,
            breakdown: {
                semanticSimilarity: evaluation.accuracy,
                keywordMatch: evaluation.completeness,
                conceptCoverage: evaluation.understanding
            },
            interpretation: evaluation.interpretation,
            aiDetection: evaluation.aiDetection || null,
            details: {
                matchedKeywords: evaluation.matchedConcepts,
                strengths: evaluation.strengths,
                weaknesses: evaluation.weaknesses,
                missedConcepts: evaluation.missedConcepts,
                feedback: evaluation.feedback,
                scores: {
                    accuracy: evaluation.accuracy,
                    completeness: evaluation.completeness,
                    understanding: evaluation.understanding,
                    clarity: evaluation.clarity
                },
                evaluationType: evaluation.evaluationType,
                aiDetection: evaluation.aiDetection || null
            }
        };
        
        console.log('📤 API Response to Client:', JSON.stringify(responseData, null, 2));

        res.status(200).json(responseData);
    } catch (error) {
        console.error('❌ Error in answer evaluation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to evaluate answer',
            error: error.message
        });
    }
}
