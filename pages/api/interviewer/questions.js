import { query, withTransaction } from '../../../lib/db';
import { ensureQuestionBankSchema } from '../../../lib/ensureQuestionBankSchema';
import { assertInterviewer } from '../../../lib/assertInterviewer';

export default async function handler(req, res) {
    try {
        await ensureQuestionBankSchema();
        const userId = req.method === 'GET' ? req.query.userId : req.body?.userId;
        await assertInterviewer(userId);

        if (req.method === 'GET') {
            const { category, difficulty } = req.query;
            const params = [];
            let sql = `
                SELECT
                    q.id,
                    q.questiontext,
                    q.category,
                    q.difficultylevel,
                    MIN(ea.id) AS expectedanswer_id,
                    MIN(ea.answertext) AS expected_answer,
                    COALESCE(
                        ARRAY_REMOVE(ARRAY_AGG(ea.answertext ORDER BY ea.id), NULL),
                        '{}'::text[]
                    ) AS expected_answers
                FROM questions q
                LEFT JOIN expectedanswers ea ON ea.questionid = q.id AND ea.iscorrect = true
                WHERE 1=1
            `;
            let n = 1;
            if (category) {
                sql += ` AND TRIM(q.category) = $${n}`;
                params.push(String(category).trim());
                n++;
            }
            if (difficulty) {
                sql += ` AND q.difficultylevel = $${n}`;
                params.push(String(difficulty));
                n++;
            }
            sql += ` GROUP BY q.id, q.questiontext, q.category, q.difficultylevel ORDER BY q.id ASC`;
            const result = await query(sql, params);
            return res.status(200).json({ success: true, questions: result.rows });
        }

        if (req.method === 'POST') {
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
                    message: 'At least one expected answer is required for interview scoring',
                });
            }

            await query(
                `INSERT INTO question_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                [category]
            );

            const row = await withTransaction(async (client) => {
                const qIns = await client.query(
                    `INSERT INTO questions (questiontext, category, difficultylevel)
                     VALUES ($1, $2, $3)
                     RETURNING id, questiontext, category, difficultylevel`,
                    [questionText, category, difficultyLevel]
                );
                const newId = qIns.rows[0].id;
                for (const answerText of normalizedExpectedAnswers) {
                    await client.query(
                        `INSERT INTO expectedanswers (questionid, answertext, iscorrect)
                         VALUES ($1, $2, true)`,
                        [newId, answerText]
                    );
                }
                return qIns.rows[0];
            });

            return res.status(201).json({
                success: true,
                question: {
                    ...row,
                    expected_answer: normalizedExpectedAnswers[0],
                    expected_answers: normalizedExpectedAnswers,
                },
            });
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });
    } catch (error) {
        if (error.message === 'UNAUTHORIZED') {
            return res.status(401).json({ success: false, message: 'Login required' });
        }
        if (error.message === 'FORBIDDEN') {
            return res.status(403).json({ success: false, message: 'Interviewer access only' });
        }
        console.error('interviewer/questions:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
}
