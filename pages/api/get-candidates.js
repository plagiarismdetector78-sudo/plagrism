import { query } from '../../lib/db';
import { analyzeProfileMatch, getCompatibilityLevel, getCompatibilityColor } from '../../lib/gemini'; // Changed to use gemini

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  
  try {
    const { interviewerId } = req.query;
    
    // Get complete candidate profiles
    const candidatesQuery = `
      SELECT u.id, u.email, u.role,
        COALESCE(NULLIF(p.full_name,''),'Unnamed') AS full_name,
        COALESCE(NULLIF(p.phone,''),'N/A') AS phone,
        p.qualification, p.recent_studied, p.gender, p.bio
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.role='candidate'
      AND p.full_name IS NOT NULL 
      AND p.full_name != ''
      AND p.phone IS NOT NULL 
      AND p.phone != ''
      AND p.qualification IS NOT NULL 
      AND p.qualification != ''
      AND p.recent_studied IS NOT NULL 
      AND p.recent_studied != ''
      AND p.gender IS NOT NULL 
      AND p.gender != ''
    `;

    const candidatesResult = await query(candidatesQuery);
    let candidates = candidatesResult.rows;

    // If interviewerId is provided, perform AI matching with Gemini
    if (interviewerId && candidates.length > 0) {
      // Get interviewer profile
      const interviewerQuery = `
        SELECT qualification, recent_studied, bio 
        FROM user_profiles 
        WHERE user_id = $1
      `;
      const interviewerResult = await query(interviewerQuery, [interviewerId]);
      
      if (interviewerResult.rows.length > 0) {
        const interviewerProfile = interviewerResult.rows[0];
        
        // Check if interviewer has enough profile data for meaningful matching
        const hasInterviewerData = interviewerProfile.qualification || 
                                 interviewerProfile.recent_studied || 
                                 interviewerProfile.bio;
        
        if (hasInterviewerData) {
          console.log(`🔍 Analyzing ${candidates.length} candidates with Gemini AI...`);
          
          // Analyze matches for each candidate using Gemini
          const candidatesWithMatches = await Promise.all(
            candidates.map(async (candidate) => {
              try {
                const candidateProfile = {
                  qualification: candidate.qualification || '',
                  recentStudied: candidate.recent_studied || '',
                  bio: candidate.bio || ''
                };

                const interviewerProfileData = {
                  qualification: interviewerProfile.qualification || '',
                  recentStudied: interviewerProfile.recent_studied || '',
                  bio: interviewerProfile.bio || ''
                };

                // Use Gemini AI for matching analysis
                const matchAnalysis = await analyzeProfileMatch(candidateProfile, interviewerProfileData);
                
                console.log(`✅ Gemini analysis completed for candidate ${candidate.id}: ${matchAnalysis.overallCompatibility}/10`);
                
                return {
                  ...candidate,
                  matchScore: matchAnalysis.overallCompatibility,
                  compatibilityLevel: getCompatibilityLevel(matchAnalysis.overallCompatibility),
                  compatibilityColor: getCompatibilityColor(matchAnalysis.overallCompatibility),
                  matchingAreas: matchAnalysis.matchingAreas || ['General technical background'],
                  interviewFocus: matchAnalysis.interviewFocus || ['Technical fundamentals'],
                  matchExplanation: matchAnalysis.explanation || 'AI analysis completed with Gemini',
                  hasBio: !!(candidate.bio && candidate.bio.trim() !== ''),
                  analysisSource: 'gemini-ai'
                };
              } catch (error) {
                console.error(`❌ Gemini analysis failed for candidate ${candidate.id}:`, error.message);
                // Return candidate with fallback matching info
                return {
                  ...candidate,
                  matchScore: 5,
                  compatibilityLevel: 'Good',
                  compatibilityColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                  matchingAreas: ['General technical background'],
                  interviewFocus: ['Technical fundamentals'],
                  matchExplanation: 'AI matching temporarily unavailable',
                  hasBio: !!(candidate.bio && candidate.bio.trim() !== ''),
                  analysisSource: 'fallback'
                };
              }
            })
          );

          // Sort by match score (descending)
          candidates = candidatesWithMatches.sort((a, b) => b.matchScore - a.matchScore);
          console.log(`🎯 Sorted ${candidates.length} candidates by Gemini AI compatibility scores`);
        } else {
          // Interviewer doesn't have enough profile data
          console.log('⚠️ Interviewer profile incomplete, using basic matching');
          candidates = candidates.map(candidate => ({
            ...candidate,
            matchScore: 5,
            compatibilityLevel: 'Good',
            compatibilityColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            matchingAreas: ['General technical background'],
            interviewFocus: ['Technical fundamentals'],
            matchExplanation: 'Complete interviewer profile for AI matching',
            hasBio: !!(candidate.bio && candidate.bio.trim() !== ''),
            analysisSource: 'basic'
          }));
        }
      }
    } else {
      // No interviewer ID provided or no candidates
      console.log('ℹ️ No interviewer ID provided, using basic candidate list');
      candidates = candidates.map(candidate => ({
        ...candidate,
        matchScore: 5,
        compatibilityLevel: 'Good',
        compatibilityColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        matchingAreas: ['General technical background'],
        interviewFocus: ['Technical fundamentals'],
        matchExplanation: 'Standard matching applied',
        hasBio: !!(candidate.bio && candidate.bio.trim() !== ''),
        analysisSource: 'basic'
      }));
    }

    return res.json({ 
      success: true, 
      candidates,
      message: candidates.length > 0 ? `Found ${candidates.length} candidates` : 'No candidates found',
      matchingEngine: candidates[0]?.analysisSource || 'basic'
    });
  } catch (err) {
    console.error('❌ Error in get-candidates API:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message,
      candidates: []
    });
  }
}