# VehicleDB Pro

## Overview

VehicleDB Pro is a full-stack vehicle database management system that allows users to search, manage, and analyze vehicle compatibility data. The application provides functionality to search vehicles by make, model, and year, import vehicle data from CSV files, and view analytics on the database contents. Built with React on the frontend and Express on the backend, it uses PostgreSQL for data storage with Drizzle ORM for database operations.

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

**Key Pages & Components**
- Home page with tabbed navigation (Search, Manage Data, Analytics)
- VehicleSearch component for filtering vehicles by make/model/year with cascading dropdowns
- SearchResults component with pagination, sorting, and export functionality
- DataImport component for CSV file uploads with validation options
- AnalyticsDashboard for database statistics and insights

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
- GET `/api/vehicles/search` - Search vehicles with pagination and sorting
- GET `/api/vehicles/stats` - Retrieve database statistics
- GET `/api/vehicles/makes` - Get list of unique makes
- GET `/api/vehicles/models` - Get models filtered by make
- GET `/api/vehicles/years` - Get years filtered by make and model
- POST `/api/vehicles/import` - Import vehicles from CSV (uses Multer for file handling)
- DELETE `/api/vehicles` - Clear all vehicle data

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