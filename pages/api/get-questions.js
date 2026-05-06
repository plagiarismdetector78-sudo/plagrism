// pages/api/get-questions.js
import { query } from '../../lib/db';
import { ensureQuestionBankSchema } from '../../lib/ensureQuestionBankSchema';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { category, difficulty, limit = '10', random = 'false' } = req.query;

        await ensureQuestionBankSchema();

        let sql = `
          SELECT
            q.id,
            q.questiontext,
            q.category,
            q.difficultylevel
          FROM questions q
          WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        // Add category filter
        if (category) {
            sql += ` AND TRIM(q.category) = $${paramCount}`;
            params.push(String(category).trim());
            paramCount++;
        }

        // Add difficulty filter
        if (difficulty) {
            sql += ` AND q.difficultylevel = $${paramCount}`;
            params.push(String(difficulty));
            paramCount++;
        }

        // Random or sequential order
        if (random === 'true') {
            sql += ' ORDER BY RANDOM()';
        } else {
            sql += ' ORDER BY q.id';
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
