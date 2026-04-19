import { query } from './db';

let ensured = false;

/**
 * Ensures `question_categories` exists and stays in sync with distinct `questions.category` values.
 * Safe to call on every request (no-op after first load in a warm process).
 */
export async function ensureQuestionBankSchema() {
    if (ensured) return;

    await query(`
        CREATE TABLE IF NOT EXISTS question_categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        )
    `);

    await query(`
        INSERT INTO question_categories (name) VALUES
            ('Computer Science'),
            ('Software Engineering'),
            ('Cyber Security')
        ON CONFLICT (name) DO NOTHING
    `);

    await query(`
        INSERT INTO question_categories (name)
        SELECT DISTINCT TRIM(category)
        FROM questions
        WHERE category IS NOT NULL AND TRIM(category) <> ''
        ON CONFLICT (name) DO NOTHING
    `);

    ensured = true;
}
