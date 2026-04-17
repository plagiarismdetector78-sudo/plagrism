// Gemini AI integration for profile matching
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function analyzeProfileMatch(candidateProfile, interviewerProfile) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured, using fallback matching');
    return fallbackProfileMatch(candidateProfile, interviewerProfile);
  }

  try {
    const prompt = `
Analyze the compatibility between a job candidate and an interviewer based on their profiles. 

CANDIDATE PROFILE:
- Qualification: ${candidateProfile.qualification || 'Not specified'}
- Recent Education: ${candidateProfile.recentStudied || 'Not specified'}
- Bio: ${candidateProfile.bio || 'No bio provided'}

INTERVIEWER PROFILE:
- Qualification: ${interviewerProfile.qualification || 'Not specified'}
- Recent Education: ${interviewerProfile.recentStudied || 'Not specified'}
- Bio: ${interviewerProfile.bio || 'No bio provided'}

Provide a compatibility analysis in this exact JSON format only:
{
  "educationalAlignment": 7,
  "skillRelevance": 8,
  "overallCompatibility": 7.5,
  "matchingAreas": ["Computer Science", "Web Development"],
  "interviewFocus": ["JavaScript", "React", "Node.js"],
  "explanation": "The candidate and interviewer share similar educational backgrounds in computer science and both have experience in web development technologies."
}

Important: Return ONLY valid JSON, no other text or explanations.
`;

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
          temperature: 0.1,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure from Gemini:', data);
      throw new Error('Invalid response structure from Gemini API');
    }

    const resultText = data.candidates[0].content.parts[0].text;
    
    // Clean the response text - remove any markdown code blocks
    const cleanedText = resultText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    try {
      const result = JSON.parse(cleanedText);
      
      // Validate the result structure
      if (typeof result.overallCompatibility !== 'number' || 
          !Array.isArray(result.matchingAreas) || 
          !Array.isArray(result.interviewFocus)) {
        throw new Error('Invalid response format from Gemini');
      }
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse Gemini response. Raw text:', cleanedText);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse Gemini API response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return fallbackProfileMatch(candidateProfile, interviewerProfile);
  }
}

// Enhanced fallback matching for when Gemini fails
function fallbackProfileMatch(candidateProfile, interviewerProfile) {
  const candidateQual = (candidateProfile.qualification || '').toLowerCase();
  const interviewerQual = (interviewerProfile.qualification || '').toLowerCase();
  const candidateBio = (candidateProfile.bio || '').toLowerCase();
  const interviewerBio = (interviewerProfile.bio || '').toLowerCase();
  const candidateEducation = (candidateProfile.recentStudied || '').toLowerCase();
  const interviewerEducation = (interviewerProfile.recentStudied || '').toLowerCase();
  
  let educationalAlignment = 3;
  let skillRelevance = 3;
  const matchingAreas = new Set();
  const interviewFocus = new Set();

  // Educational background matching
  const educationKeywords = [
    'computer', 'software', 'engineering', 'science', 'technology', 
    'developer', 'programming', 'information', 'data', 'system',
    'bachelor', 'master', 'degree', 'university', 'college'
  ];
  
  educationKeywords.forEach(term => {
    const candidateHasTerm = candidateQual.includes(term) || candidateEducation.includes(term);
    const interviewerHasTerm = interviewerQual.includes(term) || interviewerEducation.includes(term);
    
    if (candidateHasTerm && interviewerHasTerm) {
      educationalAlignment += 2;
      matchingAreas.add(term.charAt(0).toUpperCase() + term.slice(1));
    }
  });
  
  // Skill matching from bio and qualifications
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
    'web development', 'mobile development', 'cloud', 'aws', 'azure', 
    'docker', 'kubernetes', 'sql', 'database', 'mongodb', 'postgresql',
    'frontend', 'backend', 'fullstack', 'devops', 'machine learning', 
    'ai', 'data science', 'html', 'css', 'typescript', 'php', 'ruby'
  ];
  
  skillKeywords.forEach(skill => {
    const candidateHasSkill = candidateBio.includes(skill) || candidateQual.includes(skill);
    const interviewerHasSkill = interviewerBio.includes(skill) || interviewerQual.includes(skill);
    
    if (candidateHasSkill && interviewerHasSkill) {
      skillRelevance += 3;
      interviewFocus.add(skill.charAt(0).toUpperCase() + skill.slice(1));
    } else if (candidateHasSkill || interviewerHasSkill) {
      skillRelevance += 1;
    }
  });
  
  // Check for exact qualification matches
  if (candidateQual && interviewerQual && candidateQual === interviewerQual) {
    educationalAlignment += 3;
    matchingAreas.add('Same qualification field');
  }
  
  // Normalize scores
  educationalAlignment = Math.min(10, Math.max(1, educationalAlignment));
  skillRelevance = Math.min(10, Math.max(1, skillRelevance));
  const overallCompatibility = Math.round((educationalAlignment + skillRelevance) / 2);
  
  // Ensure we have some content
  if (matchingAreas.size === 0) {
    matchingAreas.add('General technical background');
  }
  if (interviewFocus.size === 0) {
    if (skillRelevance >= 7) {
      interviewFocus.add('Advanced technical concepts');
    } else if (skillRelevance >= 5) {
      interviewFocus.add('Technical fundamentals');
    } else {
      interviewFocus.add('General programming knowledge');
    }
  }
  
  return {
    educationalAlignment,
    skillRelevance,
    overallCompatibility,
    matchingAreas: Array.from(matchingAreas).slice(0, 5),
    interviewFocus: Array.from(interviewFocus).slice(0, 5),
    explanation: `AI-powered matching based on educational background (${educationalAlignment}/10) and skill relevance (${skillRelevance}/10)`
  };
}

export function getCompatibilityLevel(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Very Good';
  if (score >= 5) return 'Good';
  if (score >= 3) return 'Fair';
  return 'Poor';
}

export function getCompatibilityColor(score) {
  if (score >= 9) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (score >= 7) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  if (score >= 3) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
}


