# 1-Click Podcast Guest Tracker

A comprehensive system for analyzing potential podcast guests and determining their relevance to a host's YouTube channel.

## Overview

This system takes minimal input (guest name and URL) and provides a detailed analysis of the guest's fit for a podcast channel. It:

1. Scrapes and analyzes guest profiles from social media and web searches
2. Analyzes the host's YouTube channel to understand what content performs well
3. Uses LLaMA 3.1 models for analysis and summarization
4. Calculates a relevance score to determine guest-host fit
5. Provides detailed recommendations and reports

## Features

- **Guest Analysis**: Extract comprehensive profiles from social media and web searches
- **Channel Analysis**: Understand what content performs well on the host's channel
- **Relevance Scoring**: Calculate match scores between guests and hosts
- **LLM Integration**: Use LLaMA 3.1 models for advanced analysis
- **Web Interface**: Easy-to-use web app for quick analysis
- **CLI Tool**: Command-line interface for automation

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   ./install_deps.sh
   ```
3. Set up LLaMA 3.1 models (70B and 8B parameter versions)
4. Configure API keys (optional) in `.env` file

## Usage

### Command Line Interface

```bash
python run_analyzer.py "Guest Name" "https://twitter.com/guest_handle" "https://youtube.com/@host_channel"
```

### Web Interface

```bash
python web_app.py
```

Then open your browser to http://localhost:12000

### API

```bash
uvicorn api:app --host 0.0.0.0 --port 12000
```

## Components

- `podcast_guest_tracker.py`: Main integration system
- `guest_analyzer.py`: Guest profile extraction and analysis
- `host_channel_analyzer.py`: YouTube channel performance analysis
- `relevance_scoring_engine.py`: Scoring and recommendation system
- `config_setup.py`: Configuration settings
- `main_cli.py`: Command-line interface
- `web_app.py`: Web interface
- `test_script.py`: Testing script

## Configuration

Create a `.env` file with the following variables:

```
MIXTRAL_URL=http://localhost:8080
TWITTER_API_KEY=your_key_here
TWITTER_API_SECRET=your_secret_here
LINKEDIN_API_KEY=your_key_here
LINKEDIN_API_SECRET=your_secret_here
```

## Testing

Run the test script to verify the system is working:

```bash
python test_script.py
```

## License

MIT
