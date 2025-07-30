# Podcast Analysis Platform

## Overview

This is a full-stack web application built for analyzing podcast guest compatibility and providing recommendations for podcast creators. The application helps users find suitable guests based on compatibility scores, trending topics, and audience overlap analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **Charts**: Chart.js for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL sessions with connect-pg-simple
- **API**: RESTful endpoints with JSON responses

### Development Tools
- **Build System**: Vite for frontend, esbuild for backend bundling
- **Database Migrations**: Drizzle Kit for schema management
- **Development**: Hot module replacement with Vite dev server

## Key Components

### Database Schema
The application uses four main entities:
- **Guests**: Store guest information including expertise, social media reach, and compatibility scores
- **Channels**: YouTube channel information with subscriber counts and engagement metrics
- **Analyses**: Compatibility analysis results with scoring algorithms
- **Trending Topics**: Regional trending topics for guest recommendation

### Core Features
1. **Dashboard**: Main interface for initiating analysis and viewing metrics
2. **Guest Search**: Autocomplete search functionality for finding potential guests
3. **Channel Analysis**: YouTube channel information extraction and analysis
4. **Compatibility Scoring**: Multi-factor scoring algorithm including audience overlap, topic alignment, and trending factors
5. **Results Visualization**: Radar charts and progress bars for score presentation

### API Services
- **YouTube Integration**: Service for extracting channel metadata (currently simulated)
- **Analysis Engine**: Compatibility scoring based on multiple factors
- **Search**: Guest and topic search functionality
- **Metrics**: Dashboard statistics and trending topic tracking

## Data Flow

1. **User Input**: Users provide YouTube channel URL and optional guest preferences
2. **Channel Analysis**: System extracts channel information and identifies topics
3. **Guest Matching**: Algorithm matches potential guests based on compatibility factors
4. **Score Calculation**: Multi-dimensional scoring including:
   - Audience overlap analysis
   - Topic compatibility
   - Trending factor assessment
   - Risk evaluation
5. **Result Presentation**: Scores displayed with visualizations and recommendations

### Storage Layer
- **Development**: In-memory storage with sample data
- **Production**: PostgreSQL database with Drizzle ORM
- **Session Management**: Server-side sessions for user state

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible components
- **Validation**: Zod for schema validation
- **HTTP Client**: Axios for API requests
- **Charts**: Chart.js for data visualization

### Development Dependencies
- **TypeScript**: Full type safety across the stack
- **Tailwind CSS**: Utility-first styling with custom design system
- **PostCSS**: CSS processing with autoprefixer

### Planned Integrations
- **YouTube Data API**: For real channel analysis (currently simulated)
- **Social Media APIs**: For guest social reach analysis
- **Analytics**: For usage tracking and optimization

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds optimized production bundle
2. **Backend**: esbuild bundles server code for Node.js deployment
3. **Database**: Drizzle migrations ensure schema consistency

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Environment variables for database connections and API keys
- **Database**: Requires `DATABASE_URL` environment variable

### Deployment Targets
- **Frontend**: Static files served by Express in production
- **Backend**: Node.js server with Express
- **Database**: PostgreSQL with connection pooling
- **Storage**: File-based sessions transitioning to database sessions

The application is designed for easy deployment on platforms like Replit, Vercel, or traditional hosting environments with Node.js support.
