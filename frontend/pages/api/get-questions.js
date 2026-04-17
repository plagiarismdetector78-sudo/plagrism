// pages/api/get-questions.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { category, difficulty, limit = '10', random = 'false' } = req.query;

        let sql = 'SELECT Id, QuestionText, Category, DifficultyLevel FROM Questions WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Add category filter
        if (category) {
            sql += ` AND Category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        // Add difficulty filter
        if (difficulty) {
            sql += ` AND DifficultyLevel = $${paramCount}`;
            params.push(difficulty);
            paramCount++;
        }

        // Random or sequential order
        if (random === 'true') {
            sql += ' ORDER BY RANDOM()';
        } else {
            sql += ' ORDER BY Id';
        }

        // Add limit
        sql += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        const result = await query(sql, params);

        res.status(200).json({
            success: true,
            questions: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questions',
            error: error.message
        });
    }
}
