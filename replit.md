# VehicleDB Pro

## Overview
VehicleDB Pro is a comprehensive, full-stack vehicle database management system designed for searching, managing, and analyzing vehicle compatibility data. Its primary purpose is to provide intelligent search capabilities, including a multi-tiered AI Search feature, alongside robust data management tools. The system supports importing data, viewing analytics, and a specialized Geometris system for harness type searches. The project aims to streamline vehicle data workflows and enhance data accuracy through an admin approval process for AI predictions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18+ and TypeScript, using Vite for development and bundling. It leverages Radix UI primitives and Shadcn/ui for components, styled with Tailwind CSS, utilizing a neutral color scheme and CSS variables for theming. State management primarily uses TanStack Query for server state and local component state for UI interactions. Key components include AISearch (featuring a multi-tiered prediction system with confidence scoring and an "ALL MODELS" fallback, smart year/make/model validation, and optional email notification form for pending predictions), BulkSearch, VinDecoder (supporting single and bulk VIN decoding with NHTSA integration, AI predictions, and optional email notification form), Geometris for harness search, DataImport, SearchAnalytics (located in Admin section, displays analytics for AI Search, Bulk Search, VIN Decoder, and Geometris with geolocation, date range filtering, and CSV/JSON export; also includes Approval Analytics showing pending/approved/rejected AI predictions), ApiCallAnalytics (displays API key usage analytics with calls by endpoint, calls by API key, and recent API call logs with date range filtering and CSV export), AnalyticsDashboard (displays real-time database analytics including total searches, most searched make, total vehicles, and top searched vehicles), Billing, and an AdminPanel with sub-navigation for locked features. The display layer uses Title Case formatting for readability, while data remains in uppercase in the database.

### Backend Architecture
The backend is an Express.js server developed with TypeScript and an ESM module system. It provides a RESTful API structure under `/api`, with route handlers in `server/routes.ts` and a storage layer abstraction via `IStorage`. Custom middleware is used for logging. All search inputs are normalized to uppercase and support manufacturer aliases.

**Special Character Normalization:** All search operations (regular, bulk, AI) normalize text by removing special characters (dashes, commas, slashes, periods) and spaces from both user input and database values during comparison. This enables flexible matching: "F150" matches "F-150", "35004500" matches "3500 / 4500". Results always display original database formatting with special characters intact. Implementation uses `normalizeText()` in routes and SQL REPLACE chain in storage layer.

**Search Implementation:** Database search operations use Drizzle's `sql` template for raw SQL execution with automatic parameterization. This approach was chosen after discovering that Drizzle's query builder (`.ilike()`) and ORM methods failed to match LIKE patterns on the model column, particularly for vehicles with special characters (e.g., "F-150", "F150"). The raw SQL implementation using the `sql` template provides reliable LIKE matching while maintaining SQL injection protection through automatic parameter binding. Conditions are combined using template composition: `sql\`${condition1} AND ${condition2}\`` for proper parameterization.

**API Key Authentication:**
All public API endpoints (AI Search, VIN Decoder, Vehicle Search, Bulk Search, Geometris) require API key authentication for external integrations. API keys are managed through the Admin panel and passed via the `X-API-Key` header. This enables secure integration with external systems like Salesforce, which can store API keys in Named Credentials. The system tracks API key usage with `lastUsedAt` timestamps and supports key revocation.

**Security:** API keys use industry-standard security practices: generated with format `vdb_[prefix]_[secret]`, only the bcrypt-hashed secret is stored in the database (never plaintext), full keys are shown only at creation time, and the admin UI displays only the public prefix for existing keys. This prevents key exfiltration even if database or admin access is compromised.

**Key API Endpoints:**
- **API Key Management:** `/api/api-keys` for creating, listing, revoking, and deleting API keys (admin-only). Keys are automatically generated as secure strings with public prefix and secret component, then hashed using bcrypt before storage.
- **Vehicle Management:** CRUD operations, search (including bulk and `ALL MODELS` fallback), statistics, and CSV/JSON import, with auto device type suggestion based on port type.
- **Harness Management (Geometris):** Search and authenticated CRUD/import operations for harnesses, supporting year range matching.
- **AI Prediction:** `/api/ai/predict` (requires API key) implements a simplified 3-tier prediction system: (1) exact database match, (2) database pattern matching within ±5 years, (3) Gemini AI. The system first checks for exact matches, then looks for similar vehicles within a 5-year window, and if no matches are found, calls Gemini AI directly. Gemini AI provides highly accurate predictions by leveraging automotive knowledge to predict port types and device types. All AI predictions require admin approval and are logged for billing. Accepts optional `userName` and `userEmail` query parameters for email notifications when predictions are approved.
- **VIN Decoding:** `/api/vin/decode` (requires API key) decodes VINs using the free NHTSA API (vpic.nhtsa.dot.gov), extracting make, model, and year, then automatically runs AI predictions using the same simplified 3-tier system. Supports single and bulk VIN decoding (up to 50 VINs per request). VINs are validated for format (10-17 alphanumeric characters excluding I, O, Q) to support partial VINs. All VIN predictions (except exact database matches) require admin approval and are logged for billing. Accepts optional `userName` and `userEmail` in request body for email notifications when predictions are approved. Captures and displays NHTSA warnings (e.g., check digit errors, incomplete VIN) while still successfully decoding the vehicle - warnings are shown to users but don't prevent successful decoding when NHTSA provides make/model/year data.
- **Search Analytics:** `/api/analytics/search` with optional date range filtering returns aggregated search data by type and country. `/api/analytics/export/csv` and `/api/analytics/export/json` provide export functionality. Only special search types are tracked: AI Search, Bulk Search, VIN Decoder, and Geometris (regular database browse/filter is not logged). All tracked searches are automatically logged with IP-based geolocation using geoip-lite and API key tracking (when applicable).
- **API Call Analytics:** `/api/analytics/api-calls` returns detailed analytics about API key usage including total calls, calls by endpoint, calls by API key with endpoint breakdown, and recent API call logs. Supports date range filtering and CSV export via `/api/analytics/api-calls/export/csv`.
- **Dashboard Analytics:** `/api/analytics/dashboard` provides real-time analytics for the main analytics view including total searches, most searched make, total vehicles, and top searched vehicles.
- **Billing:** `/api/billing/stats` for AI Search usage and cost analytics. Gemini AI predictions cost approximately $0.01 per request.
- **Pending Approvals:** `/api/pending-vehicles/:id/approve` endpoint approves predictions and automatically sends email notifications to users who provided contact information. Email sending is non-blocking (approval succeeds even if email fails). Other endpoints include rejection and deletion.

### Data Storage
PostgreSQL is used as the database, accessed via the Neon serverless driver. Drizzle ORM provides type-safe operations, with schema defined in `shared/schema.ts` and Zod for runtime validation.

**Database Schema includes:**
- `vehicles`: Stores vehicle data with id, make, model, year, deviceType, portType. Supports year ranges.
- `harnesses`: Stores harness data, supporting yearFrom and yearTo for ranges.
- `ai_search_logs`: Records AI Search predictions, source (tier), confidence, and cost for billing.
- `search_logs`: Tracks special search operations (AI, Bulk, VIN, Geometris) with timestamp, country (via IP geolocation), make/model/year, results count, query details, optional userName/userEmail fields, apiKeyId (to track which API key made the request), and endpoint (which API endpoint was called). Regular database searches are not logged. Used for comprehensive search analytics, usage tracking, and API call analytics. Search Analytics displays user contact information when provided.
- `pending_vehicles`: Stores AI predictions (including Gemini AI and Pentaho) awaiting admin approval, along with prediction details, status, and optional `userName` and `userEmail` fields for email notifications when predictions are approved.
- `api_keys`: Stores API keys for external integrations (e.g., Salesforce) with id, keyHash (bcrypt-hashed key for secure validation), keyPrefix (public prefix for display), name, active status, createdAt, and lastUsedAt timestamps. Enables secure, trackable access to public API endpoints with industry-standard hashing to prevent key exposure.
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

## Recent Changes
- **Date: November 19, 2025**
  - **Billing Pie Charts:** Added two visual analytics pie charts to the Billing tab for better data insights:
    1. **Search Tier Breakdown**: Displays distribution of searches by tier (Exact Matches in green, Database Pattern ±5 years in blue, Gemini AI in purple). Helps visualize how searches are categorized and which tiers are most used.
    2. **Approval Analytics**: Shows status of AI predictions (Pending in orange, Approved in green, Rejected in red). Provides quick overview of prediction approval workflow status.
    - Created `/api/billing/pie-charts` endpoint that returns BillingPieCharts data with color-coded categories
    - Implemented `getBillingPieCharts()` storage method querying search_logs, ai_search_logs, and pending_vehicles tables
    - Frontend uses Recharts library (PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip) for responsive, interactive visualizations
    - Charts automatically filter out zero values and display only meaningful data with labels
  - **Exact Match Tracking:** Added `exactMatch` boolean field to `search_logs` table to distinguish free exact database matches from billable AI predictions. This enables accurate analytics breakdown showing "X exact / Y predictions" for AI Search and VIN Decoder. Search Analytics now displays this breakdown under each search type total. AI Search endpoint logs `exactMatch=true` for database hits, `false` for predictions (database tier1 or Gemini AI). VIN Decoder logs each VIN separately with appropriate exact match flag. Backfilled 86 historical records with `exactMatch=false` for legacy data consistency.
  - **Simplified AI Prediction Logic:** Changed from 4-tier to 3-tier system by removing ±10 years database tier and Pentaho API. New flow: exact match → ±5 years → Gemini AI directly. This reduces complexity and API costs while maintaining prediction quality.
  - Added API Call Analytics dashboard to track API key usage, endpoint calls, and timestamps
  - Updated `search_logs` table with `apiKeyId` and `endpoint` fields to track which API key made each request and which endpoint was called
  - Fixed Analytics Dashboard to display real data from database instead of mock data
  - Created `/api/analytics/api-calls` endpoint to retrieve API call analytics with date range filtering and CSV export
  - Created `/api/analytics/dashboard` endpoint to provide real-time analytics for the main analytics view
  - Added "API Calls" tab in Admin section to view detailed API usage metrics by key and endpoint
  - All search logging now includes API key tracking (when applicable) for comprehensive usage analytics

- **Date: November 18, 2025**
  - Upgraded API key security from plaintext to bcrypt hashing with format `vdb_[prefix]_[secret]`
  - API keys now display only public prefix in admin UI; full key shown once at creation for maximum security
  - Keys are hashed using bcrypt before storage to prevent exposure even if database is compromised