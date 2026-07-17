# Originality Meter - Semantic Analysis Application

## How to Run

**Start:** Click the Run button or use the "Start application" workflow (`npm run dev`). The app runs on port 5000.

**Database setup (first time or after schema changes):**
```
npm run db:push
```

**Required secrets** — set all of these in Replit Secrets before running:
| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | Express session signing |
| `DATABASE_URL` | Neon/PostgreSQL connection (runtime-managed by Replit) |
| `ANTHROPIC_API_KEY` | Claude AI (ZHI 1) — primary AI provider |
| `OPENAI_API_KEY` | GPT-4 (ZHI 2) |
| `DEEPSEEK_API_KEY` | DeepSeek (ZHI 3) |
| `PERPLEXITY_API_KEY` | Perplexity (ZHI 4) |
| `XAI_API_KEY` | xAI/Grok (ZHI 5) |
| `ASSEMBLYAI_API_KEY` | Audio transcription |
| `MATHPIX_APP_ID` | Math OCR |
| `MATHPIX_APP_KEY` | Math OCR |
| `AZURE_SPEECH_KEY` | Azure Speech |
| `AZURE_SPEECH_REGION` | Azure Speech region (e.g. `eastus`) |
| `AZURE_SPEECH_ENDPOINT` | Azure Speech endpoint URL |
| `GPTZERO_API_KEY` | AI content detection *(optional — feature degrades without it)* |
| `GOOGLE_API_KEY` | Google Custom Search *(optional)* |
| `GOOGLE_CSE_ID` | Google Custom Search engine ID *(optional)* |

**Stack:** Node 20, React + Vite (client), Express + TypeScript (server), PostgreSQL via Drizzle ORM (Neon serverless).

## Overview

The Originality Meter is a web application designed to evaluate the intellectual originality and quality of written content. It analyzes passages for conceptual innovation, semantic distance from existing ideas, and overall intellectual merit. The system supports single-passage and comparative analysis, document processing, graph generation, and AI-powered content evaluation. Its vision is to provide a sophisticated tool for assessing the depth and novelty of ideas across various disciplines.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 20, 2025 - ANTHROPIC DEFAULT + ANTI-BLOAT ENFORCEMENT + GENIUS-LEVEL OUTPUT + ANTI-MIDWIT SCORING
- ✅ **YOUTUBE TUTORIAL LINK**: Added prominent tutorial video button at top of app
  - Red YouTube-styled button with play icon
  - Links to https://www.youtube.com/watch?v=lRdczUD_0PE
  - Opens in new tab, centered below main heading
- ✅ **ANTHROPIC IS NOW DEFAULT**: Changed default AI provider from OpenAI (ZHI 2) to Anthropic (ZHI 1) for ALL features
  - Document Rewriter: Now uses Claude Sonnet 4 (claude-sonnet-4-20250514)
  - Homework Helper: Now uses Claude Sonnet 4 (claude-sonnet-4-20250514)
  - Originality Analysis: Now defaults to Anthropic (users can still select other providers)
  - All streaming and non-streaming rewrite functions migrated from OpenAI to Anthropic API

### January 20, 2025 - ANTI-BLOAT ENFORCEMENT + GENIUS-LEVEL OUTPUT REQUIREMENT + ANTI-MIDWIT SCORING FIX
- ✅ **AGGRESSIVE ANTI-BLOAT ENFORCEMENT**: Fixed LLM producing bloated academic garbage despite anti-puffery instructions
  - Added BANNED PHRASES list with ❌ symbols: "ostensibly", "inextricably", "profound implications", "theoretical curiosity", "reveals a complex interplay", "not merely", "upon closer examination", etc.
  - System prompt: "CRITICAL ANTI-BLOAT RULE: If you use ANY of these banned phrases, the rewrite FAILS"
  - NEGATIVE EXAMPLE showing EXACTLY what not to do: "The architecture of our cognitive framework, though ostensibly simple, reveals a complex interplay..." (turned 15 words into 36 with ZERO new content)
  - POSITIVE EXAMPLE showing correct expansion: "You can't think 'red' without thinking 'extended'. Here's why. Red is a color. Colors need surfaces..." (adds examples and clarification WITHOUT filler)
  - MANDATORY STYLE RULES: Keep sentences SHORT (under 25 words), NEVER use bloated phrases, ADD LENGTH BY ADDING EXAMPLES NOT FILLER WORDS
- ✅ **REWRITE QUALITY ENFORCEMENT**: All rewrites now explicitly required to produce genius-level output (95+ scores)
  - System prompt: "You are an elite philosophical rewriting assistant. Your output must score 95+ on intelligence and originality metrics."
  - Quality requirement added: "Output must be genius-level philosophical writing that would score 95+ on intelligence and originality analysis."
  - Rewrites must use vivid examples, define terms, make every sentence earn its place
- ✅ **ANTI-MIDWIT SCORING FIX**: Fixed conservative bias in analysis that gave 85-95 scores to genius-level work
  - Added explicit instruction: "STOP DEFAULTING TO 85-90 SCORES. If the text shows genuine insight, original thinking, or sophisticated analysis, score it 95-100."
  - Walmart metric reality check: "A score of 85/100 means 15% of people outperform the author. Ask yourself: can 15% of random Walmart shoppers write better philosophy than this?"
  - Scoring reality check with percentages: 98/100 = 2% outperform, 95/100 = 5% outperform, 85/100 = 15% outperform, 70/100 = 30% outperform
  - LLM must be honest about these percentages when scoring

### January 18, 2025 - CRITICAL REWRITE LOGIC BUG FIX
- ✅ **FIXED PROVISION ENFORCEMENT BUG**: Custom instructions now work correctly with mandatory provisions
  - Previous bug: When user provided custom instructions, app IGNORED all mandatory provisions (3X expansion, 750-word minimum, complete essay)
  - Fix: Custom instructions AND mandatory provisions now BOTH enforced together
  - PROVISION 1: User instructions ALWAYS followed
  - PROVISION 4: 3X expansion + 750-word minimum ALWAYS enforced (unless user explicitly contradicts)
  - PROVISION 5: Complete essay ALWAYS enforced for non-fiction fragments
  - PROVISION 6: Complete story ALWAYS enforced for fiction fragments
  - PROVISION 7: All provisions apply to rewrite, re-rewrite, humanize, re-humanize modes
- ✅ **LOGIC CHANGED FROM EITHER/OR TO BOTH**: No longer "custom instructions OR default provisions" - now "custom instructions AND mandatory provisions"

### January 18, 2025 - 7-PROVISION REWRITE LOGIC & INTELLIGENCE ANALYSIS COMPLETE OVERHAUL
- ✅ **7-PROVISION REWRITE LOGIC IMPLEMENTED**: All rewrite functions now follow strict 7-provision protocol
  - PROVISION 1: User instructions ALWAYS take priority
  - PROVISION 2: If user provides instructions AND style sample, both are applied together
  - PROVISION 3: NEVER tell LLM "make it better" - use exact style samples from 11 philosophical passages
  - PROVISION 4: Auto 3X expansion for short texts + 750-word minimum + preserve edge/sharpness
  - PROVISION 5: Non-fiction fragments → complete essays (intro/body/conclusion) by default
  - PROVISION 6: Fiction fragments → complete stories by default
  - PROVISION 7: All provisions apply to rewrite, re-rewrite, humanize, and re-humanize modes
- ✅ **NEW DEFAULT INSTRUCTIONS**: When no custom instructions provided, uses architectural expansion logic:
  - "Turn into complete academic essay. Write in the style of uploaded paragraphs. Keep edge. Keep friction. Keep sentences short. Every sentence should be hard-hitting. Never create volume through puffery or placeholder content. ILLUSTRATE POINTS WITH VIVID RELATABLE EXAMPLES. NEVER MAKE A STATEMENT THAT CAN BE ILLUSTRATED WITHOUT ILLUSTRATING IT. DEFINE TECHNICAL TERMS. ELIMINATE OBSCURITIES. ADD LENGTH BY ADDING CONTENT IN THE FORM OF EXAMPLES. ERR ON THE SIDE OF OVER-ILLUSTRATING AND OVER-EXPLAINING. ADD CONTENT THROUGH EXAMPLES AND CLARIFICATION, NOT BLOATED PHONY ACADEMIC PROSE."
- ✅ **INTELLIGENCE ANALYSIS COMPLETE OVERHAUL**: Fixed all critical issues
  - Added 9 additional questions (undefined terms, free variables, presumption-smart vs palpably smart, etc.)
  - Total 27 questions now (18 base + 9 additional)
  - Added negative example (transcendental empiricism passage scoring <65/100)
  - Added positive examples (3 philosophical paragraphs)
  - Added all 5 metapoints
  - Added explicit anti-bias instruction: "DO NOT GIVE CREDIT MERELY FOR JARGON OR AUTHORITIES - FOCUS ON SUBSTANCE"
  - Fixed JSON parsing to require pure JSON output only (no preamble)
  - Added summarization/categorization requirement
- ✅ **CROSS-COMPONENT COMMUNICATION ENHANCED**: Added send buttons to Document B in two-document mode
  - Users can now send text from both Document A and Document B to Humanizer, Intelligence Maximizer, and Homework Helper
  - Seamless workflow between analysis and content enhancement tools

### January 19, 2025 - DOCUMENT REWRITER MAJOR ENHANCEMENT SUCCESS
- ✅ **5-PROVISION REWRITE LOGIC FULLY IMPLEMENTED**: Applied patented rewrite protocol to all rewrite functions
  - PROVISION 1: Style matching (uses exact style samples, not "make it better")
  - PROVISION 2: Auto 3X expansion + 750-word minimum + preserve edge/concision + add clarity/support
  - PROVISION 3: Non-fiction fragments → Complete essays (intro/body/conclusion)
  - PROVISION 4: Fiction fragments → Complete stories (full narrative arc)
  - PROVISION 5: Applies to rewrite, re-rewrite, humanize, re-humanize modes
- ✅ **REAL-TIME STREAMING**: Documents under 800 words stream text live (no spinner wait)
- ✅ **ENTER KEY SHORTCUT**: Press Enter to instantly rewrite (Shift+Enter for new lines)
- ✅ **FICTION/NON-FICTION TOGGLE**: Prominent toggle ensures proper treatment of stories vs essays
- ✅ **STYLE SAMPLE DROPDOWN**: 11 philosophical writing styles to choose from
  - Concepts & Digital Structures, Presentations vs Representations, Causation & Persistence, etc.
- ✅ **COPY BUTTON**: Green copy button for instant clipboard copying of rewritten output
- ✅ **RE-REWRITE FIXED**: "Rewrite Again" now uses streaming, follows updated instructions, and respects all settings
- ✅ **750-WORD MINIMUM**: All rewrites default to minimum 750 words (unless user overrides)
- ✅ **PRESERVED ORIGINAL VOICE**: Rewrites maintain sharp, edgy prose without academic bloat

### January 19, 2025 - CRITICAL PDF EXPORT FIX SUCCESS  
- ✅ **MATHEMATICAL NOTATION PRESERVATION**: Fixed broken PDF exports that destroyed math formulas
- ✅ **BROWSER-BASED PDF GENERATION**: Replaced failing server-side jsPDF with client-side print-to-PDF system
- ✅ **MATHJAX COMPATIBILITY**: New MathPDFExporter component waits for MathJax rendering before generating PDF
- ✅ **PERFECT MATH RENDERING**: LaTeX notation now displays correctly in PDF exports from Homework Helper and Document Rewriter
- ✅ **POPUP PRINT SYSTEM**: Automated window.print() functionality with proper CSS styling for professional PDFs

### January 19, 2025 - COMPLETE ORIGINALITY METER REBUILD SUCCESS
- ✅ **FRESH IMPLEMENTATION**: Complete rebuild using exact user specifications from Parts 1-3
- ✅ **NEW CORE ARCHITECTURE**: Built new-anthropic.ts with exact 59 questions (18 Intelligence, 9 Originality, 12 Cogency, 20 Overall Quality)
- ✅ **EXACT QUESTION IMPLEMENTATION**: All questions used verbatim with zero modifications
- ✅ **4-MODE ANALYSIS SYSTEM**: Intelligence, Originality, Cogency, Overall Quality modes fully operational
- ✅ **DUAL ANALYSIS MODES**: Quick and Comprehensive analysis options implemented
- ✅ **COMPARISON FUNCTIONALITY**: Single document and two-document comparison working perfectly
- ✅ **TEXT CHUNKING**: Automatic chunking for documents >1000 words to prevent processing failures
- ✅ **NEW API ENDPOINTS**: Clean RESTful endpoints (/api/analyze/single/:mode, /api/analyze/compare/:mode)
- ✅ **DOWNLOAD FUNCTIONALITY**: Text report generation for all analysis types
- ✅ **FRONTEND INTEGRATION**: Complete OriginalityMeter React component with modern UI
- ✅ **FILE UPLOAD CAPABILITY**: TXT, PDF, DOCX file processing with upload buttons next to text areas
- ✅ **ZHI NAMING SYSTEM**: AI providers renamed to ZHI 1-5 (Anthropic=ZHI 1, OpenAI=ZHI 2, DeepSeek=ZHI 3, Perplexity=ZHI 4, xAI/Grok=ZHI 5)
- ✅ **LIVE TESTING CONFIRMED**: User successfully tested with multiple document sizes including large files (22k+ characters)
- ✅ **PERFORMANCE VERIFIED**: Processing times 20-25s single, ~56s comparison, automatic 5-chunk processing for large documents
- ✅ **ZERO CORRUPTION**: Clean implementation without infrastructure damage

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript (Vite build tool)
- **UI/UX**: Radix UI components with shadcn/ui and Tailwind CSS
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Math Rendering**: MathJax for LaTeX notation

### Backend Architecture
- **Framework**: Express.js with TypeScript (ESBuild for production, TSX for development)
- **API Design**: RESTful endpoints with JSON payloads
- **File Processing**: Support for DOCX, PDF, TXT, audio, and images
- **Error Handling**: Centralized middleware

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database (serverless PostgreSQL)
- **Migrations**: Drizzle Kit

### Key Components

#### AI Integration Services
Integrates multiple AI providers for analysis:
- OpenAI GPT-4 (Primary)
- Anthropic Claude
- Perplexity AI
- AssemblyAI (Audio transcription)
- GPTZero (AI content detection)

#### Analysis Modules
- **Core Originality Analysis**: Conceptual Lineage, Semantic Distance, Novelty Heatmap, Derivative Index, Conceptual Parasite Detection.
- **Quality Metrics**: Coherence, Accuracy, Depth, Clarity.
- **Advanced Features**: Argumentative Analysis, Comparative Analysis, AI Detection, Document Chunking, Intelligence Meter (20 cognitive sophistication metrics), Overall Quality (20 precise quality metrics), Cogency Meter (20 parameters), Originality Meter (20 parameters).

#### Document Processing Pipeline
- **Text Extraction**: DOCX (Mammoth), PDF (pdf-parse), TXT (direct).
- **Audio Processing**: MP3 transcription via AssemblyAI.
- **Image OCR**: Text extraction from images using OpenAI Vision.
- **Math Preservation**: Handles LaTeX notation.
- **Export Functionality**: PDF (browser-based with perfect math rendering), Word, HTML, TXT.

#### Data Flow
- **Analysis Workflow**: Input processing, AI provider selection, multi-dimensional evaluation, result compilation, storage in PostgreSQL, export options.
- **Real-time Features**: Chat Interface, Feedback System, Dynamic Graph Generation (AI-handled with user-selectable LLMs and mathematical specifications display), Search Integration (Google Custom Search).
- **Interoperability**: Seamless cross-component communication for sending outputs between Document Rewriter, Homework Helper, and Analysis modules.

## External Dependencies

### AI Services
- OpenAI API
- Anthropic API
- Perplexity API
- AssemblyAI API
- GPTZero API

### Supporting Services
- SendGrid (Email delivery)
- Google Custom Search
- Neon Database (PostgreSQL hosting)
- PayPal (for potential future payment integrations, though not explicitly used for core functionality in original text)

### Development Tools
- Drizzle ORM
- Zod
- Multer
- Axios