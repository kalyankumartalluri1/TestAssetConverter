# Test Asset Converter - AI-Powered Test Automation

## Overview

Test Asset Converter is a web application that transforms manual test cases into automated test scripts using AI. The application accepts Excel files containing manual test cases and converts them into executable automation scripts for various frameworks (primarily Eggplant SenseTalk). Users configure their AI provider (OpenAI or Perplexity), upload test case files, preview the parsed data, and receive converted automation scripts ready for download.

The application follows a workflow-first design approach inspired by Linear and VS Code, emphasizing clarity and functional efficiency for developer productivity tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query for server state management
- Tailwind CSS with shadcn/ui component library

**Design System:**
- Custom design system based on Linear + VS Code aesthetics
- Typography: Inter (UI) and JetBrains Mono (code/technical)
- Consistent spacing using Tailwind units (2, 4, 6, 8)
- Component library: Full shadcn/ui integration with Radix UI primitives

**Component Structure:**
- Single-page application with a vertical stepper/wizard workflow
- Main converter page orchestrates 5-step conversion process:
  1. AI Provider Configuration (provider selection, API key, agent selection)
  2. File Upload (Excel file with test cases)
  3. Input Preview (parsed test cases in table format)
  4. Conversion Progress (real-time conversion status)
  5. Output Preview (converted scripts with download capability)

**State Management:**
- Local component state for workflow progression
- TanStack Query for API communication
- No global state management needed for MVP

### Backend Architecture

**Technology Stack:**
- Node.js with Express
- TypeScript with ESM modules
- Separate development and production server configurations

**API Design:**
- RESTful endpoint: `POST /api/convert`
- Single conversion endpoint handles the entire transformation pipeline
- Request validation using Zod schemas
- Response includes success status and array of converted files

**AI Integration Service (`AIConverter`):**
- Abstraction layer for multiple AI providers (OpenAI, Perplexity)
- OpenAI integration using official SDK (gpt-5 model)
- Perplexity integration via HTTP API
- Per-test-case conversion with customizable agent instructions
- Prompt construction combines agent instructions with test case data

**File Processing:**
- Client-side Excel parsing using XLSX library
- Expected format: Test ID, Test Name, Steps, Expected Results
- Server receives parsed test cases as JSON

### Data Storage Solutions

**Current Implementation:**
- No persistent storage for MVP
- In-memory processing only
- Storage interface defined for future features (conversion history, custom agents)

**Planned Architecture:**
- Drizzle ORM configured for PostgreSQL
- Neon serverless database integration ready
- Schema and migration setup present but unused in current MVP

### Authentication and Authorization

**Current State:**
- No authentication system implemented
- API keys provided per-request by users
- Session management infrastructure present (connect-pg-simple) but unused

**Design Decision:**
- User-provided API keys eliminate need for secure storage
- Stateless conversion requests
- Future enhancement: user accounts for history and custom agents

### External Service Integrations

**AI Providers:**
- OpenAI API: Primary AI provider, using GPT-5 model for script generation
- Perplexity API: Alternative AI provider option
- Provider selection abstracted in AIConverter service

**File Processing:**
- SheetJS (XLSX): Client-side Excel file parsing
- Supports .xlsx and .xls formats
- Validates expected column structure

**UI Components:**
- Radix UI: Headless component primitives for accessibility
- shadcn/ui: Pre-styled component library built on Radix
- Lucide React: Icon library

**Utility Libraries:**
- JSZip: Creates downloadable zip archives of converted scripts
- React Dropzone: Drag-and-drop file upload interface
- date-fns: Date formatting utilities

### Conversion Agents

**Agent System:**
- Predefined conversion agents with specific instructions
- Each agent defines output format and conversion methodology
- Example: "SenseTalk Script Writer" agent for Eggplant automation
- Agent instructions emphasize OCR usage, robustness patterns, and best practices

**Agent Configuration:**
- Stored in shared schema as DEFAULT_AGENTS
- Includes: ID, name, description, detailed instructions, output format
- Instructions formatted as markdown for AI consumption

### Build and Deployment

**Development Mode:**
- Vite dev server with HMR
- Express server with middleware mode
- Hot module replacement for React components
- Replit-specific plugins for runtime error overlay and dev tools

**Production Build:**
- Vite builds client to `dist/public`
- esbuild bundles server to `dist/index.js`
- Static file serving from Express
- Single-file server bundle with external packages

**Environment Configuration:**
- DATABASE_URL for future PostgreSQL connection
- NODE_ENV for development/production switching
- Replit-specific environment variables for tooling