#!/bin/bash
# Install Dependencies for 1-Click Podcast Guest Tracker

# Core dependencies
pip install requests beautifulsoup4 selenium aiohttp asyncio
pip install yt-dlp youtube-transcript-api
pip install fuzzywuzzy python-levenshtein
pip install pandas numpy statistics
pip install python-dotenv

# Social media scraping (use carefully - check ToS)
pip install tweepy
pip install python-linkedin-v2

# Optional: For better web scraping
pip install playwright
pip install undetected-chromedriver

# For API server (optional)
pip install fastapi uvicorn pydantic

echo "Dependencies installed successfully!"
