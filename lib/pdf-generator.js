// lib/pdf-generator.js
import jsPDF from 'jspdf';

export function generateInterviewReportPDF(reportData) {
    console.log('📝 Generating PDF with data:', {
        questionsCount: reportData.questionsCount,
        questionsAskedLength: reportData.questionsAsked?.length,
        duration: reportData.duration,
        hasEvaluation: !!reportData.evaluation,
        hasAIDetection: !!reportData.evaluation?.aiDetection,
        aiDetectionData: reportData.evaluation?.aiDetection
    });
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Color palette
    const colors = {
        primary: [99, 102, 241], // Indigo
        success: [34, 197, 94], // Green
        warning: [251, 146, 60], // Orange
        danger: [239, 68, 68], // Red
        dark: [17, 24, 39], // Gray-900
        light: [243, 244, 246], // Gray-100
        purple: [168, 85, 247] // Purple
    };

    // Helper function to add new page if needed
    const checkPageBreak = (neededSpace) => {
        if (yPosition + neededSpace > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
            return true;
        }
        return false;
    };

    // Helper function to get score status
    const getScoreStatus = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        return 'Needs Work';
    };

    // Header with solid color background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo/Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-Powered Interview Evaluation', pageWidth / 2, 28, { align: 'center' });
    
    // Report generated date
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 35, { align: 'center' });

    yPosition = 50;

    // Interview Details Section
    doc.setFillColor(...colors.light);
    doc.rect(10, yPosition, pageWidth - 20, 45, 'F');
    
    doc.setTextColor(...colors.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Details', 15, yPosition + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const details = [
        { label: 'Room ID:', value: reportData.roomId || 'N/A' },
        { label: 'Category:', value: reportData.questionCategory || 'N/A' },
        { label: 'Duration:', value: reportData.duration || 'N/A' },
        { label: 'Questions Asked:', value: reportData.questionsCount || reportData.questionsAsked?.length || 0 }
    ];
    
    console.log('📊 PDF Details - Questions Asked:', reportData.questionsCount, 'or', reportData.questionsAsked?.length, '= Final:', details[3].value);
    
    let detailY = yPosition + 18;
    details.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(detail.label, 15, detailY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(detail.value), 55, detailY);
        detailY += 7;
    });

    yPosition += 55;
    checkPageBreak(40);

    // Participants Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text('Participants', 15, yPosition);
    
    yPosition += 10;
    
    // Interviewer
    doc.setFillColor(...colors.light);
    doc.rect(10, yPosition, pageWidth - 20, 15, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Interviewer:', 15, yPosition + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.interviewerName || 'N/A', 15, yPosition + 11);
    doc.text(reportData.interviewerEmail || 'N/A', 80, yPosition + 11);
    
    yPosition += 18;
    
    // Candidate
    doc.setFillColor(255, 255, 255);
    doc.rect(10, yPosition, pageWidth - 20, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate:', 15, yPosition + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.candidateName || 'N/A', 15, yPosition + 11);
    doc.text(reportData.candidateEmail || 'N/A', 80, yPosition + 11);
    
    // Add Candidate ID
    if (reportData.candidateId) {
        doc.setFontSize(8);
        doc.setTextColor(...colors.dark);
        doc.text(`ID: ${reportData.candidateId}`, 15, yPosition + 16);
        doc.setFontSize(10);
    }

    yPosition += 28;
    checkPageBreak(40);

    // Evaluation Score Section
    const evaluation = reportData.evaluation || {};
    const score = evaluation.overallScore || 0;
    
    // Score box
    const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger;
    doc.setFillColor(...scoreColor);
    doc.rect(10, yPosition, pageWidth - 20, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Score', pageWidth / 2, yPosition + 12, { align: 'center' });
    
    doc.setFontSize(24);
    doc.text(`${score}%`, pageWidth / 2, yPosition + 24, { align: 'center' });

    yPosition += 40;
    checkPageBreak(60);

    // Detailed Scores
    doc.setTextColor(...colors.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Metrics', 15, yPosition);
    
    yPosition += 8;
    
    const metrics = [
        { name: 'Accuracy', score: evaluation.accuracy || 0 },
        { name: 'Completeness', score: evaluation.completeness || 0 },
        { name: 'Understanding', score: evaluation.understanding || 0 },
        { name: 'Clarity', score: evaluation.clarity || 0 }
    ];
    
    metrics.forEach((metric, index) => {
        const bgColor = index % 2 === 0 ? colors.light : [255, 255, 255];
        doc.setFillColor(...bgColor);
        doc.rect(10, yPosition, pageWidth - 20, 12, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.name, 15, yPosition + 8);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`${metric.score}%`, pageWidth / 2, yPosition + 8, { align: 'center' });
        
        const status = getScoreStatus(metric.score);
        const statusColor = metric.score >= 80 ? colors.success : metric.score >= 60 ? colors.warning : colors.danger;
        doc.setTextColor(...statusColor);
        doc.text(status, pageWidth - 40, yPosition + 8);
        doc.setTextColor(...colors.dark);
        
        yPosition += 12;
    });

    yPosition += 10;
    checkPageBreak(50);

    // Interpretation
    if (evaluation.interpretation) {
        doc.setFillColor(...colors.light);
        doc.rect(10, yPosition, pageWidth - 20, 25, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Interpretation', 15, yPosition + 8);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const interpretationLines = doc.splitTextToSize(evaluation.interpretation, pageWidth - 30);
        doc.text(interpretationLines, 15, yPosition + 16);
        
        yPosition += 35;
    }

    // Interviewer Decision
    if (evaluation.interviewerDecision) {
        checkPageBreak(30);
        const passed = evaluation.interviewerDecision === 'pass';
        const decisionColor = passed ? colors.success : colors.danger;
        doc.setFillColor(...decisionColor);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Interviewer Decision: ${String(evaluation.interviewerDecision).toUpperCase()}`, 15, yPosition + 6);
        yPosition += 12;

        if (evaluation.interviewerDecisionNote) {
            doc.setTextColor(...colors.dark);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const noteLines = doc.splitTextToSize(`Note: ${evaluation.interviewerDecisionNote}`, pageWidth - 30);
            noteLines.forEach(line => {
                checkPageBreak(8);
                doc.text(line, 15, yPosition);
                yPosition += 6;
            });
            yPosition += 4;
        }
    }

    checkPageBreak(50);

    // Legacy global AI detection / plagiarism block removed.
    // This report is Groq-driven and renders typed AI risk + voice↔typed match per question (and an overall typed summary).

    // Strengths
    if (evaluation.strengths && evaluation.strengths.length > 0) {
        doc.setFillColor(...colors.success);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Strengths', 15, yPosition + 6);
        
        yPosition += 12;
        
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        evaluation.strengths.slice(0, 5).forEach(strength => {
            checkPageBreak(10);
            doc.text(`• ${strength}`, 15, yPosition);
            yPosition += 6;
        });
        
        yPosition += 5;
    }

    checkPageBreak(50);

    // Weaknesses
    if (evaluation.weaknesses && evaluation.weaknesses.length > 0) {
        doc.setFillColor(...colors.warning);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Areas for Improvement', 15, yPosition + 6);
        
        yPosition += 12;
        
        doc.setTextColor(...colors.dark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        evaluation.weaknesses.slice(0, 5).forEach(weakness => {
            checkPageBreak(10);
            doc.text(`• ${weakness}`, 15, yPosition);
            yPosition += 6;
        });
        
        yPosition += 5;
    }

    checkPageBreak(50);

    // Feedback
    if (evaluation.feedback) {
        doc.setFillColor(...colors.light);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        
        doc.setTextColor(...colors.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Feedback', 15, yPosition + 6);
        
        yPosition += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const feedbackLines = doc.splitTextToSize(evaluation.feedback, pageWidth - 30);
        
        feedbackLines.forEach(line => {
            checkPageBreak(8);
            doc.text(line, 15, yPosition);
            yPosition += 6;
        });
    }

    // Question-wise Results
    if (evaluation.questionWiseResults && evaluation.questionWiseResults.length > 0) {
        yPosition += 10;
        checkPageBreak(30);

        doc.setFillColor(...colors.primary);
        doc.rect(10, yPosition, pageWidth - 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Question-wise Similarity Results', 15, yPosition + 6);
        yPosition += 12;

        // Typed-answer summary (overall)
        if (evaluation.typedAiDetection) {
            const t = evaluation.typedAiDetection;
            checkPageBreak(24);
            doc.setTextColor(...colors.dark);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Typed Answer Verification (Overall)', 15, yPosition);
            yPosition += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const summary = [
                `Avg Voice<->Typed match: ${Number.isFinite(t.averageVoiceTypedMatch) ? t.averageVoiceTypedMatch : 0}%`,
                `Typed answers analyzed: ${t.typedAnswersAnalyzed || 0}`,
                `Typed AI high-risk: ${t.typedAiHighRiskCount || 0}`,
                `Typed AI medium-risk: ${t.typedAiMediumRiskCount || 0}`,
                `Avg typed AI confidence: ${t.typedAverageConfidence || 0}%`,
            ];
            summary.forEach((line) => {
                checkPageBreak(8);
                doc.text(line, 15, yPosition);
                yPosition += 5.5;
            });
            yPosition += 4;
        }

        evaluation.questionWiseResults.forEach((item, index) => {
            const qScore = item.score || 0;
            const scoreColor = qScore >= 80 ? colors.success : qScore >= 60 ? colors.warning : colors.danger;

            checkPageBreak(14);
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(10, yPosition, pageWidth - 10, yPosition);
            yPosition += 6;

            doc.setTextColor(...colors.dark);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            const titleLines = doc.splitTextToSize(
                `Q${index + 1}: ${item.questionText || 'Question'}`,
                pageWidth - 55
            );

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const answerRaw = (item.answer || '').trim();
            const typedRaw = (item.typedAnswer || '').trim();
            const voiceTypedMatch = Number.isFinite(item.voiceTypedMatch) ? Math.round(item.voiceTypedMatch) : null;
            const typedAi = item.typedAiDetection || null;
            const matchBreakdown = item.voiceTypedMatchBreakdown || null;
            const matchInterp = (item.voiceTypedMatchInterpretation || '').trim();
            const typedMeta = item.typedMeta || null;

            const answerLines = doc.splitTextToSize(
                answerRaw ? `Spoken: ${answerRaw}` : 'Spoken: (none)',
                pageWidth - 30
            );
            const typedLines = doc.splitTextToSize(
                typedRaw ? `Typed: ${typedRaw}` : 'Typed: (none)',
                pageWidth - 30
            );
            const typedMetaLine = typedMeta
                ? (() => {
                    const activeSec = Math.round(((typedMeta.activeMs || 0) / 1000) * 10) / 10;
                    const chars = String(typedRaw || '').length;
                    const wpm = activeSec > 0 ? Math.round((chars / 5) / (activeSec / 60)) : 0;
                    const pasteFlag = (typedMeta.pasteCount || 0) > 0 || (typedMeta.pastedChars || 0) > 20;
                    return `Typing: ${activeSec}s active | ${wpm} WPM (est) | keystrokes: ${typedMeta.keystrokes || 0} | pastes: ${typedMeta.pasteCount || 0} | pasted chars: ${typedMeta.pastedChars || 0}${pasteFlag ? ' | Paste suspected' : ''}`;
                })()
                : '';
            const typedMetaLines = typedMetaLine ? doc.splitTextToSize(typedMetaLine, pageWidth - 30) : [];
            const metaLine = [
                voiceTypedMatch != null ? `Voice<->Typed: ${voiceTypedMatch}%` : null,
                typedAi && typedAi.confidence != null ? `Typed AI: ${typedAi.label || 'Unknown'} (${typedAi.confidence || 0}%)` : null
            ].filter(Boolean).join(' | ');
            const metaLines = metaLine ? doc.splitTextToSize(metaLine, pageWidth - 30) : [];

            const breakdownLine = matchBreakdown
                ? Object.entries(matchBreakdown)
                    .map(([k, v]) => `${k}: ${Math.round((Number(v) || 0) * 10) / 10}%`)
                    .join(' | ')
                : '';
            const breakdownLines = breakdownLine ? doc.splitTextToSize(breakdownLine, pageWidth - 30) : [];
            const matchInterpLines = matchInterp ? doc.splitTextToSize(matchInterp, pageWidth - 30) : [];

            const typedExtraLines = [];
            if (typedAi && typedAi.pasteSuspected != null) {
                typedExtraLines.push(`Paste suspected: ${typedAi.pasteSuspected ? 'Yes' : 'No'}`);
            }
            if (Array.isArray(typedAi?.reasons) && typedAi.reasons.length > 0) {
                typedExtraLines.push(`Reasons: ${typedAi.reasons.join(' | ')}`);
            }
            const typedExtraWrapped = typedExtraLines.length
                ? doc.splitTextToSize(typedExtraLines.join('\n'), pageWidth - 30)
                : [];

            const lineH = 5.5;
            const titleStartY = yPosition;

            titleLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(...colors.dark);
                doc.text(line, 15, yPosition);
                yPosition += lineH;
            });

            doc.setTextColor(...scoreColor);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            // Right-side headline score (clean + explicit)
            doc.text(`Spoken <-> Expected Answer: ${qScore}%`, pageWidth - 20, titleStartY + lineH * 0.85, { align: 'right' });

            doc.setTextColor(...colors.dark);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            yPosition += 2;
            answerLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.text(line, 15, yPosition);
                yPosition += lineH;
            });

            typedLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.text(line, 15, yPosition);
                yPosition += lineH;
            });

            typedMetaLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.setTextColor(107, 114, 128);
                doc.text(line, 15, yPosition);
                doc.setTextColor(...colors.dark);
                yPosition += lineH;
            });

            metaLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.setTextColor(75, 85, 99); // gray-600
                doc.text(line, 15, yPosition);
                doc.setTextColor(...colors.dark);
                yPosition += lineH;
            });

            breakdownLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.setTextColor(107, 114, 128); // gray-500
                doc.text(line, 15, yPosition);
                doc.setTextColor(...colors.dark);
                yPosition += lineH;
            });

            matchInterpLines.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.setTextColor(107, 114, 128);
                doc.text(line, 15, yPosition);
                doc.setTextColor(...colors.dark);
                yPosition += lineH;
            });

            typedExtraWrapped.forEach((line) => {
                checkPageBreak(lineH + 2);
                doc.setTextColor(107, 114, 128);
                doc.text(line, 15, yPosition);
                doc.setTextColor(...colors.dark);
                yPosition += lineH;
            });

            yPosition += 6;
        });
    }

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Page ${i} of ${pageCount} | Skill Scanner Interview Platform`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        
        // Add candidate ID in footer if available
        if (reportData.candidateId) {
            doc.text(
                `Candidate ID: ${reportData.candidateId}`,
                15,
                pageHeight - 10
            );
        }
    }

    // Return PDF as blob
    return doc.output('blob');
}
