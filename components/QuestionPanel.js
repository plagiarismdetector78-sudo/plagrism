import { useEffect, useRef } from 'react';

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
    typedAnswer,
    onTypedAnswerChange,
    onTypedInputEvent,
    transcriptionEnabled,
    onNextQuestion,
    onPreviousQuestion,
    onCheckPlagiarism,
    onLoadQuestions,
    onCategoryChange,
    availableCategories,
    lockCategorySelection,
    showPanel,
    onTogglePanel,
    isMinimized = false
}) {
    const defaultCategories = [
        'Computer Science',
        'Software Engineering',
        'Cyber Security'
    ];
    const categories =
        Array.isArray(availableCategories) && availableCategories.length > 0
            ? availableCategories
            : defaultCategories;

    const transcriptRef = useRef(null);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const hasPlagResults = plagiarismScore !== null || (userRole === 'interviewer' && transcript && transcript.length > 0);

    return (
        <div className="w-full">
            {/* Main Content */}
            <div className="bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95 backdrop-blur-3xl w-full relative">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

                {/* Main Content */}
                <div className="px-3 pt-3 pb-3 relative z-10">
                    <div className="flex flex-col gap-3 w-full">

                        {/* TOP: Categories (Interviewer Only) */}
                        {userRole === 'interviewer' && (
                            <div className="flex-shrink-0 flex flex-col">
                                <div className="bg-gradient-to-b from-black/30 to-black/20 rounded-xl border border-white/10 p-3 flex flex-col backdrop-blur-md hover:border-white/20 transition-all duration-300">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <i className="fas fa-layer-group text-purple-400 text-xs"></i>
                                        <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Knowledge Domains</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => !lockCategorySelection && onCategoryChange(cat)}
                                                disabled={lockCategorySelection}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] transition-all duration-300 flex items-center space-x-1 ${
                                                    questionCategory === cat
                                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                                                        : lockCategorySelection
                                                            ? 'text-gray-500 border border-white/5 cursor-not-allowed'
                                                            : 'text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                                                }`}
                                            >
                                                {questionCategory === cat && <i className="fas fa-check-circle text-[9px]"></i>}
                                                <span className="font-semibold">{cat}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={onLoadQuestions}
                                        disabled={loadingQuestions}
                                        className="w-full py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingQuestions ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                <span>Loading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-sync-alt"></i>
                                                <span>Load New Bank</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MIDDLE: Question */}
                        <div className="flex flex-col min-w-0">
                            {currentQuestion ? (
                                <div className="bg-gradient-to-br from-black/30 via-black/20 to-black/30 rounded-xl border border-white/10 p-4 md:p-5 flex flex-col relative overflow-visible group hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/20">
                                    {/* Enhanced Ambient Glow */}
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32 animate-pulse opacity-20"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-24 -mb-24 opacity-20"></div>

                                    {/* Question Header */}
                                    <div className="flex items-center space-x-2 mb-2 relative z-30 flex-shrink-0">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                                            <i className="fas fa-question text-purple-400 text-xs"></i>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Current Question</h5>
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="flex-1 overflow-y-auto pr-2 relative z-30 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent bg-black/30 rounded-lg p-3 border border-white/10">
                                        {currentQuestion?.questiontext ? (
                                            <h3 className="text-sm md:text-base font-bold text-white leading-relaxed tracking-tight break-words drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                                {currentQuestion.questiontext}
                                            </h3>
                                        ) : currentQuestion?.question ? (
                                            <h3 className="text-sm md:text-base font-bold text-white leading-relaxed tracking-tight break-words drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                                {currentQuestion.question}
                                            </h3>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-gray-400 text-xs">No question text available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Controls - Interviewer Only */}
                                    {userRole === 'interviewer' && (
                                        <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between relative z-30 flex-shrink-0">
                                            <button 
                                                onClick={onPreviousQuestion} 
                                                disabled={currentQuestionIndex === 0} 
                                                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                                            >
                                                <i className="fas fa-arrow-left text-xs"></i>
                                            </button>

                                            <span className="text-gray-400 text-xs font-medium">
                                                Question {currentQuestionIndex + 1} of {questions.length}
                                            </span>

                                            <button 
                                                onClick={onNextQuestion} 
                                                disabled={currentQuestionIndex >= questions.length - 1} 
                                                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                                            >
                                                <i className="fas fa-arrow-right text-xs"></i>
                                            </button>
                                        </div>
                                    )}

                                    {/* Typed Answer - Candidate Only */}
                                    {userRole !== 'interviewer' && (
                                        <div className="mt-4 pt-5 border-t border-white/10 relative z-30 flex-shrink-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <i className="fas fa-keyboard text-purple-300 text-xs"></i>
                                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Typed Answer</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500">
                                                    {String(typedAnswer || '').length} chars
                                                </span>
                                            </div>
                                            <textarea
                                                value={typedAnswer || ''}
                                                onChange={(e) => onTypedAnswerChange && onTypedAnswerChange(e.target.value)}
                                                onBeforeInput={(e) => {
                                                    const inputType = e?.nativeEvent?.inputType || '';
                                                    if (!onTypedInputEvent) return;
                                                    // IMPORTANT: don't count paste here because onPaste also fires (would double count).
                                                    // Keep this handler for keystrokes and other insertions.
                                                    if (inputType === 'insertFromDrop') {
                                                        onTypedInputEvent({ type: 'paste' });
                                                    } else if (String(inputType).startsWith('insert') && inputType !== 'insertFromPaste') {
                                                        onTypedInputEvent({ type: 'keystroke' });
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    const text = e.clipboardData?.getData('text') || '';
                                                    onTypedInputEvent && onTypedInputEvent({ type: 'paste', insertedTextLength: text.length });
                                                }}
                                                placeholder="Type the same answer you are speaking (recommended)."
                                                rows={4}
                                                className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                            />
                                            <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                                                This helps verify consistency between spoken and typed responses and supports AI-authorship checks in the final report.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full bg-gradient-to-br from-black/30 to-black/20 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 group hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-900/20">
                                            <i className="fas fa-code text-2xl text-purple-400 group-hover:text-purple-300 transition-colors"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            Ready for Questions
                                        </h3>
                                        <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                                            {userRole === 'interviewer'
                                                ? 'Select a technical domain from the sidebar to load the question bank.'
                                                : 'Please wait while the interviewer selects the next question.'}
                                        </p>
                                        {userRole === "interviewer" && !currentQuestion && (
                                            <button
                                                onClick={onStartTest}
                                                className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-widest shadow-lg transition-all hover:scale-105"
                                            >
                                                Start Test
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOTTOM: Analysis results removed for sidebar layout */}
                    </div>
                </div>
            </div>
        </div>
        
    );

}