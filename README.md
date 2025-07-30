# Podcast Guest Tracker

A comprehensive platform for podcast hosts to find and evaluate potential guests using AI-powered analysis.

## Overview

This application integrates a React/Express frontend/backend with an AI engine powered by Llama 3.1 through Ollama. It helps podcast hosts:

1. Find suitable guests based on compatibility scores
2. Analyze guest profiles from social media
3. Compare with the host's YouTube channel performance
4. Get AI-powered recommendations and relevance scores

## System Architecture

### Frontend
- React 18 with TypeScript
- shadcn/ui components
- Tailwind CSS
- React Query for state management
- Wouter for routing

### Backend
- Express.js server with TypeScript
- PostgreSQL with Drizzle ORM
- RESTful API endpoints

### AI Engine
- Python FastAPI server
- Llama 3.1 (70B) through Ollama
- Social media scraping and analysis
- YouTube channel performance analysis
- Relevance scoring engine

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL database
- Ollama (for Llama 3.1 model)

### Installation

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd podcast-guest-tracker
   ```

2. **Install Node.js dependencies**
   ```
   npm install
   ```

3. **Set up the AI engine**
   ```
   npm run setup:ai
   ```
   This will:
   - Create a Python virtual environment
   - Install Python dependencies
   - Install Ollama (if not already installed)
   - Pull the Llama 3.1 model

4. **Set up environment variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/podcast_tracker
   OLLAMA_URL=http://localhost:11434
   ```

5. **Initialize the database**
   ```
   npm run db:push
   ```

## Running the Application

### Development Mode

1. **Start the Express backend and React frontend**
   ```
   npm run dev
   ```

2. **Start the AI engine in a separate terminal**
   ```
   npm run start:ai
   ```

3. **Access the application**
   Open your browser to http://localhost:5000

### Production Mode

1. **Build the application**
   ```
   npm run build
   ```

2. **Start the application**
   ```
   npm start
   ```

## API Endpoints

### Standard Endpoints
- `GET /api/metrics` - Get dashboard metrics
- `GET /api/trending-topics` - Get trending topics
- `GET /api/guests/search` - Search for guests
- `GET /api/guests` - Get all guests
- `POST /api/analyze` - Analyze guest compatibility (standard)
- `GET /api/analyses/:channelId?` - Get analysis history

### AI-Enhanced Endpoints
- `GET /api/ai/status` - Check AI engine and Ollama status
- `POST /api/ai/analyze` - Analyze guest with Llama 3.1 (enhanced)

## Features

1. **Dashboard** - Main interface for initiating analysis and viewing metrics
2. **Guest Search** - Find potential guests with autocomplete
3. **Channel Analysis** - Extract and analyze YouTube channel information
4. **Compatibility Scoring** - Multi-factor scoring algorithm
5. **Results Visualization** - Charts and progress bars for score presentation
6. **AI-Powered Analysis** - Enhanced analysis with Llama 3.1

## Integration Details

The application integrates two systems:
1. **Replit MVP** - Frontend and backend for user interface and data storage
2. **AI Engine** - Python-based analysis with Llama 3.1

The integration is achieved through:
- API communication between Express and FastAPI
- Shared data models and transformation layers
- Automatic process management for the AI engine

## Troubleshooting

- **AI Engine not starting**: Check if Python and dependencies are installed correctly
- **Ollama connection issues**: Ensure Ollama is running with `ollama serve`
- **Database connection errors**: Verify your DATABASE_URL is correct
- **Long analysis times**: LLM inference can take time, especially for the 70B model