# VehicleDB Pro

## Overview
VehicleDB Pro is a comprehensive, full-stack vehicle database management system designed for searching, managing, and analyzing vehicle compatibility data. Its primary purpose is to provide intelligent search capabilities, including a multi-tiered AI Search feature, alongside robust data management tools. The system supports importing data, viewing analytics, and a specialized Geometris system for harness type searches. The project aims to streamline vehicle data workflows and enhance data accuracy through an admin approval process for AI predictions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18+ and TypeScript, using Vite for development and bundling. It leverages Radix UI primitives and Shadcn/ui for components, styled with Tailwind CSS, utilizing a neutral color scheme and CSS variables for theming. State management primarily uses TanStack Query for server state and local component state for UI interactions. Key components include VehicleSearch, SearchResults, BulkSearch, AISearch (featuring a multi-tiered prediction system with confidence scoring and an "ALL MODELS" fallback, and smart year/make/model validation), Geometris for harness search, DataImport, AnalyticsDashboard, Billing, and an AdminPanel with sub-navigation for locked features. The display layer uses Title Case formatting for readability, while data remains in uppercase in the database.

### Backend Architecture
The backend is an Express.js server developed with TypeScript and an ESM module system. It provides a RESTful API structure under `/api`, with route handlers in `server/routes.ts` and a storage layer abstraction via `IStorage`. Custom middleware is used for logging. All search inputs are normalized to uppercase and support manufacturer aliases.

**Special Character Normalization:** All search operations (regular, bulk, AI) normalize text by removing special characters (dashes, commas, slashes, periods) and spaces from both user input and database values during comparison. This enables flexible matching: "F150" matches "F-150", "35004500" matches "3500 / 4500". Results always display original database formatting with special characters intact. Implementation uses `normalizeText()` in routes and SQL REPLACE chain in storage layer.

**Search Implementation:** Database search operations use Drizzle's `sql` template for raw SQL execution with automatic parameterization. This approach was chosen after discovering that Drizzle's query builder (`.ilike()`) and ORM methods failed to match LIKE patterns on the model column, particularly for vehicles with special characters (e.g., "F-150", "F150"). The raw SQL implementation using the `sql` template provides reliable LIKE matching while maintaining SQL injection protection through automatic parameter binding. Conditions are combined using template composition: `sql\`${condition1} AND ${condition2}\`` for proper parameterization.

**Key API Endpoints:**
- **Vehicle Management:** CRUD operations, search (including bulk and `ALL MODELS` fallback), statistics, and CSV/JSON import, with auto device type suggestion based on port type.
- **Harness Management (Geometris):** Search and authenticated CRUD/import operations for harnesses, supporting year range matching.
- **AI Prediction:** `/api/ai/predict` implements a 3-tier hybrid prediction system (exact database match, Pentaho JBusPortFinder, database pattern matching within ±5 years, then ±10 years, and Google Custom Search as a last resort). All AI predictions require admin approval and are logged for billing.
- **Billing:** `/api/billing/stats` for AI Search usage and cost analytics, including a free tier for the first 100 Google searches per day.
- **Pending Approvals:** Endpoints for managing predictions awaiting admin review, including approval, rejection, or deletion.

### Data Storage
PostgreSQL is used as the database, accessed via the Neon serverless driver. Drizzle ORM provides type-safe operations, with schema defined in `shared/schema.ts` and Zod for runtime validation.

**Database Schema includes:**
- `vehicles`: Stores vehicle data with id, make, model, year, deviceType, portType. Supports year ranges.
- `harnesses`: Stores harness data, supporting yearFrom and yearTo for ranges.
- `ai_search_logs`: Records AI Search predictions, source (tier), confidence, and cost for billing.
- `pending_vehicles`: Stores AI predictions (including Google API and Pentaho) awaiting admin approval, along with prediction details and status.
- `users`: For authentication purposes.

## External Dependencies
- **Database Driver & ORM:** `@neondatabase/serverless`, `drizzle-orm`
- **Web Framework:** `express`
- **Frontend Framework:** `react`, `react-dom`, `@tanstack/react-query`, `wouter`
- **File Processing:** `multer`, `csv-parser`
- **UI & Styling:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `cmdk`, `date-fns`, `clsx`, `tailwind-merge`
- **Form Management & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`
- **Unique ID Generation:** `nanoid`