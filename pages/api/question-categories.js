import { query } from '../../lib/db';
import { ensureQuestionBankSchema } from '../../lib/ensureQuestionBankSchema';

/** Public read-only list for meeting UI and shared dropdowns. */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await ensureQuestionBankSchema();
        const result = await query(`
            SELECT DISTINCT q.name AS name
            FROM (
                SELECT name FROM question_categories
                UNION
                SELECT TRIM(category) AS name FROM questions
                WHERE category IS NOT NULL AND TRIM(category) <> ''
            ) q
            ORDER BY q.name
        `);
        const categories = result.rows.map((r) => r.name);
        return res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error('question-categories:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load categories',
            error: error.message,
        });
    }
}
