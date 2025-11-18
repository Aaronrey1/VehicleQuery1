# VehicleDB Pro

## Overview
VehicleDB Pro is a comprehensive, full-stack vehicle database management system designed for searching, managing, and analyzing vehicle compatibility data. Its primary purpose is to provide intelligent search capabilities, including a multi-tiered AI Search feature, alongside robust data management tools. The system supports importing data, viewing analytics, and a specialized Geometris system for harness type searches. The project aims to streamline vehicle data workflows and enhance data accuracy through an admin approval process for AI predictions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18+ and TypeScript, using Vite for development and bundling. It leverages Radix UI primitives and Shadcn/ui for components, styled with Tailwind CSS, utilizing a neutral color scheme and CSS variables for theming. State management primarily uses TanStack Query for server state and local component state for UI interactions. Key components include AISearch (featuring a multi-tiered prediction system with confidence scoring and an "ALL MODELS" fallback, smart year/make/model validation, and optional email notification form for pending predictions), BulkSearch, VinDecoder (supporting single and bulk VIN decoding with NHTSA integration, AI predictions, and optional email notification form), Geometris for harness search, DataImport, SearchAnalytics (located in Admin section, displays analytics for AI Search, Bulk Search, VIN Decoder, and Geometris with geolocation, date range filtering, and CSV/JSON export; also includes Approval Analytics showing pending/approved/rejected AI predictions), AnalyticsDashboard, Billing, and an AdminPanel with sub-navigation for locked features. The display layer uses Title Case formatting for readability, while data remains in uppercase in the database.

### Backend Architecture
The backend is an Express.js server developed with TypeScript and an ESM module system. It provides a RESTful API structure under `/api`, with route handlers in `server/routes.ts` and a storage layer abstraction via `IStorage`. Custom middleware is used for logging. All search inputs are normalized to uppercase and support manufacturer aliases.

**Special Character Normalization:** All search operations (regular, bulk, AI) normalize text by removing special characters (dashes, commas, slashes, periods) and spaces from both user input and database values during comparison. This enables flexible matching: "F150" matches "F-150", "35004500" matches "3500 / 4500". Results always display original database formatting with special characters intact. Implementation uses `normalizeText()` in routes and SQL REPLACE chain in storage layer.

**Search Implementation:** Database search operations use Drizzle's `sql` template for raw SQL execution with automatic parameterization. This approach was chosen after discovering that Drizzle's query builder (`.ilike()`) and ORM methods failed to match LIKE patterns on the model column, particularly for vehicles with special characters (e.g., "F-150", "F150"). The raw SQL implementation using the `sql` template provides reliable LIKE matching while maintaining SQL injection protection through automatic parameter binding. Conditions are combined using template composition: `sql\`${condition1} AND ${condition2}\`` for proper parameterization.

**Key API Endpoints:**
- **Vehicle Management:** CRUD operations, search (including bulk and `ALL MODELS` fallback), statistics, and CSV/JSON import, with auto device type suggestion based on port type.
- **Harness Management (Geometris):** Search and authenticated CRUD/import operations for harnesses, supporting year range matching.
- **AI Prediction:** `/api/ai/predict` implements a 3-tier hybrid prediction system (exact database match, Pentaho JBusPortFinder, database pattern matching within ±5 years, then ±10 years, and Gemini AI as a last resort). Gemini AI provides highly accurate predictions by leveraging automotive knowledge to predict port types and device types. All AI predictions require admin approval and are logged for billing. Accepts optional `userName` and `userEmail` query parameters for email notifications when predictions are approved.
- **VIN Decoding:** `/api/vin/decode` decodes VINs using the free NHTSA API (vpic.nhtsa.dot.gov), extracting make, model, and year, then automatically runs AI predictions using the same 3-tier system. Supports single and bulk VIN decoding (up to 50 VINs per request). VINs are validated for format (17 alphanumeric characters excluding I, O, Q). All VIN predictions (except exact database matches) require admin approval and are logged for billing. Confidence calculation matches AI Search: Tier 1 (±5 years) averages raw percentages, Tier 2 (±10 years) scales each by 0.6 before averaging. Accepts optional `userName` and `userEmail` in request body for email notifications when predictions are approved. Captures and displays NHTSA warnings (e.g., check digit errors) while still successfully decoding the vehicle - warnings are shown to users but don't prevent successful decoding when NHTSA provides make/model/year data.
- **Search Analytics:** `/api/analytics/search` with optional date range filtering returns aggregated search data by type and country. `/api/analytics/export/csv` and `/api/analytics/export/json` provide export functionality. Only special search types are tracked: AI Search, Bulk Search, VIN Decoder, and Geometris (regular database browse/filter is not logged). All tracked searches are automatically logged with IP-based geolocation using geoip-lite.
- **Billing:** `/api/billing/stats` for AI Search usage and cost analytics. Gemini AI predictions cost approximately $0.01 per request.
- **Pending Approvals:** `/api/pending-vehicles/:id/approve` endpoint approves predictions and automatically sends email notifications to users who provided contact information. Email sending is non-blocking (approval succeeds even if email fails). Other endpoints include rejection and deletion.

### Data Storage
PostgreSQL is used as the database, accessed via the Neon serverless driver. Drizzle ORM provides type-safe operations, with schema defined in `shared/schema.ts` and Zod for runtime validation.

**Database Schema includes:**
- `vehicles`: Stores vehicle data with id, make, model, year, deviceType, portType. Supports year ranges.
- `harnesses`: Stores harness data, supporting yearFrom and yearTo for ranges.
- `ai_search_logs`: Records AI Search predictions, source (tier), confidence, and cost for billing.
- `search_logs`: Tracks special search operations (AI, Bulk, VIN, Geometris) with timestamp, country (via IP geolocation), make/model/year, results count, query details, and optional userName/userEmail fields. Regular database searches are not logged. Used for comprehensive search analytics and usage tracking. Search Analytics displays user contact information when provided.
- `pending_vehicles`: Stores AI predictions (including Gemini AI and Pentaho) awaiting admin approval, along with prediction details, status, and optional `userName` and `userEmail` fields for email notifications when predictions are approved.
- `users`: For authentication purposes.

## External Dependencies
- **Database Driver & ORM:** `@neondatabase/serverless`, `drizzle-orm`
- **Web Framework:** `express`
- **Frontend Framework:** `react`, `react-dom`, `@tanstack/react-query`, `wouter`
- **File Processing:** `multer`, `csv-parser`
- **Geolocation:** `geoip-lite` for IP-based country detection
- **Email Service:** `resend` for sending email notifications when predictions are approved (configured via RESEND_API_KEY environment variable). Emails are sent from 'VehicleDB Pro <noreply@resend.dev>' with professional HTML templates. Works automatically in both development and production.
- **UI & Styling:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `cmdk`, `date-fns`, `clsx`, `tailwind-merge`
- **Form Management & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`
- **Unique ID Generation:** `nanoid`