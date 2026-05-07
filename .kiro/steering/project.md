# Project: AI-Powered Interview Platform (plagrism)

## What This Project Is
A Next.js 13 interview platform that conducts live video interviews with real-time transcription, answer evaluation, and plagiarism/AI-authorship detection. It is a Final Year Project (FYP).

## Tech Stack
- **Framework**: Next.js 13.5.6 (Pages Router)
- **Database**: PostgreSQL via Neon (serverless), accessed through `lib/db.js` using `pg`
- **Auth**: `iron-session` with cookie-based sessions
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO (signaling server at `NEXT_PUBLIC_SIGNALING_SERVER`, default `localhost:4000`)
- **Video**: WebRTC peer-to-peer
- **Transcription**: Groq Whisper (`whisper-large-v3`) via `groq-sdk` — real-time chunked audio
- **Embeddings / AI Evaluation**: Hugging Face Inference API (`@huggingface/inference`)
  - Model: `sentence-transformers/all-MiniLM-L6-v2` for semantic embeddings + cosine similarity
  - Model: `Hello-SimpleAI/chatgpt-detector-roberta` for AI content detection
- **Profile Matching**: Google Gemini (`gemini-1.5-flash`) via `lib/ai-answer-evaluation.js` and `lib/gemini.js`
- **PDF Reports**: `jspdf` + `jspdf-autotable`
- **Sign Language Detection**: TensorFlow.js (`@tensorflow/tfjs`) via `lib/sign-language-detection.js`

## Roles
- **Interviewer**: Controls questions, navigates question bank, triggers report generation
- **Candidate**: Answers questions via speech (transcribed) and/or typed input

## Key Features & How They Work

### 1. Real-Time Transcription
- Audio is recorded in 12-second chunks via `MediaRecorder` in `pages/meeting/[roomId].js`
- Each chunk is sent to `/api/transcribe-realtime` which calls Groq Whisper
- Transcripts are tagged per question using `[[qid=X]]` encoding
- Both spoken (transcribed) and typed answers are tracked separately per question

### 2. Answer Evaluation (Primary System)
- **Endpoint**: `/api/calculate-plagiarism`
- **Flow**: Fetches question + expected answers from DB → calls `evaluateAnswerWithHuggingFace()` in `lib/huggingface-evaluation.js`
- **Method**: Sentence embeddings (all-MiniLM-L6-v2) → cosine similarity → blended with concept coverage and length analysis
- **Scoring weights**: Semantic similarity 40% + Concept completeness 30% + Understanding 20% + Clarity 10%
- Evaluates against ALL expected answers for a question, keeps the highest score
- Falls back to Jaccard/TF-IDF word matching if HF API fails

### 3. AI Content Detection (Secondary / Advisory Signal)
- **Model**: `Hello-SimpleAI/chatgpt-detector-roberta`
- **Critical Limitation**: This model is trained on written text. Transcribed speech destroys AI-text patterns (filler words, broken grammar, transcription errors). It will almost always return "Human" for transcribed answers — this is an **open NLP research problem with no current solution**.
- **How we address it**: AI detection is NOT the primary signal. It is advisory only. A suspiciously high cosine similarity score (90-100%) against the expected answer is itself the red flag for memorized/AI answers.

### 4. Spoken vs Typed Answer Comparison
- Candidates can both speak AND type their answer simultaneously
- `questionTranscriptMap` stores spoken (transcribed) answers per question ID
- `questionTypedMap` stores typed answers per question ID
- `questionTypedMetaMap` tracks typing behavior metadata: `firstInputAt`, `lastInputAt`, `activeMs`, `keystrokes`, `pasteCount`, `pastedChars`, `changeCount`
- This metadata is used in the final report to flag suspicious patterns (e.g., high paste count, very fast typing, typed answer much longer than spoken)
- The typed answer is shown in `QuestionPanel.js` with a textarea for candidates

### 5. Internal Similarity (Not External Plagiarism)
- We do NOT use external plagiarism tools like Copyleaks
- **Why**: Transcribed speech is too different from written internet sources — paraphrasing, informal language, and transcription errors break text matching thresholds
- **What we use instead**: Cosine similarity against our own expected answers stored in the DB (`expectedanswers` table)
- This is more meaningful for interviews: we care about "did the candidate understand the concept", not "did they copy from the internet"

## Known Limitations & How We Address Them

### Limitation 1 — AI Detection on Transcribed Text
- **Problem**: AI detectors trained on written text fail on transcribed speech (always says "Human")
- **Status**: Open NLP research problem, no fix exists
- **Our approach**: Use high cosine similarity (90-100%) as the red flag instead. Natural human answers score 50-75%.

### Limitation 2 — External Plagiarism Tools Don't Work on Speech
- **Problem**: Copyleaks-style tools match against internet sources; transcribed speech breaks text matching
- **Our approach**: Internal similarity scoring against our own DB expected answers

### Limitation 3 — Single Reference Answer is Too Narrow
- **Problem**: One expected answer may penalize correct but differently-phrased responses
- **Our approach**: Score is a guide, not a verdict. Interviewer sees score + transcript and makes final judgment. Score assists, doesn't replace human judgment.

## What Cosine Similarity Does Well
- Detects completely wrong answers (score < 30%)
- Detects partially correct answers (40-60%)
- Confirms strong answers (70%+)
- Works on messy transcribed text (compares meaning, not exact words)
- No external API needed — runs against our own DB

## Database Tables (Key Ones)
- `questions` — question bank with `questiontext`, `category`
- `expectedanswers` — expected answers with `questionid`, `answertext`, `iscorrect`
- `interviewresponses` — stores `interviewid`, `questionid`, `transcribedanswer`, `plagiarismscore`, `audiofileurl`
- `interviews` / scheduled interviews — linked by `meeting_room_id`
- `plagiarism_checks` — stores plagiarism check results per user

## Environment Variables Needed
- `HUGGINGFACE_API_KEY` — for embeddings + AI detection
- `GROQ_API_KEY` — for Whisper transcription
- `GEMINI_API_KEY` — for profile matching and answer evaluation fallback
- `NEXT_PUBLIC_SIGNALING_SERVER` — Socket.IO signaling server URL
- Database connection vars for Neon PostgreSQL

## Project Structure
- `pages/` — Next.js pages (Pages Router)
- `pages/api/` — API routes
- `pages/meeting/[roomId].js` — Main interview room (3000+ lines, core of the app)
- `components/QuestionPanel.js` — Question display + typed answer input + similarity score display
- `lib/huggingface-evaluation.js` — Core evaluation logic (embeddings + AI detection)
- `lib/plagiarism.js` — TF-IDF cosine similarity fallback
- `lib/ai-answer-evaluation.js` — Gemini-based evaluation
- `lib/gemini.js` — Profile compatibility matching
- `styles/` — Global CSS + animated background

## Current State (as of last session)
- ✅ Real-time transcription working (Groq Whisper)
- ✅ Sentence embedding evaluation working (HF all-MiniLM-L6-v2 + cosine similarity)
- ✅ Expected answers stored in DB and used for comparison
- ✅ Spoken vs typed answer tracking implemented with behavioral metadata
- ✅ AI detection integrated as advisory signal (with known limitation documented)
- ✅ Internal similarity scoring (not external plagiarism tools)
- ✅ Report generation with PDF export
- ✅ Interviewer feedback system
- ✅ Sign language detection (TensorFlow.js)
- ✅ Scheduled interview system with room-based joining
