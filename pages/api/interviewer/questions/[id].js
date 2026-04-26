import { query, withTransaction } from '../../../../lib/db';
import { ensureQuestionBankSchema } from '../../../../lib/ensureQuestionBankSchema';
import { assertInterviewer } from '../../../../lib/assertInterviewer';

export default async function handler(req, res) {
    const id = parseInt(req.query.id, 10);
    if (!id) {
        return res.status(400).json({ success: false, message: 'Invalid question id' });
    }

    try {
        await ensureQuestionBankSchema();
        const userId = req.body?.userId ?? req.query.userId;
        await assertInterviewer(userId);

        if (req.method === 'PUT') {
            const questionText = String(req.body?.questionText || '').trim();
            const category = String(req.body?.category || '').trim();
            const difficultyLevel = String(req.body?.difficultyLevel || 'Medium').trim() || 'Medium';
            const expectedAnswer = String(req.body?.expectedAnswer || '').trim();
            const expectedAnswers = Array.isArray(req.body?.expectedAnswers)
                ? req.body.expectedAnswers
                : [expectedAnswer];
            const normalizedExpectedAnswers = [...new Set(
                expectedAnswers
                    .map((answer) => String(answer || '').trim())
                    .filter(Boolean)
            )];

            if (!questionText || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'questionText and category are required',
                });
            }
            if (normalizedExpectedAnswers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one expected answer is required',
                });
            }

            await query(
                `INSERT INTO question_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                [category]
            );

            await withTransaction(async (client) => {
                const up = await client.query(
                    `UPDATE questions
                     SET questiontext = $1, category = $2, difficultylevel = $3
                     WHERE id = $4
                     RETURNING id, questiontext, category, difficultylevel`,
                    [questionText, category, difficultyLevel, id]
                );
                if (!up.rows[0]) {
                    const err = new Error('NOT_FOUND');
                    throw err;
                }
                await client.query(
                    `DELETE FROM expectedanswers
                     WHERE questionid = $1 AND iscorrect = true`,
                    [id]
                );

                for (const answerText of normalizedExpectedAnswers) {
                    await client.query(
                        `INSERT INTO expectedanswers (questionid, answertext, iscorrect)
                         VALUES ($1, $2, true)`,
                        [id, answerText]
                    );
                }
            });

            return res.status(200).json({ success: true, id });
        }

        if (req.method === 'DELETE') {
            await withTransaction(async (client) => {
                const exists = await client.query(`SELECT id FROM questions WHERE id = $1`, [id]);
                if (!exists.rows[0]) {
                    const err = new Error('NOT_FOUND');
                    throw err;
                }
                await client.query(`DELETE FROM expectedanswers WHERE questionid = $1`, [id]);
                await client.query(`DELETE FROM questions WHERE id = $1`, [id]);
            });
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
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }
        console.error('interviewer/questions/[id]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
}
