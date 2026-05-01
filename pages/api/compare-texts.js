import { calculateSimilarity } from '../../lib/plagiarism';
import { HfInference } from '@huggingface/inference';

/**
 * Compare two texts and return similarity percentage (0-100).
 * Uses TF-IDF cosine + keyword + concept coverage (fast, no external calls).
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { textA, textB } = req.body || {};
        const a = String(textA || '').trim();
        const b = String(textB || '').trim();

        if (!a || !b) {
            return res.status(400).json({
                success: false,
                message: 'textA and textB are required'
            });
        }

        // Prefer semantic embedding similarity when available; fallback to fast TF-IDF heuristic.
        const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
        if (HF_TOKEN) {
            try {
                const hf = new HfInference(HF_TOKEN);
                const [embA, embB] = await Promise.all([
                    hf.featureExtraction({
                        model: 'sentence-transformers/all-MiniLM-L6-v2',
                        inputs: a,
                    }),
                    hf.featureExtraction({
                        model: 'sentence-transformers/all-MiniLM-L6-v2',
                        inputs: b,
                    }),
                ]);
                if (Array.isArray(embA) && Array.isArray(embB) && embA.length === embB.length && embA.length > 0) {
                    let dot = 0;
                    let magA = 0;
                    let magB = 0;
                    for (let i = 0; i < embA.length; i++) {
                        dot += embA[i] * embB[i];
                        magA += embA[i] * embA[i];
                        magB += embB[i] * embB[i];
                    }
                    const denom = Math.sqrt(magA) * Math.sqrt(magB);
                    const cosine = denom ? dot / denom : 0;
                    const similarity = Math.max(0, Math.min(100, cosine * 100));
                    return res.status(200).json({
                        success: true,
                        similarity: Math.round(similarity * 10) / 10,
                        breakdown: { semanticSimilarity: Math.round(similarity * 10) / 10 },
                        interpretation: 'Semantic embedding similarity',
                    });
                }
            } catch (e) {
                // ignore and fallback
            }
        }

        const sim = calculateSimilarity(a, b);
        return res.status(200).json({
            success: true,
            similarity: Math.round((sim.score || 0) * 10) / 10,
            breakdown: sim.breakdown || null,
            interpretation: sim.interpretation || 'Heuristic similarity'
        });
    } catch (error) {
        console.error('compare-texts:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to compare texts',
            error: error.message
        });
    }
}

