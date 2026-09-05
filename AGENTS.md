# Agent Instructions for Skill-Distiller

This file provides guidance for AI coding agents working on the Skill-Distiller project, a React-based web application that distills AI skill profiles from user-uploaded documents using multi-agent LLM analysis.

## Build and Development

- Start development with `npm run dev` (Vite server on port 3000)
- Build for production with `npm run build`
- Preview production build with `npm run preview`
- Type checking via `npm run lint` (tsc --noEmit)

See [README.md](README.md) for local setup and environment configuration.

## Architecture Overview

- **Frontend**: React 19 + TypeScript, Vite build tool, Tailwind CSS v4 styling
- **AI Integration**: OpenAI-compatible `/chat/completions` via raw `fetch` (configurable baseURL) for the multi-agent distillation pipeline
- **Data Flow**: File upload → text extraction → 4-agent LLM analysis → structured profile output
- **State Management**: React hooks (useState); API config and theme persisted in localStorage
- **File Parsing**: DOCX (mammoth), PDF (pdfjs-dist), OCR for images (tesseract.js)

Key components:
- [src/App.tsx](src/App.tsx) - Main app orchestrator and state management
- [src/lib/distill.ts](src/lib/distill.ts) - Distillation engine with 4-agent pipeline
- [src/components/FileUploader.tsx](src/components/FileUploader.tsx) - File intake and processing
- [src/components/DistillProcess.tsx](src/components/DistillProcess.tsx) - Progress UI with animations
- [src/components/SkillProfileView.tsx](src/components/SkillProfileView.tsx) - Export and display results

## Coding Conventions

- Use functional React components with hooks
- Handle errors by normalizing to user-friendly messages
- Fall back to env defaults when Settings is empty: `apiConfig?.apiKey || process.env.OPENAI_API_KEY`, `apiConfig?.model || 'gpt-4o-mini'`
- Support bilingual UI (Chinese/English) via language prop
- Use Lucide React icons and Tailwind utility classes
- Implement motion animations for loaders and progress

## Common Pitfalls

- **CORS Issues**: AI API endpoints may block browser requests; guide users to configure proxies
- **Large Files**: Text >40KB is chunked and summarized, potentially losing nuance
- **API Keys**: Stored unencrypted in localStorage; not for high-security use
- **Document Parsing**: Limited support for complex DOCX/PDF formats; OCR quality varies
- **JSON Synthesis**: LLM may produce invalid JSON; retry logic limited to 3 attempts
- **No Persistence**: Data lost on page refresh; no backend storage

## Key Patterns

- **Multi-agent Synthesis**: Sequential LLM calls combining results (adapt prompts for different tasks)
- **File Normalization**: MIME type detection → text/base64 extraction → unified UploadedFile format
- **Chunking Strategy**: Split large inputs, summarize chunks, merge for final analysis
- **Output Templates**: Generate SKILL.md, README.md, identity/voice docs from profile data

When modifying distillation logic, update prompts in `distillSkill()` and validate output structure. For new file formats, extend handlers in `FileUploader.tsx`.
