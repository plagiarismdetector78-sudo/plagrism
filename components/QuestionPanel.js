import { useState, useEffect, useRef } from 'react';

export default function QuestionPanel({
    userRole,
    currentQuestion,
    questions,
    currentQuestionIndex,
    onStartTest,
    testStarted,
    questionCategory,
    loadingQuestions,
    plagiarismScore,
    plagiarismDetails,
    isCheckingPlagiarism,
    transcript, // This will be currentAnswer now
    transcriptionEnabled,
    onNextQuestion,
    onPreviousQuestion,
    onCheckPlagiarism,
    onLoadQuestions,
    onCategoryChange,
    showPanel,
    onTogglePanel
}) {
    const categories = [
        'Computer Science',
        'Software Engineering',
        'Cyber Security',
        'Data Science',
        'Web Development'
    ];

    const transcriptRef = useRef(null);

    // Auto-scroll transcript
    // 
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const hasPlagResults = plagiarismScore !== null || (userRole === 'interviewer' && transcript && transcript.length > 0);

    return (
        <div className={`fixed left-0 right-0 z-40 transition-all duration-500 ease-in-out ${showPanel ? 'bottom-12 translate-y-0' : 'bottom-12 translate-y-full'
            }`}>
            {/* Enhanced Glassmorphism Container */}
            <div className="bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95 backdrop-blur-3xl border-t border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] h-[60vh] max-h-[600px] flex flex-col w-full relative overflow-hidden">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

                {/* Main Content Flex - Full Width */}
                <div className="flex-1 overflow-hidden px-6 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 relative z-10 min-h-0">
                    <div className="flex gap-6 h-full w-full min-h-0">

                        {/* LEFT: Categories (Interviewer Only) */}
                        {userRole === 'interviewer' && (
                            <div className="flex-shrink-0 w-72 lg:w-80 xl:w-96 flex flex-col h-full">
                                <div className="bg-gradient-to-b from-black/30 to-black/20 rounded-2xl border border-white/10 p-5 h-full flex flex-col backdrop-blur-md hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/20">
                                    <div className="flex items-center space-x-2 mb-5">
                                        <i className="fas fa-layer-group text-purple-400 text-sm"></i>
                                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Knowledge Domains</h4>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => onCategoryChange(cat)}
                                                className={`w-full text-left px-5 py-3.5 rounded-xl text-sm transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                                                    questionCategory === cat
                                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 scale-[1.02]'
                                                        : 'text-gray-400 hover:bg-white/10 hover:text-white hover:scale-[1.01] border border-white/5'
                                                }`}
                                            >
                                                <span className="relative z-10 font-semibold flex items-center space-x-2">
                                                    {questionCategory === cat && <i className="fas fa-check-circle text-xs"></i>}
                                                    <span>{cat}</span>
                                                </span>
                                                {questionCategory === cat && (
                                                    <i className="fas fa-arrow-right text-xs relative z-10 animate-pulse"></i>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={onLoadQuestions}
                                        disabled={loadingQuestions}
                                        className="mt-4 w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingQuestions ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                <span>Loading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-sync-alt"></i>
                                                <span>Load New Bank.</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CENTER: Question & Transcript */}
                        <div className="flex-1 flex flex-col h-full space-y-4 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                            {currentQuestion ? (
                                <div className="bg-gradient-to-br from-black/30 via-black/20 to-black/30 rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col relative overflow-visible group hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/20">
                                    {/* Enhanced Ambient Glow */}
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32 animate-pulse opacity-20"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-24 -mb-24 opacity-20"></div>

                                    {/* Question Header */}
                                    <div className="flex items-center space-x-3 mb-4 relative z-30 flex-shrink-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                                            <i className="fas fa-question text-purple-400"></i>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Current Question</h5>
                                            <p className="text-[10px] text-gray-400">Read carefully and provide your answer</p>
                                        </div>
                                    </div>

                                    {/* Question Text - Made more visible with fixed max height */}
                                    <div className="flex-1 overflow-y-auto pr-4 relative z-30 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent bg-black/30 rounded-lg p-5 border border-white/10">
                                        {currentQuestion?.questiontext ? (
                                            <h3 className="text-base md:text-lg lg:text-xl font-bold text-white leading-relaxed tracking-tight break-words drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                                {currentQuestion.questiontext}
                                            </h3>
                                        ) : currentQuestion?.question ? (
                                            <h3 className="text-base md:text-lg lg:text-xl font-bold text-white leading-relaxed tracking-tight break-words drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                                {currentQuestion.question}
                                            </h3>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-400 text-sm">No question text available</p>
                                                <p className="text-gray-500 text-xs mt-2">Question object: {JSON.stringify(currentQuestion).substring(0, 100)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Controls - Interviewer Only */}
                                    {userRole === 'interviewer' && (
                                        <div className="mt-4 pt-5 border-t border-white/10 flex items-center justify-between relative z-30 flex-shrink-0">
                                            <button 
                                                onClick={onPreviousQuestion} 
                                                disabled={currentQuestionIndex === 0} 
                                                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                                            >
                                                <i className="fas fa-arrow-left text-sm"></i>
                                            </button>

                                            <span className="text-gray-400 text-sm font-medium">
                                                Question {currentQuestionIndex + 1} of {questions.length}
                                            </span>

                                            <button 
                                                onClick={onNextQuestion} 
                                                disabled={currentQuestionIndex >= questions.length - 1} 
                                                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                                            >
                                                <i className="fas fa-arrow-right text-sm"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full bg-gradient-to-br from-black/30 to-black/20 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 group hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-900/20">
                                            <i className="fas fa-code text-4xl text-purple-400 group-hover:text-purple-300 transition-colors"></i>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                            Ready for Questions
                                        </h3>
                                        <p className="text-gray-400 max-w-md mx-auto text-base leading-relaxed">
                                            {userRole === 'interviewer'
                                                ? 'Select a technical domain from the sidebar to load the question bank.'
                                                : 'Please wait while the interviewer selects the next question.'}
                                        </p>
                                        {userRole === "interviewer" && !currentQuestion  && (
  <button
    onClick={onStartTest}
    className="mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold uppercase tracking-widest shadow-lg transition-all hover:scale-105"
  >
    Start Test
  </button>
)}

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Enhanced Analysis (Conditional) - ONLY show when analysis is complete */}
                        {plagiarismScore !== null && (
                                <div className="flex-shrink-0 w-80 lg:w-96 xl:w-[28rem] flex flex-col h-full animate-in slide-in-from-right duration-500 min-h-0">
                                    <div className="bg-gradient-to-br from-black/30 via-black/20 to-black/30 rounded-2xl border border-white/10 p-6 h-full flex flex-col backdrop-blur-md relative overflow-y-auto shadow-xl shadow-black/20 hover:border-white/20 transition-all duration-300 scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-transparent">
                                        {/* Background Glow */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32"></div>

                                        {plagiarismScore !== null ? (
                                            <>
                                                {/* Enhanced Score Header */}
                                                <div className="text-center mb-6 relative z-10 flex-shrink-0">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <i className="fas fa-chart-line text-gray-400 text-xs"></i>
                                                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Similarity Score</span>
                                                        </div>
                                                        <div className={`text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br drop-shadow-lg ${
                                                            plagiarismScore >= 80 
                                                                ? 'from-green-400 via-emerald-500 to-emerald-600' 
                                                                : plagiarismScore >= 40 
                                                                    ? 'from-yellow-400 via-orange-500 to-orange-600' 
                                                                    : 'from-red-400 via-rose-500 to-rose-600'
                                                        }`}>
                                                            {plagiarismScore}%
                                                        </div>
                                                        <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            plagiarismScore >= 80 
                                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                                : plagiarismScore >= 40 
                                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                                                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                        }`}>
                                                            {plagiarismScore >= 80 ? 'High Originality' : plagiarismScore >= 40 ? 'Moderate' : 'Low Originality'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Enhanced Progress Visual */}
                                                <div className="w-full h-2.5 bg-white/5 rounded-full mb-6 overflow-hidden border border-white/10 flex-shrink-0">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out relative shadow-lg ${
                                                            plagiarismScore >= 80 
                                                                ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                                                : plagiarismScore >= 40 
                                                                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500' 
                                                                    : 'bg-gradient-to-r from-rose-500 to-red-500'
                                                        }`}
                                                        style={{ width: `${plagiarismScore}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] rounded-full"></div>
                                                    </div>
                                                </div>

                                                {/* Enhanced AI Insight */}
                                                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 mb-5 border border-white/10 relative group hover:bg-white/15 transition-all duration-300 shadow-lg flex-shrink-0">
                                                    <div className="absolute top-4 left-4">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                                                            <i className="fas fa-robot text-purple-400 text-xs"></i>
                                                        </div>
                                                    </div>
                                                    <div className="pl-10">
                                                        <p className="text-sm text-gray-200 italic leading-relaxed font-medium mb-2">
                                                            "{plagiarismDetails?.interpretation}"
                                                        </p>
                                                        {plagiarismDetails?.details?.evaluationType && (
                                                            <span className="inline-flex items-center space-x-1 text-[10px] text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                                                                <i className="fas fa-sparkles"></i>
                                                                <span>{plagiarismDetails.details.evaluationType}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Enhanced Metrics Grid - Now showing AI scores */}
                                                <div className="grid grid-cols-4 gap-3 mb-5 flex-shrink-0">
                                                    {[
                                                        { l: 'Accuracy', v: plagiarismDetails?.details?.scores?.accuracy || plagiarismDetails?.breakdown?.semanticSimilarity, c: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', i: 'fa-bullseye' },
                                                        { l: 'Complete', v: plagiarismDetails?.details?.scores?.completeness || plagiarismDetails?.breakdown?.keywordMatch, c: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', i: 'fa-check-double' },
                                                        { l: 'Understanding', v: plagiarismDetails?.details?.scores?.understanding || plagiarismDetails?.breakdown?.conceptCoverage, c: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/20', border: 'border-emerald-500/30', i: 'fa-brain' },
                                                        { l: 'Clarity', v: plagiarismDetails?.details?.scores?.clarity || 0, c: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/20', border: 'border-amber-500/30', i: 'fa-star' }
                                                    ].map((stat, i) => (
                                                        <div key={i} className={`bg-gradient-to-br ${stat.bg} rounded-xl p-3 text-center border ${stat.border} hover:border-opacity-50 transition-all duration-300 group hover:scale-105 shadow-lg`}>
                                                            <div className={`w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                                                                <i className={`fas ${stat.i} ${stat.c} text-xs`}></i>
                                                            </div>
                                                            <div className={`text-lg font-bold ${stat.c} mb-1`}>{Math.round(stat.v)}%</div>
                                                            <div className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">{stat.l}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* AI Feedback Section */}
                                                {plagiarismDetails?.details?.feedback && (
                                                    <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/10 flex-shrink-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <i className="fas fa-comment-dots text-blue-400 text-xs"></i>
                                                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">AI Feedback</span>
                                                        </div>
                                                        <p className="text-xs text-gray-300 leading-relaxed">{plagiarismDetails.details.feedback}</p>
                                                    </div>
                                                )}

                                                {/* Strengths & Weaknesses */}
                                                {(plagiarismDetails?.details?.strengths?.length > 0 || plagiarismDetails?.details?.weaknesses?.length > 0) && (
                                                    <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
                                                        {plagiarismDetails?.details?.strengths?.length > 0 && (
                                                            <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <i className="fas fa-check-circle text-green-400 text-xs"></i>
                                                                    <span className="text-[10px] uppercase tracking-wider text-green-400 font-semibold">Strengths</span>
                                                                </div>
                                                                <ul className="space-y-1">
                                                                    {plagiarismDetails.details.strengths.slice(0, 2).map((s, i) => (
                                                                        <li key={i} className="text-[10px] text-gray-300 leading-relaxed">• {s}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {plagiarismDetails?.details?.weaknesses?.length > 0 && (
                                                            <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/30">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <i className="fas fa-exclamation-circle text-orange-400 text-xs"></i>
                                                                    <span className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold">Areas to Improve</span>
                                                                </div>
                                                                <ul className="space-y-1">
                                                                    {plagiarismDetails.details.weaknesses.slice(0, 2).map((w, i) => (
                                                                        <li key={i} className="text-[10px] text-gray-300 leading-relaxed">• {w}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Enhanced Keyword Cloud */}
                                                <div className="flex-shrink-0 flex flex-col relative z-10 min-h-0">
                                                    <div className="flex items-center space-x-2 mb-3 flex-shrink-0">
                                                        <i className="fas fa-tags text-gray-400 text-xs"></i>
                                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Matched Concepts</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pb-2">
                                                        {plagiarismDetails?.details?.matchedKeywords?.map((k, i) => (
                                                            <span key={i} className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 font-semibold hover:scale-105 transition-transform cursor-default shadow-sm">
                                                                #{k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center mb-5 animate-pulse shadow-lg shadow-blue-900/20">
                                                    <i className="fas fa-waveform text-3xl text-blue-400"></i>
                                                </div>
                                                <h4 className="text-base font-bold text-gray-300 mb-2">Analysis Pending</h4>
                                                <p className="text-sm text-gray-500">Processing answer data...</p>
                                                <div className="mt-4 flex space-x-1">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
        
    );

}