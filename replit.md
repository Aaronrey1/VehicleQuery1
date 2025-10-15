# VehicleDB Pro

## Overview

VehicleDB Pro is a full-stack vehicle database management system that allows users to search, manage, and analyze vehicle compatibility data. The application provides functionality to search vehicles by make, model, and year, import vehicle data from CSV files, and view analytics on the database contents. Additionally, the Geometris feature enables searching for harness types based on vehicle make, model, and year ranges. Built with React on the frontend and Express on the backend, it uses PostgreSQL for data storage with Drizzle ORM for database operations.

## Recent Changes

Added AI Search Billing & Usage Tracking:
- **New "Billing" tab** provides comprehensive cost tracking for AI Search usage
- **Usage Analytics**: Real-time tracking of all AI predictions with breakdown by tier (Tier 1, Tier 2, Google API)
- **Cost Monitoring**: Displays total costs, cost per search, and free vs. paid search percentages
- **Search Log History**: Table showing last 100 AI searches with timestamps, vehicle details, source, confidence, and cost
- **Tier Breakdown Cards**: Visual breakdown of searches by tier with clear FREE/PAID badges
- **Cost Structure Display**: Alert explaining cost model ($0.005 per Google search, database predictions free)
- Database schema: `ai_search_logs` table tracks make, model, year, source, confidence, and cost for each prediction
- Backend endpoints: GET `/api/billing/stats` for billing statistics
- Component: `client/src/components/billing.tsx`
- Automatic logging: All AI predictions automatically logged to database for cost tracking

Added AI Search feature with hybrid prediction system (Database + Google Custom Search):
- **New "AI Search" tab** provides intelligent predictions for vehicles not in database
- **Free text input** - Type ANY make/model, even those not in the database (e.g., Tesla Model 3, Rivian R1T, future vehicles)
- **3-Tier Hybrid System**:
  1. **Tier 1 (Database - Free)**: Two-step prediction using 31K+ vehicle records with ±5 year window for same make/model (high confidence 80-100%)
  2. **Tier 2 (Database - Free)**: Fallback ±10 year window for broader manufacturer matches (reduced confidence 60%)
  3. **Tier 3 (Google - Paid)**: Google Custom Search API when no database matches found (low confidence 20-40%, $5 per 1,000 searches after 100 free daily)
- **Two-Step Prediction Algorithm**: First predicts port type from similar vehicles, then filters by port and predicts device type
- **Confidence Explanation UI**: Info box at top explains what prediction percentages mean (80-100% high, 60-79% medium, 20-59% low)
- **Color-Coded Badges**: Green (high confidence), Yellow (medium), Orange (low) - matches explanation
- Shows separate confidence scores for port type and device type predictions
- UI distinguishes Google predictions (purple alert) from database predictions (blue alert)
- Google search results hidden from UI to keep interface clean (predictions still shown)
- Cost-efficient: Google only called as last resort when database has no matches
- Component: `client/src/components/ai-search.tsx`
- Backend endpoint: GET `/api/ai/predict` with Google Custom Search fallback

Added smart manufacturer alias matching across ALL search features:
- **Manufacturer Nicknames**: System recognizes common abbreviations and aliases
  - "Chevy" or "Chev" → "CHEVROLET"
  - "VW" → "VOLKSWAGEN"
  - "Benz", "Mercedes", or "MB" → "MERCEDES-BENZ"
  - "Jag" → "JAGUAR"
  - "Lambo" → "LAMBORGHINI"
  - "Olds" → "OLDSMOBILE"
  - And 50+ more common aliases
- **Works everywhere**: Regular Search, Bulk Search, and AI Search all use the same normalization
- **Consistent UX**: Users can type "Chevy Silverado" and it will find "CHEVROLET Silverado" vehicles
- Implementation: `normalizeMake()` function in `server/routes.ts` applied to all search endpoints

Previously implemented:
- 525 harness records automatically load on server startup if database is empty
- Harness data stored in `server/seed-harnesses.ts` and loads on both preview and published environments
- Updated schema to make yearFrom/yearTo nullable to support all harness configurations
- Fixed session persistence on published app by using memorystore, explicit session.save(), and trust proxy configuration
- Fixed session cookie settings for authentication (sameSite: "lax", resave: true, saveUninitialized: true)
- Fixed admin panel cache refresh by using refetchQueries instead of invalidateQueries
- Data persists across republishing - no manual CSV import needed on published app
- Added 9 Peterbilt, Kenworth, and Mack vehicles to development database

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- Uses React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component System**
- Radix UI primitives for accessible, unstyled components
- Shadcn/ui component library built on top of Radix UI
- Tailwind CSS for styling with CSS variables for theming
- Custom design system with neutral color scheme and CSS variable-based theming

**State Management**
- TanStack Query (React Query) for server state management
- Custom query client with configured defaults (no refetch on window focus, infinite stale time)
- Local component state for UI interactions
- Important: Due to `staleTime: Infinity`, mutations must use `refetchQueries` instead of `invalidateQueries` to force immediate cache updates (see Geometris component for reference implementation)

**Key Pages & Components**
- Home page with tabbed navigation (Search, Bulk Search, AI Search, Manage Data, Geometris, Analytics, Billing, Admin)
- VehicleSearch component for filtering vehicles by make/model/year with cascading dropdowns and advanced filtering
- SearchResults component with pagination, sorting, and export functionality (CSV)
- BulkSearch component for searching multiple vehicles simultaneously
- AISearch component for pattern-based predictions using existing database (free AI features)
  - Smart predictions for vehicles not in database
  - ±5 year window matching for same make/model with high confidence
  - ±10 year fallback for broader manufacturer matches with reduced confidence
  - Displays similar vehicles used for predictions with confidence scoring
- Geometris component for searching harness types by make/model/year with year range support
- DataImport component for CSV file uploads with validation options
- AnalyticsDashboard for database statistics and insights
- Billing component for AI Search cost tracking and usage analytics
- AdminPanel component for CRUD operations on individual vehicle records

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- ESM module system (type: "module" in package.json)
- Custom middleware for request logging and JSON response capture

**API Structure**
- RESTful API endpoints under `/api` prefix
- Route handlers defined in `server/routes.ts`
- Storage layer abstraction via `IStorage` interface in `server/storage.ts`

**Key API Endpoints**

Vehicle Endpoints:
- GET `/api/vehicles/search` - Search vehicles with pagination, sorting, and filtering (device type, port type)
- GET `/api/vehicles/:id` - Get single vehicle by ID
- POST `/api/vehicles` - Create new vehicle with validation
- PATCH `/api/vehicles/:id` - Update vehicle (partial updates)
- DELETE `/api/vehicles/:id` - Delete single vehicle
- POST `/api/vehicles/bulk-search` - Search multiple vehicles simultaneously
- GET `/api/vehicles/stats` - Retrieve database statistics
- GET `/api/vehicles/makes` - Get list of unique makes
- GET `/api/vehicles/models` - Get models filtered by make
- GET `/api/vehicles/years` - Get years filtered by make and model
- GET `/api/vehicles/device-types` - Get list of unique device types
- GET `/api/vehicles/port-types` - Get list of unique port types
- POST `/api/vehicles/import` - Import vehicles from CSV/JSON (uses Multer for file handling)
- DELETE `/api/vehicles` - Clear all vehicle data

Harness Endpoints (Geometris):
- GET `/api/harnesses/search` - Search harnesses by make, model, and year with year range matching
- GET `/api/harnesses/makes` - Get list of unique harness makes
- GET `/api/harnesses/models/:make` - Get harness models for a specific make
- GET `/api/harnesses/stats` - Retrieve harness database statistics
- POST `/api/harnesses/import` - Import harnesses from CSV (requires authentication)
- PATCH `/api/harnesses/:id` - Update individual harness record (requires authentication)
- DELETE `/api/harnesses/:id` - Delete individual harness record (requires authentication)
- DELETE `/api/harnesses` - Clear all harness data (requires authentication)

AI Prediction Endpoint:
- GET `/api/ai/predict` - Pattern-based predictions for vehicles not in database
  - Query params: make, model, year
  - Returns exact match if found, otherwise generates prediction using:
    - Primary: Same make/model vehicles within ±5 years (high confidence)
    - Fallback: Same make vehicles within ±10 years (reduced confidence 60%)
  - Response includes deviceType, portType, confidence score, and similar vehicles used
  - Automatically logs all predictions to ai_search_logs table for billing tracking

Billing Endpoints:
- GET `/api/billing/stats` - Retrieve AI Search billing statistics and usage analytics
  - Returns total searches, free vs. paid breakdown, tier statistics, total cost, and recent search logs

### Data Storage

**Database**
- PostgreSQL via Neon serverless driver
- Connection pooling with `@neondatabase/serverless`
- WebSocket support for serverless environments

**ORM & Schema**
- Drizzle ORM for type-safe database operations
- Schema defined in `shared/schema.ts` for shared types between client and server
- Zod for runtime validation and schema inference

**Database Schema**
- `vehicles` table with columns: id (UUID), make, model, year, deviceType, portType
  - Indexes on make, model, year, and composite index on make+model+year for query optimization
- `harnesses` table with columns: id (UUID), make, model, yearFrom (nullable), yearTo (nullable), harnessType, comments
  - yearFrom and yearTo are nullable to support vehicles with unknown or unspecified year ranges
  - Supports year range searches (e.g., find harnesses where search year falls within yearFrom-yearTo range)
  - Indexes on make, model, yearFrom, yearTo for efficient filtering
- `ai_search_logs` table with columns: id (UUID), timestamp, make, model, year, source (tier), confidence, cost (in tenths of a cent)
  - Tracks all AI Search predictions for billing and usage analytics
  - Source values: 'database_tier1', 'database_tier2', 'google_api'
  - Cost: 0 for database predictions, 5 for Google API calls (5 tenths of a cent = $0.005)
  - Indexes on timestamp and source for efficient querying
- `users` table for authentication (id, username, password)

**Data Validation**
- Drizzle-Zod integration for automatic schema validation
- Insert and search schema validators
- Type inference from database schema for TypeScript types

### External Dependencies

**Core Runtime Dependencies**
- `@neondatabase/serverless` - PostgreSQL database driver for serverless environments
- `drizzle-orm` - TypeScript ORM with type-safe queries
- `express` - Web server framework
- `react` & `react-dom` - Frontend UI library
- `@tanstack/react-query` - Server state management

**File Processing**
- `multer` - Multipart form data handling for file uploads
- `csv-parser` - CSV file parsing for vehicle data import

**UI Component Libraries**
- `@radix-ui/*` - Accessible component primitives (20+ components)
- `class-variance-authority` - Utility for managing component variants
- `tailwindcss` - Utility-first CSS framework
- `cmdk` - Command menu component

**Form Management**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Validation resolver integration
- `zod` - Schema validation library

**Development Tools**
- `vite` - Build tool and dev server
- `tsx` - TypeScript execution for Node.js
- `drizzle-kit` - Database migration tool
- `@replit/vite-plugin-*` - Replit-specific development plugins

**Routing & Navigation**
- `wouter` - Lightweight client-side routing

**Date & Utility Libraries**
- `date-fns` - Date manipulation and formatting
- `clsx` & `tailwind-merge` - Conditional className utilities
- `nanoid` - Unique ID generation