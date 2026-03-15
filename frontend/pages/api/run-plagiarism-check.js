import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, content, contentType } = req.body;

  try {
    // Simulate plagiarism check (replace with actual plagiarism detection service)
    const similarityScore = Math.random() * 100;
    const flaggedSections = similarityScore > 20 ? [
      {
        text: content.substring(0, Math.min(100, content.length)),
        similarity: Math.random() * 100,
        matches: ['Sample source match']
      }
    ] : [];

    const sources = similarityScore > 20 ? [
      {
        url: 'https://example.com/source',
        similarity: Math.random() * 100
      }
    ] : [];

    const result = await query(
      `INSERT INTO plagiarism_checks 
       (user_id, content_type, content_text, similarity_score, flagged_sections, sources) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, contentType, content, similarityScore, flaggedSections, sources]
    );

    res.status(200).json({ success: true, check: result.rows[0] });
  } catch (error) {
    console.error('Error running plagiarism check:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}