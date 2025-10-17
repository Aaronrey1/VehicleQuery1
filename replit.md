# VehicleDB Pro

## Overview

VehicleDB Pro is a full-stack vehicle database management system for searching, managing, and analyzing vehicle compatibility data. It allows users to search vehicles, import data from CSVs, and view analytics. A key feature is the Geometris system for searching harness types by vehicle criteria. The application also includes an AI Search feature with a hybrid prediction system (database and Google Custom Search) and an admin approval workflow for AI predictions. The project aims to provide comprehensive vehicle data management with intelligent search capabilities.

## Recent Changes

**Auto Device Type Suggestion (Latest):**
- **Smart Form Filling:** Admin panel now automatically suggests device type when port type is selected
  - Based on 31,000+ vehicle database patterns showing most common port-to-device combinations
  - Example mappings: OBD → DCM97021ZB (23K records), HARDWIRED → DCM97021ZB1 (6K records), JBUS variants → DCM97021ZB2
  - Instantly fills device type field when user selects port type, saving data entry time
  - Still allows manual override if suggestion is incorrect
- **CSV Import Enhancement:** CSV files with missing device type now auto-populate based on port type
  - Reduces import errors when device type column is incomplete
  - Applies same smart mapping as admin form
  - Falls back to error if both device type and port type are missing
- **Implementation:** `suggestDeviceType()` utility in both frontend (client/src/lib/utils.ts) and backend (server/routes.ts)

**Pentaho JBusPortFinder Integration:**
- **AI Search Priority:** Pentaho JBusPortFinder report added as second-priority prediction source (checked immediately after exact database match)
  - **Search Order:**
    1. Exact match in database → FREE
    2. Pentaho JBusPortFinder → FREE (new!)
    3. Database pattern matching (±5 years, same make/model) → FREE
    4. Database pattern matching (±10 years, same make) → FREE
    5. Google Custom Search → First 100/day FREE, then $0.005/search
  - **Note:** Billing UI uses different tier labels for tracking (Tier 1=DB ±5yr, Tier 2=DB ±10yr, Tier 3=Google, Tier 4=Pentaho)
- **Smart Pentaho Matching:**
  - Exact model match: Uses exact make/model/year from Pentaho (highest priority)
  - "All models": If Pentaho lists "All models" for a make, applies to ALL models of that make
  - "All heavy model": If Pentaho lists "All heavy model", checks with Google if the searched vehicle is heavy-duty (commercial truck, Class 4-8, etc.) and applies data only if confirmed
- **Smart Fallback:** Pentaho specifically good for JBUS port information
- **Visual Indicator:** Teal-colored badge shows "From Pentaho Report" when used
- **Search Path Display:** Shows numbered list of all sources checked (exact DB → Pentaho → DB patterns → Google) with ✓/✗ indicators
- **Admin Approval:** All Pentaho predictions require admin approval before database addition
- **Zero Cost:** Pentaho queries are free (no billing impact)

**Title Case Display Formatting:**
- **Display Layer Enhancement:** All vehicle data now displays in Title Case for better readability
  - Storage: All data remains in UPPERCASE in database for consistency and case-insensitive searching
  - Display: New `formatForDisplay()` utility converts uppercase to title case in UI
  - Examples: "FORD" → "Ford", "E350 SUPER DUTY" → "E350 Super Duty", "OBD" → "OBD"
- **Comprehensive UI Coverage:** Applied across all components
  - Search dropdowns: Make, model, device type, port type selectors show title case
  - Search results: All table columns display in title case
  - AI Search: Exact matches, predictions, and similar vehicles show title case
  - Bulk Search: All dropdown options formatted
- **Smart Capitalization:** Preserves special cases like "OBD", "CAN", "JBUS" in full uppercase
- **Performance:** O(n) formatting on short strings has negligible impact
- **Data Integrity:** Separation of storage (uppercase) and display (title case) maintains normalization benefits

**Smart Input Validation & Universal Pending Approval:**
- **Make/Model Validation:** AI Search now detects nonsensical inputs (e.g., "ABC") and warns users
  - Checks if make exists in database or is too short (<2 characters)
  - Shows red warning: "No vehicles found for make..." or "seems invalid"
  - Prevents wasted predictions on invalid inputs
- **All Predictions Now Require Admin Approval:** Changed prediction workflow to require approval for ALL AI predictions
  - Tier 1 (same make/model, ±5 years), Tier 2 (same make, ±10 years), and Google API predictions all go to pending_vehicles table
  - **Users see prediction details WITH warnings** - full transparency on what was predicted
  - Blue info message at bottom: "Prediction submitted for admin approval"
  - Predictions include: port type, device type, confidence scores, similar vehicles used
  - Exact matches still show immediately (no pending approval needed)
  - Admin must review and approve predictions in Pending tab before they're added to main database
  - Ensures data quality and prevents incorrect predictions from polluting the database

**Smart Year Validation:**
- AI Search validates if the searched year makes sense for the vehicle
- Checks database for known production years of that make/model
- Shows prominent red warning when year is >5 years outside known range
- Example: Searching "Tata Nano 1998" shows warning "This vehicle model was first produced in 2015"
- Helps prevent impossible vehicle/year combinations from showing predictions
- Works for both too-early and too-late years

**Navigation Reorganization:**
- Grouped locked tabs (Admin, Manage Data, Billing, Pending) under single "Admin" section with sub-navigation
- Cleaner main navigation with Settings icon for Admin section
- Sub-tabs appear in secondary navigation bar when Admin section is active
- Maintains authentication checks - redirects to login if not authenticated
- Improved UX by reducing navigation clutter and grouping related admin features

**Free Tier Implementation for Google API:**
- First 100 Google searches per day are completely free (cost = $0.00)
- Backend tracks daily Google search count and sets cost to 0 for first 100 searches
- After 100 searches, cost is $0.005 per search
- Billing display correctly shows $0.00 for free searches
- UI clearly indicates "100 FREE/DAY" in tier breakdown
- getTodayGoogleSearchCount() method counts Google searches since midnight

**Payment Integration:**
- Added "Make Payment" button in billing tab (appears when totalCostCents > 0)
- Opens payment link in new window (currently placeholder URL)
- Integrates with existing Stripe infrastructure for future payment processing

**Google API Results Admin Approval Workflow:**
- New "Pending" tab (admin-only) displays Google API predictions awaiting approval before database insertion
- Automatic capture: When AI Search calls Google API (Tier 3 - $0.005/search), results automatically saved to `pending_vehicles` table
- Review interface: Admin can view predicted port type, device type, confidence score, and raw Google search results
- Three actions: Approve (add to main database), Reject (mark as rejected), or Delete (remove from pending)
- Data transparency: Expandable rows show the original Google search snippets that influenced the prediction
- Database schema: `pending_vehicles` table stores make, model, year, predictions, confidence, Google results JSON, and status (pending/approved/rejected)
- Backend routes: GET `/api/pending-vehicles`, POST `/api/pending-vehicles/:id/approve`, POST `/api/pending-vehicles/:id/reject`, DELETE `/api/pending-vehicles/:id`
- Component: `client/src/components/pending-approvals.tsx`
- Workflow ensures human oversight before adding AI predictions to production database

**Case-Insensitive Search Normalization:**
- All search inputs (make, model, device type, port type) now normalized to uppercase
- Works everywhere: Applied to regular Search, Bulk Search, AI Search, and CSV export
- Matches database: Vehicles stored in uppercase (e.g., "CHEVROLET", "SILVERADO") now match lowercase/mixed-case inputs
- Combined with aliases: Works seamlessly with manufacturer alias system (e.g., "chevy" → "CHEVROLET" → uppercase match)
- Implementation: New `normalizeText()` utility in `server/routes.ts` applied to all search endpoints

**Billing & Usage Tracking:**
- New "Billing" tab provides comprehensive cost tracking for AI Search usage
- Usage analytics: Real-time tracking of all AI predictions with breakdown by tier (Tier 1, Tier 2, Google API)
- Cost monitoring: Displays total costs, cost per search, and free vs. paid search percentages
- Search log history: Table showing last 100 AI searches with timestamps, vehicle details, source, confidence, and cost
- Cost precision: Uses tenths of a cent (integer storage) to accurately track $0.005 Google API charges
- Database: `ai_search_logs` table with automatic logging of all predictions

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