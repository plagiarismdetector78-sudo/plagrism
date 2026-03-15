# Interview Platform

A full-stack interview platform with AI-powered features including plagiarism detection, sign language detection, and automated feedback.

## Project Structure

```
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
└── README.md
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your credentials
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Update .env.local with backend URL
npm run dev
```

## Features

- User authentication (login/signup)
- Interview scheduling and management
- Real-time video interviews with WebRTC
- AI-powered answer evaluation
- Plagiarism detection
- Sign language detection
- Automated report generation
- Interview feedback system

## Tech Stack

### Frontend
- Next.js 13
- React 18
- TailwindCSS
- Socket.io Client

### Backend
- Express.js
- PostgreSQL
- Socket.io
- OpenAI API
- Hugging Face API
- TensorFlow.js
