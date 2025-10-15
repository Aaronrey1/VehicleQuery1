# VehicleDB Pro

## Overview

VehicleDB Pro is a full-stack vehicle database management system for searching, managing, and analyzing vehicle compatibility data. It allows users to search vehicles, import data from CSVs, and view analytics. A key feature is the Geometris system for searching harness types by vehicle criteria. The application also includes an AI Search feature with a hybrid prediction system (database and Google Custom Search) and an admin approval workflow for AI predictions. The project aims to provide comprehensive vehicle data management with intelligent search capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool:** React 18+ with TypeScript, Vite for build and development.
**UI Component System:** Radix UI primitives, Shadcn/ui component library, Tailwind CSS for styling with a neutral color scheme and CSS variable-based theming.
**State Management:** TanStack Query for server state (with `staleTime: Infinity` requiring `refetchQueries` for mutations), local component state for UI interactions.
**Key Pages & Components:** Home page with tabbed navigation (Search, Bulk Search, AI Search, Manage Data, Geometris, Analytics, Billing, Admin), VehicleSearch, SearchResults, BulkSearch, AISearch (with multi-tiered prediction and confidence scoring), Geometris (harness search), DataImport, AnalyticsDashboard, Billing, and AdminPanel.

### Backend Architecture

**Server Framework:** Express.js with TypeScript, ESM module system, custom middleware for logging.
**API Structure:** RESTful API endpoints under `/api`, route handlers in `server/routes.ts`, storage layer abstraction via `IStorage`.
**Key API Endpoints:**
- **Vehicle Endpoints:** CRUD operations, search (including bulk), statistics, filtering options (makes, models, years, device/port types), and CSV/JSON import. All search inputs are normalized to uppercase and support manufacturer aliases.
- **Harness Endpoints (Geometris):** Search harnesses by make/model/year (with year range matching), statistics, and authenticated CRUD/import operations.
- **AI Prediction Endpoint:** `/api/ai/predict` for pattern-based predictions using a 3-tier hybrid system (database matches within ±5 years, fallback database matches within ±10 years, and Google Custom Search as a last resort). Logs all predictions for billing.
- **Billing Endpoints:** `/api/billing/stats` for AI Search usage and cost analytics.

### Data Storage

**Database:** PostgreSQL via Neon serverless driver.
**ORM & Schema:** Drizzle ORM for type-safe operations, schema defined in `shared/schema.ts`, Zod for runtime validation.
**Database Schema:**
- `vehicles`: id, make, model, year, deviceType, portType.
- `harnesses`: id, make, model, yearFrom (nullable), yearTo (nullable), harnessType, comments. Supports year range searches.
- `ai_search_logs`: id, timestamp, make, model, year, source (tier), confidence, cost (for billing).
- `pending_vehicles`: Stores Google API predictions awaiting admin approval, including make, model, year, predictions, confidence, Google results JSON, and status.
- `users`: id, username, password for authentication.
**Data Validation:** Drizzle-Zod integration for automatic schema validation and type inference.

## External Dependencies

**Core Runtime:** `@neondatabase/serverless`, `drizzle-orm`, `express`, `react`, `react-dom`, `@tanstack/react-query`, `wouter`.
**File Processing:** `multer`, `csv-parser`.
**UI Components & Styling:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `cmdk`.
**Form Management & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`.
**Utilities:** `date-fns`, `clsx`, `tailwind-merge`, `nanoid`.