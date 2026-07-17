# Originality Meter - Semantic Analysis Application

## Overview

The Originality Meter is a web application designed to evaluate the intellectual originality and quality of written content. It analyzes passages for conceptual innovation, semantic distance from existing ideas, and overall intellectual merit. The system supports single-passage and comparative analysis, document processing, graph generation, and AI-powered content evaluation. Its vision is to provide a sophisticated tool for assessing the depth and novelty of ideas across various disciplines.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 17, 2025
- ✅ Fixed 160-metric analysis system - now fully functional
- ✅ Changed waiting message from "15-30 seconds" to "1-2 minutes" 
- ✅ Resolved frontend display issues preventing results from showing
- ✅ Updated UI to correctly show "40 parameters" instead of "20 parameters"
- ✅ Analysis system now provides direct quotations + explanations for each metric
- ✅ Anthropic set as default LLM provider for all analysis functions
- ✅ Backend analysis confirmed working with structured JSON responses (numbered keys 0-39)
- ✅ Frontend successfully displays analysis results with proper formatting
- ✅ **DUAL ANALYSIS COMPLETELY FIXED** - Both intelligence and originality dual analysis working
- ✅ Enhanced JSON parsing with robust markdown code block extraction and fallback methods
- ✅ Frontend now properly handles both single and dual document analysis formats
- ✅ Color-coded comparative display (blue for Document A, green for Document B)
- ✅ All TypeScript errors resolved, full system operational
- ✅ **NEW FEATURE: Generate Perfect Example** - Users can now generate 95-99/100 example text on same topic
- ✅ Added "Generate Perfect Example (100/100)" button to single passage analysis results
- ✅ Perfect example generation uses Anthropic Claude to create high-quality writing demonstrating all 160 metrics
- ✅ Feature designed to reveal what the evaluation system considers "perfect" intellectual writing

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
- **Scoring**: Uses population percentile scoring (0-100 where score = how many people out of 100 this text is better than).

#### Document Processing Pipeline
- **Text Extraction**: DOCX (Mammoth), PDF (pdf-parse), TXT (direct).
- **Audio Processing**: MP3 transcription via AssemblyAI.
- **Image OCR**: Text extraction from images using OpenAI Vision.
- **Math Preservation**: Handles LaTeX notation.
- **Export Functionality**: PDF, Word, HTML, TXT.

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