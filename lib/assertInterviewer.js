import { query } from './db';

/**
 * @param {string | number | undefined | null} userId
 * @throws {Error} message 'UNAUTHORIZED' or 'FORBIDDEN'
 */
export async function assertInterviewer(userId) {
    if (userId == null || userId === '') {
        const err = new Error('UNAUTHORIZED');
        throw err;
    }
    const result = await query('SELECT role FROM users WHERE id = $1 LIMIT 1', [userId]);
    const row = result.rows[0];
    if (!row || row.role !== 'interviewer') {
        const err = new Error('FORBIDDEN');
        throw err;
    }
}
