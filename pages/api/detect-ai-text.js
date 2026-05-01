import { detectAIContent } from '../../lib/huggingface-evaluation';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { text } = req.body || {};
        const input = String(text || '').trim();
        if (!input) {
            return res.status(400).json({ success: false, message: 'text is required' });
        }
        const aiDetection = await detectAIContent(input);
        return res.status(200).json({ success: true, aiDetection });
    } catch (error) {
        console.error('detect-ai-text:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to detect AI text',
            error: error.message
        });
    }
}

