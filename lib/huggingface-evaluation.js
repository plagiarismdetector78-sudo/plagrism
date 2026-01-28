// lib/huggingface-evaluation.js
// Plagiarism and AI content detection using Hugging Face

import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_KEY is not configured in environment variables');
}

const hf = new HfInference(HF_TOKEN);

/**
 * Detect if text is AI-generated (ChatGPT detector)
 * @param {string} text - Text to analyze
 * @returns {Promise<object>} - Detection result with label and confidence
 */
async function detectAIContent(text) {
    try {
        console.log('🤖 Detecting AI-generated content...');
        console.log('📝 Input Text for AI Detection:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        console.log('📏 Text Length:', text.length, 'characters');
        
        const result = await hf.textClassification({
            model: 'Hello-SimpleAI/chatgpt-detector-roberta',
            inputs: text
        });
        
        console.log('📥 Raw AI Detection Response:', JSON.stringify(result, null, 2));
        
        // Result format: [{label: "ChatGPT", score: 0.99}, {label: "Human", score: 0.01}]
        const chatGPTScore = result.find(r => r.label === 'ChatGPT');
        const humanScore = result.find(r => r.label === 'Human');
        
        const chatGPTPercentage = chatGPTScore ? Math.round(chatGPTScore.score * 100) : 0;
        const humanPercentage = humanScore ? Math.round(humanScore.score * 100) : 0;
        
        const topPrediction = result.reduce((prev, current) => 
            (current.score > prev.score) ? current : prev
        );
        
        const isAI = topPrediction.label.toLowerCase().includes('chatgpt') || 
                     topPrediction.label.toLowerCase().includes('ai') ||
                     topPrediction.label.toLowerCase().includes('fake');
        
        const confidence = Math.round(topPrediction.score * 100);
        
        console.log(`✅ AI Detection: ${topPrediction.label} (${confidence}% confidence)`);
        console.log(`   📊 ChatGPT: ${chatGPTPercentage}% | Human: ${humanPercentage}%`);
        
        return {
            isAIGenerated: isAI,
            confidence: confidence,
            label: topPrediction.label,
            chatGPTPercentage: chatGPTPercentage,
            humanPercentage: humanPercentage,
            allScores: result
        };
        
    } catch (error) {
        console.error('❌ AI Detection error:', error.message);
        return {
            isAIGenerated: false,
            confidence: 0,
            label: 'Unknown',
            error: error.message
        };
    }
}

/**
 * Calculate semantic similarity between candidate answer and expected answer
 * @param {string} candidateAnswer - The candidate's transcribed answer
 * @param {string} expectedAnswer - The ideal/expected answer
 * @returns {Promise<number>} - Similarity score (0-100)
 */
async function calculateSimilarity(candidateAnswer, expectedAnswer) {
    try {
        console.log('🔍 Calculating similarity using Hugging Face...');
        console.log('📝 Candidate Answer:', candidateAnswer.substring(0, 200) + (candidateAnswer.length > 200 ? '...' : ''));
        console.log('📝 Expected Answer:', expectedAnswer.substring(0, 200) + (expectedAnswer.length > 200 ? '...' : ''));
        
        // Get embeddings for both texts using feature extraction
        const candidateEmbedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: candidateAnswer
        });
        
        const expectedEmbedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: expectedAnswer
        });
        console.log('📥 Expected Embedding (first 10 values):', expectedEmbedding.slice(0, 10));
        
        // Calculate cosine similarity
        const similarity = cosineSimilarity(candidateEmbedding, expectedEmbedding);
        const similarityScore = similarity * 100; // Convert to percentage
        
        console.log(`✅ Similarity Score: ${similarityScore.toFixed(2)}%`);
        return similarityScore;
        
    } catch (error) {
        console.error('❌ Hugging Face API error:', error.message);
        // Fallback to basic word matching
        return calculateBasicSimilarity(candidateAnswer, expectedAnswer);
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        throw new Error('Invalid vectors for similarity calculation');
    }
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Fallback: Basic word-matching similarity
 */
function calculateBasicSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return (intersection.size / union.size) * 100;
}

/**
 * Comprehensive answer evaluation using semantic similarity
 * @param {string} question - The interview question
 * @param {string} expectedAnswer - The ideal answer
 * @param {string} candidateAnswer - The candidate's answer
 * @returns {Promise<object>} - Evaluation result
 */
export async function evaluateAnswerWithHuggingFace(question, expectedAnswer, candidateAnswer) {
    try {
        console.log('🤖 Starting Hugging Face evaluation...');
        
        if (!candidateAnswer || candidateAnswer.trim().length < 10) {
            return {
                overallScore: 0,
                accuracy: 0,
                completeness: 0,
                understanding: 0,
                clarity: 0,
                strengths: [],
                weaknesses: ['Answer too short or empty'],
                matchedConcepts: [],
                missedConcepts: [],
                interpretation: 'No meaningful answer provided',
                feedback: 'Please provide a more detailed response',
                evaluationType: 'huggingface'
            };
        }

        // 1. Detect if answer is AI-generated
        const aiDetection = await detectAIContent(candidateAnswer);
        
        // 2. Calculate semantic similarity
        const similarityScore = await calculateSimilarity(candidateAnswer, expectedAnswer);
        
        // Extract key concepts from expected answer
        const expectedConcepts = extractKeyConcepts(expectedAnswer);
        const candidateConcepts = extractKeyConcepts(candidateAnswer);
        
        const matchedConcepts = expectedConcepts.filter(concept => 
            candidateConcepts.some(c => c.toLowerCase().includes(concept.toLowerCase()) || 
                                       concept.toLowerCase().includes(c.toLowerCase()))
        );
        
        const missedConcepts = expectedConcepts.filter(concept => !matchedConcepts.includes(concept));
        
        // Calculate completeness based on concept coverage
        const completeness = (matchedConcepts.length / Math.max(expectedConcepts.length, 1)) * 100;
        
        // Length analysis for understanding
        const answerLength = candidateAnswer.split(/\s+/).length;
        const expectedLength = expectedAnswer.split(/\s+/).length;
        const lengthRatio = Math.min(answerLength / expectedLength, 1);
        const understanding = similarityScore * 0.7 + lengthRatio * 30;
        
        // Clarity based on sentence structure
        const sentences = candidateAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = candidateAnswer.split(/\s+/).length / Math.max(sentences.length, 1);
        const clarity = avgSentenceLength > 5 && avgSentenceLength < 30 ? 
            Math.min(similarityScore + 10, 100) : Math.max(similarityScore - 10, 0);
        
        // Overall score (weighted average)
        const overallScore = Math.round(
            similarityScore * 0.4 +
            completeness * 0.3 +
            understanding * 0.2 +
            clarity * 0.1
        );
        
        // Generate strengths and weaknesses
        const strengths = [];
        const weaknesses = [];
        
        // AI Detection warnings
        if (aiDetection.isAIGenerated && aiDetection.confidence >= 70) {
            weaknesses.push(`HIGH RISK: Answer appears AI-generated (${aiDetection.confidence}% confidence)`);
            weaknesses.push('Answer may have been written by ChatGPT or similar AI');
        } else if (aiDetection.isAIGenerated && aiDetection.confidence >= 50) {
            weaknesses.push(`MODERATE RISK: Possible AI-generated content (${aiDetection.confidence}% confidence)`);
        } else if (aiDetection.confidence > 0) {
            strengths.push(`Appears human-written (${100 - aiDetection.confidence}% AI confidence)`);
        }
        
        if (similarityScore >= 80) strengths.push('High semantic similarity to expected answer');
        else if (similarityScore < 50) weaknesses.push('Low similarity to expected answer');
        
        if (completeness >= 80) strengths.push(`Covered ${matchedConcepts.length} key concepts`);
        else weaknesses.push(`Missing ${missedConcepts.length} important concepts`);
        
        if (answerLength >= expectedLength * 0.7) strengths.push('Adequate detail provided');
        else weaknesses.push('Answer is too brief');
        
        if (sentences.length > 2) strengths.push('Well-structured response');
        
        // Interpretation with AI detection
        let interpretation;
        if (aiDetection.isAIGenerated && aiDetection.confidence >= 70) {
            interpretation = 'WARNING: High probability of AI-generated content detected';
        } else if (overallScore >= 80) {
            interpretation = 'Excellent answer with strong understanding';
        } else if (overallScore >= 60) {
            interpretation = 'Good answer with room for improvement';
        } else if (overallScore >= 40) {
            interpretation = 'Partial understanding demonstrated';
        } else {
            interpretation = 'Needs significant improvement';
        }
        
        // Feedback with AI detection info
        let feedback = `Your answer shows ${similarityScore.toFixed(0)}% similarity to the expected response. `;
        feedback += `You covered ${matchedConcepts.length} out of ${expectedConcepts.length} key concepts. `;
        
        if (aiDetection.isAIGenerated && aiDetection.confidence >= 50) {
            feedback += `\n\n⚠️ AI DETECTION: This answer was flagged as potentially AI-generated (${aiDetection.label}, ${aiDetection.confidence}% confidence). Please ensure you're providing original responses.`;
        }
        
        if (missedConcepts.length > 0) {
            feedback += `\nConsider discussing: ${missedConcepts.slice(0, 3).join(', ')}.`;
        }
        
        console.log(`✅ Hugging Face Evaluation completed: ${overallScore}%`);
        console.log('📊 Complete Evaluation Object:', JSON.stringify({
            overallScore: Math.round(overallScore),
            accuracy: Math.round(similarityScore),
            completeness: Math.round(completeness),
            understanding: Math.round(understanding),
            clarity: Math.round(clarity),
            aiDetection: {
                isAIGenerated: aiDetection.isAIGenerated,
                confidence: aiDetection.confidence,
                label: aiDetection.label,
                chatGPTPercentage: aiDetection.chatGPTPercentage,
                humanPercentage: aiDetection.humanPercentage
            },
            evaluationType: 'huggingface-ai-similarity'
        }, null, 2));

        return {
            overallScore: Math.round(overallScore),
            accuracy: Math.round(similarityScore),
            completeness: Math.round(completeness),
            understanding: Math.round(understanding),
            clarity: Math.round(clarity),
            strengths,
            weaknesses,
            matchedConcepts,
            missedConcepts,
            interpretation,
            feedback,
            aiDetection: {
                isAIGenerated: aiDetection.isAIGenerated,
                confidence: aiDetection.confidence,
                label: aiDetection.label,
                chatGPTPercentage: aiDetection.chatGPTPercentage || 0,
                humanPercentage: aiDetection.humanPercentage || 0,
                allScores: aiDetection.allScores
            },
            evaluationType: 'huggingface-ai-similarity'
        };
        
    } catch (error) {
        console.error('❌ Evaluation error:', error);
        return fallbackEvaluation(candidateAnswer, expectedAnswer);
    }
}

/**
 * Extract key concepts from text (words longer than 4 characters)
 */
function extractKeyConcepts(text) {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4);
    
    // Remove common words
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'will', 'would', 'could', 'should', 'about', 'which', 'their', 'there', 'where', 'these', 'those']);
    
    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 15);
}

/**
 * Fallback evaluation when API fails
 */
function fallbackEvaluation(candidateAnswer, expectedAnswer) {
    const basicScore = calculateBasicSimilarity(candidateAnswer, expectedAnswer);
    
    return {
        overallScore: Math.round(basicScore),
        accuracy: Math.round(basicScore),
        completeness: Math.round(basicScore * 0.9),
        understanding: Math.round(basicScore * 0.85),
        clarity: Math.round(basicScore * 0.8),
        strengths: ['Answer provided'],
        weaknesses: ['Unable to perform detailed evaluation'],
        matchedConcepts: [],
        missedConcepts: [],
        interpretation: 'Basic evaluation (API unavailable)',
        feedback: 'Evaluation performed using basic text matching',
        evaluationType: 'fallback-basic'
    };
}
