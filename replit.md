# VehicleDB Pro

## Overview
VehicleDB Pro is a comprehensive, full-stack vehicle database management system for searching, managing, and analyzing vehicle compatibility data. It provides intelligent search capabilities, including a multi-tiered AI Search feature, alongside robust data management tools. The system supports data import, analytics, and a specialized Geometris system for harness type searches. The project aims to streamline vehicle data workflows and enhance data accuracy through an admin approval process for AI predictions, ultimately offering a robust solution for vehicle data management with significant market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18+, TypeScript, and Vite. It utilizes Radix UI primitives and Shadcn/ui components styled with Tailwind CSS, employing a neutral color scheme and CSS variables for theming. State management uses TanStack Query for server state. Key components include AISearch (featuring a 3-tiered prediction system with confidence scoring, smart validation, and optional email notifications), BulkSearch, VinDecoder (with NHTSA integration and AI predictions), Geometris for harness search, DataImport, SearchAnalytics (in Admin section, with geolocation, filtering, and export), ApiCallAnalytics, AnalyticsDashboard (real-time stats), Billing, and an AdminPanel. Display layer uses Title Case, while data in the database remains uppercase.

### Backend Architecture
The backend is an Express.js server developed with TypeScript and an ESM module system, providing a RESTful API under `/api`. It uses custom middleware for logging and a storage layer abstraction via `IStorage`. All search inputs are normalized to uppercase and support manufacturer aliases. Special characters are normalized for flexible matching in all search operations. Database search uses Drizzle's `sql` template for raw SQL execution with automatic parameterization to ensure reliable `LIKE` matching and SQL injection protection.

**API Key Authentication:**
All public API endpoints require API key authentication via the `X-API-Key` header for external integrations. API keys are managed through the Admin panel, using industry-standard security practices: bcrypt-hashed secrets stored in the database, with only a public prefix visible in the admin UI.

**Key API Endpoints:**
- **API Key Management:** CRUD operations for secure API keys (admin-only).
- **Vehicle Management:** CRUD, search (including bulk and `ALL MODELS` fallback), statistics, import.
- **Harness Management (Geometris):** Search and authenticated CRUD/import for harnesses.
- **AI Prediction:** `/api/ai/predict` (requires API key) implements a 3-tier system: (1) exact database match, (2) database pattern matching within ±5 years, (3) Gemini AI. All AI predictions require admin approval and are logged.
- **VIN Decoding:** `/api/vin/decode` (requires API key) uses the NHTSA API, then runs AI predictions via the 3-tier system. Supports single and bulk decoding, with VIN validation. Predictions require admin approval and are logged.
- **Search Analytics:** `/api/analytics/search` provides aggregated search data (AI Search, Bulk Search, VIN Decoder, Geometris) by type and country, with export options. Searches are logged with IP-based geolocation and API key tracking.
- **API Call Analytics:** `/api/analytics/api-calls` provides detailed API key usage analytics (total calls, calls by endpoint/key, recent logs) with filtering and export.
- **Dashboard Analytics:** `/api/analytics/dashboard` provides real-time analytics for total searches, most searched make, total vehicles, and top searched vehicles.
- **Billing:** `/api/billing/stats` for AI Search usage and cost analytics (Gemini AI costs approx. $0.01/request). Includes endpoints for billing pie charts. The `/api/billing/pie-charts` endpoint provides:
  - Search Tier Breakdown: Shows distribution of all searches across 5 tiers (Exact Matches, DB ±5yr, DB ±10yr, Google API, Gemini AI).
  - Individual Tier Charts: Separate pie charts for each tier (DB ±5yr, DB ±10yr, Google API, Gemini AI, Unmatched) showing pending/approved/rejected status distribution with consistent color coding (Pending: orange, Approved: green, Rejected: red).
- **Pending Approvals:** Endpoints for approving, rejecting, and deleting pending predictions, with automated email notifications for approved predictions.

### Data Storage
PostgreSQL is used as the database, accessed via the Neon serverless driver. Drizzle ORM provides type-safe operations, with schema defined in `shared/schema.ts` and Zod for runtime validation.

**Database Schema includes:**
- `vehicles`: Vehicle data (make, model, year, deviceType, portType).
- `harnesses`: Harness data with year ranges.
- `ai_search_logs`: Records AI Search predictions, source, confidence, cost.
- `search_logs`: Tracks special search operations (AI, Bulk, VIN, Geometris) with geolocation, query details, results, API key, and endpoint. Includes `exactMatch` boolean.
- `pending_vehicles`: Stores AI predictions awaiting admin approval, with user contact info for notifications.
- `api_keys`: Stores secure (bcrypt-hashed) API keys for external integrations, with usage tracking.
- `users`: For authentication.

## External Dependencies
- **Database Driver & ORM:** `@neondatabase/serverless`, `drizzle-orm`
- **Web Framework:** `express`
- **Frontend Framework:** `react`, `react-dom`, `@tanstack/react-query`, `wouter`
- **File Processing:** `multer`, `csv-parser`
- **Geolocation:** `geoip-lite`
- **Email Service:** `resend` (for sending email notifications with professional templates)
- **UI & Styling:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `cmdk`, `date-fns`, `clsx`, `tailwind-merge`
- **Form Management & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`
- **Unique ID Generation:** `nanoid`