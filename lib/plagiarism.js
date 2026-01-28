// lib/plagiarism.js

/**
 * Calculate semantic similarity between two texts using multiple techniques:
 * 1. TF-IDF with cosine similarity
 * 2. Keyword matching
 * 3. Concept coverage
 */

// Tokenize and normalize text
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2); // Filter out very short words
}

// Remove common stop words
const STOP_WORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with',
    'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'are', 'was',
    'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'can'
]);

function removeStopWords(tokens) {
    return tokens.filter(token => !STOP_WORDS.has(token));
}

// Calculate term frequency
function calculateTF(tokens) {
    const tf = {};
    const totalTokens = tokens.length;

    tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
    });

    // Normalize by total tokens
    Object.keys(tf).forEach(token => {
        tf[token] = tf[token] / totalTokens;
    });

    return tf;
}

// Calculate IDF (Inverse Document Frequency)
function calculateIDF(doc1Tokens, doc2Tokens) {
    const allTokens = new Set([...doc1Tokens, ...doc2Tokens]);
    const idf = {};

    allTokens.forEach(token => {
        let docCount = 0;
        if (doc1Tokens.includes(token)) docCount++;
        if (doc2Tokens.includes(token)) docCount++;

        // IDF = log(total docs / docs containing term)
        idf[token] = Math.log(2 / docCount);
    });

    return idf;
}

// Calculate TF-IDF vector
function calculateTFIDF(tf, idf) {
    const tfidf = {};

    Object.keys(tf).forEach(token => {
        tfidf[token] = tf[token] * (idf[token] || 0);
    });

    return tfidf;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vec1, vec2) {
    const allTokens = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    allTokens.forEach(token => {
        const val1 = vec1[token] || 0;
        const val2 = vec2[token] || 0;

        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
    });

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
}

// Calculate keyword match percentage
function keywordMatchScore(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    let matches = 0;
    set1.forEach(token => {
        if (set2.has(token)) matches++;
    });

    const totalUnique = new Set([...tokens1, ...tokens2]).size;
    return totalUnique > 0 ? matches / totalUnique : 0;
}

// Extract key concepts (words that appear multiple times or are longer)
function extractKeyConcepts(tokens) {
    const frequency = {};
    tokens.forEach(token => {
        frequency[token] = (frequency[token] || 0) + 1;
    });

    // Key concepts are words that appear more than once or are longer than 6 characters
    return tokens.filter(token => frequency[token] > 1 || token.length > 6);
}

// Calculate concept coverage
function conceptCoverageScore(expectedTokens, transcribedTokens) {
    const expectedConcepts = new Set(extractKeyConcepts(expectedTokens));
    const transcribedConcepts = new Set(extractKeyConcepts(transcribedTokens));

    if (expectedConcepts.size === 0) return 0;

    let coveredConcepts = 0;
    expectedConcepts.forEach(concept => {
        if (transcribedConcepts.has(concept)) coveredConcepts++;
    });

    return coveredConcepts / expectedConcepts.size;
}

/**
 * Main function to calculate plagiarism/similarity score
 * @param {string} expectedAnswer - The correct answer from database
 * @param {string} transcribedAnswer - The user's transcribed answer
 * @returns {object} - Similarity score and breakdown
 */
export function calculateSimilarity(expectedAnswer, transcribedAnswer) {
    // Handle empty inputs
    if (!expectedAnswer || !transcribedAnswer) {
        return {
            score: 0,
            breakdown: {
                semanticSimilarity: 0,
                keywordMatch: 0,
                conceptCoverage: 0
            },
            interpretation: 'Invalid input'
        };
    }

    // Tokenize and clean
    const expectedTokens = removeStopWords(tokenize(expectedAnswer));
    const transcribedTokens = removeStopWords(tokenize(transcribedAnswer));

    // Calculate TF for both documents
    const tf1 = calculateTF(expectedTokens);
    const tf2 = calculateTF(transcribedTokens);

    // Calculate IDF
    const idf = calculateIDF(expectedTokens, transcribedTokens);

    // Calculate TF-IDF vectors
    const tfidf1 = calculateTFIDF(tf1, idf);
    const tfidf2 = calculateTFIDF(tf2, idf);

    // Calculate semantic similarity using cosine similarity
    const semanticSimilarity = cosineSimilarity(tfidf1, tfidf2);

    // Calculate keyword match
    const keywordMatch = keywordMatchScore(expectedTokens, transcribedTokens);

    // Calculate concept coverage
    const conceptCoverage = conceptCoverageScore(expectedTokens, transcribedTokens);

    // Weighted average (semantic similarity is most important)
    const finalScore = (
        semanticSimilarity * 0.5 +
        keywordMatch * 0.3 +
        conceptCoverage * 0.2
    ) * 100; // Convert to percentage

    // Interpretation
    let interpretation;
    if (finalScore >= 80) {
        interpretation = 'Excellent match - Answer covers key concepts accurately';
    } else if (finalScore >= 60) {
        interpretation = 'Good match - Answer is mostly correct with minor gaps';
    } else if (finalScore >= 40) {
        interpretation = 'Partial match - Answer has some correct elements';
    } else if (finalScore >= 20) {
        interpretation = 'Low match - Answer lacks key concepts';
    } else {
        interpretation = 'Very low match - Answer appears unrelated';
    }

    return {
        score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
        breakdown: {
            semanticSimilarity: Math.round(semanticSimilarity * 100 * 10) / 10,
            keywordMatch: Math.round(keywordMatch * 100 * 10) / 10,
            conceptCoverage: Math.round(conceptCoverage * 100 * 10) / 10
        },
        interpretation,
        details: {
            expectedKeywords: Array.from(new Set(expectedTokens)).slice(0, 10),
            transcribedKeywords: Array.from(new Set(transcribedTokens)).slice(0, 10),
            matchedKeywords: Array.from(new Set(expectedTokens)).filter(t =>
                transcribedTokens.includes(t)
            ).slice(0, 10)
        }
    };
}
