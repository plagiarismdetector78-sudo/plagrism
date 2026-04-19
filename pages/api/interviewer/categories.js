import { query, withTransaction } from '../../../lib/db';
import { ensureQuestionBankSchema } from '../../../lib/ensureQuestionBankSchema';
import { assertInterviewer } from '../../../lib/assertInterviewer';

export default async function handler(req, res) {
    try {
        await ensureQuestionBankSchema();
        const userId = req.method === 'GET' ? req.query.userId : req.body?.userId ?? req.query.userId;
        await assertInterviewer(userId);

        if (req.method === 'GET') {
            const result = await query(
                `SELECT id, name FROM question_categories ORDER BY name ASC`
            );
            return res.status(200).json({ success: true, categories: result.rows });
        }

        if (req.method === 'POST') {
            const name = String(req.body?.name || '').trim();
            if (!name) {
                return res.status(400).json({ success: false, message: 'Category name is required' });
            }
            let ins = await query(
                `INSERT INTO question_categories (name) VALUES ($1)
                 ON CONFLICT (name) DO NOTHING
                 RETURNING id, name`,
                [name]
            );
            if (!ins.rows[0]) {
                ins = await query(`SELECT id, name FROM question_categories WHERE name = $1`, [name]);
            }
            return res.status(201).json({ success: true, category: ins.rows[0] });
        }

        if (req.method === 'PUT') {
            const id = parseInt(req.body?.id, 10);
            const name = String(req.body?.name || '').trim();
            if (!id || !name) {
                return res.status(400).json({ success: false, message: 'id and name are required' });
            }
            const cur = await query(`SELECT name FROM question_categories WHERE id = $1`, [id]);
            if (!cur.rows[0]) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            const oldName = cur.rows[0].name;
            await withTransaction(async (client) => {
                await client.query(`UPDATE question_categories SET name = $1 WHERE id = $2`, [name, id]);
                await client.query(`UPDATE questions SET category = $1 WHERE TRIM(category) = $2`, [
                    name,
                    oldName,
                ]);
            });
            return res.status(200).json({ success: true, category: { id, name } });
        }

        if (req.method === 'DELETE') {
            const id = parseInt(req.query.id, 10);
            if (!id) {
                return res.status(400).json({ success: false, message: 'id query param is required' });
            }
            const cur = await query(`SELECT name FROM question_categories WHERE id = $1`, [id]);
            if (!cur.rows[0]) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            const catName = cur.rows[0].name;
            const cnt = await query(
                `SELECT COUNT(*)::int AS c FROM questions WHERE TRIM(category) = $1`,
                [catName]
            );
            if (cnt.rows[0].c > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete: ${cnt.rows[0].c} question(s) still use this category. Reassign or remove them first.`,
                });
            }
            await query(`DELETE FROM question_categories WHERE id = $1`, [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });
    } catch (error) {
        if (error.message === 'UNAUTHORIZED') {
            return res.status(401).json({ success: false, message: 'Login required' });
        }
        if (error.message === 'FORBIDDEN') {
            return res.status(403).json({ success: false, message: 'Interviewer access only' });
        }
        console.error('interviewer/categories:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
}
