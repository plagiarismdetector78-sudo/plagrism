// lib/ai-answer-evaluation.js
// AI-powered answer evaluation using Google Gemini API

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Evaluate interview answer using AI
 * @param {string} question - The interview question
 * @param {string} expectedAnswer - The ideal/expected answer
 * @param {string} candidateAnswer - The candidate's transcribed answer
 * @returns {Promise<object>} - Evaluation result with score and feedback
 */
export async function evaluateAnswerWithAI(question, expectedAnswer, candidateAnswer) {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ Gemini API key not configured, using fallback evaluation');
        return fallbackEvaluation(expectedAnswer, candidateAnswer);
    }

    try {
        const prompt = `You are an expert technical interviewer evaluating a candidate's answer. 

INTERVIEW QUESTION:
${question}

EXPECTED/IDEAL ANSWER:
${expectedAnswer}

CANDIDATE'S ANSWER:
${candidateAnswer}

Evaluate the candidate's answer based on:
1. **Accuracy** - How correct is the information provided?
2. **Completeness** - Does it cover the key concepts from the expected answer?
3. **Understanding** - Does the candidate demonstrate clear understanding?
4. **Clarity** - Is the explanation clear and well-structured?

Provide your evaluation in this EXACT JSON format (no markdown, no code blocks, just pure JSON):
{
  "overallScore": 85,
  "accuracy": 90,
  "completeness": 80,
  "understanding": 85,
  "clarity": 85,
  "strengths": ["Strong understanding of core concepts", "Clear explanation of deadlock conditions"],
  "weaknesses": ["Could elaborate more on prevention strategies", "Missing real-world example"],
  "matchedConcepts": ["mutual exclusion", "hold and wait", "circular wait", "deadlock prevention"],
  "missedConcepts": ["resource allocation graph", "banker's algorithm"],
  "interpretation": "Excellent answer with strong grasp of fundamental concepts",
  "feedback": "The candidate demonstrates solid understanding of deadlock concepts and conditions. The explanation is clear and accurate. To improve, consider adding practical examples and discussing prevention techniques in more detail."
}

IMPORTANT RULES:
- overallScore should be 0-100
- All sub-scores (accuracy, completeness, understanding, clarity) should be 0-100
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Be fair but rigorous in evaluation
- If candidate answer is very short or off-topic, give lower scores accordingly`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response format from Gemini API');
        }

        let responseText = data.candidates[0].content.parts[0].text.trim();
        
        // Remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Parse JSON response
        const evaluation = JSON.parse(responseText);

        // Validate and ensure all required fields
        const validatedEvaluation = {
            overallScore: Math.min(100, Math.max(0, evaluation.overallScore || 0)),
            accuracy: Math.min(100, Math.max(0, evaluation.accuracy || 0)),
            completeness: Math.min(100, Math.max(0, evaluation.completeness || 0)),
            understanding: Math.min(100, Math.max(0, evaluation.understanding || 0)),
            clarity: Math.min(100, Math.max(0, evaluation.clarity || 0)),
            strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
            weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [],
            matchedConcepts: Array.isArray(evaluation.matchedConcepts) ? evaluation.matchedConcepts : [],
            missedConcepts: Array.isArray(evaluation.missedConcepts) ? evaluation.missedConcepts : [],
            interpretation: evaluation.interpretation || 'Evaluation completed',
            feedback: evaluation.feedback || 'No specific feedback provided',
            evaluationType: 'AI-Powered (Gemini)'
        };

        console.log('✅ AI Evaluation completed:', validatedEvaluation.overallScore);
        return validatedEvaluation;

    } catch (error) {
        console.error('❌ AI Evaluation error:', error.message);
        return fallbackEvaluation(expectedAnswer, candidateAnswer);
    }
}

/**
 * Fallback evaluation using basic text matching (when AI is unavailable)
 */
function fallbackEvaluation(expectedAnswer, candidateAnswer) {
    if (!expectedAnswer || !candidateAnswer) {
        return {
            overallScore: 0,
            accuracy: 0,
            completeness: 0,
            understanding: 0,
            clarity: 0,
            strengths: [],
            weaknesses: ['Answer not provided'],
            matchedConcepts: [],
            missedConcepts: [],
            interpretation: 'No answer provided',
            feedback: 'Please provide an answer to be evaluated',
            evaluationType: 'Fallback (Basic)'
        };
    }

    // Simple word-based matching
    const expectedWords = new Set(
        expectedAnswer.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3)
    );
    
    const candidateWords = new Set(
        candidateAnswer.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3)
    );

    const matchedWords = [...expectedWords].filter(w => candidateWords.has(w));
    const matchRatio = expectedWords.size > 0 ? (matchedWords.length / expectedWords.size) : 0;
    const score = Math.round(matchRatio * 100);

    let interpretation;
    if (score >= 80) interpretation = 'Excellent match with expected answer';
    else if (score >= 60) interpretation = 'Good understanding with minor gaps';
    else if (score >= 40) interpretation = 'Partial understanding demonstrated';
    else if (score >= 20) interpretation = 'Limited understanding shown';
    else interpretation = 'Answer needs significant improvement';

    return {
        overallScore: score,
        accuracy: score,
        completeness: Math.max(0, score - 10),
        understanding: score,
        clarity: Math.min(100, score + 5),
        strengths: matchedWords.length > 0 ? ['Uses some relevant terminology'] : [],
        weaknesses: matchedWords.length < expectedWords.size / 2 ? ['Missing key concepts'] : [],
        matchedConcepts: matchedWords.slice(0, 10),
        missedConcepts: [...expectedWords].filter(w => !candidateWords.has(w)).slice(0, 10),
        interpretation,
        feedback: `Basic text analysis shows ${score}% concept coverage. Consider using AI evaluation for detailed feedback.`,
        evaluationType: 'Fallback (Basic)'
    };
}

/**
 * Batch evaluate multiple answers (for future use)
 */
export async function batchEvaluateAnswers(questionAnswerPairs) {
    const evaluations = [];
    
    for (const pair of questionAnswerPairs) {
        const evaluation = await evaluateAnswerWithAI(
            pair.question,
            pair.expectedAnswer,
            pair.candidateAnswer
        );
        evaluations.push({
            questionId: pair.questionId,
            ...evaluation
        });
    }
    
    return evaluations;
}
