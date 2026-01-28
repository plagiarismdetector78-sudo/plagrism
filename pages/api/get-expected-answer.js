// pages/api/get-expected-answer.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { questionId } = req.query;

        if (!questionId) {
            return res.status(400).json({
                success: false,
                message: 'Question ID is required'
            });
        }

        const result = await query(
            `SELECT ea.Id, ea.QuestionId, ea.AnswerText, q.QuestionText, q.Category, q.DifficultyLevel
       FROM ExpectedAnswers ea
       JOIN Questions q ON ea.QuestionId = q.Id
       WHERE ea.QuestionId = $1 AND ea.IsCorrect = true
       LIMIT 1`,
            [questionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expected answer not found for this question'
            });
        }

        res.status(200).json({
            success: true,
            answer: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching expected answer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expected answer',
            error: error.message
        });
    }
}
