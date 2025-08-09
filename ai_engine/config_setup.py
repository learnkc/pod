# config_setup.py - Configuration for 1-Click Podcast Guest Tracker

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # LLM Configuration
    OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama4:latest')
    
    # API Keys (optional - many scrapers work without them)
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
    TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN', '')
    LINKEDIN_CLIENT_ID = os.getenv('LINKEDIN_CLIENT_ID', '')
    
    # Scoring Weights (adjustable)
    TOPIC_ALIGNMENT_WEIGHT = 0.35
    AUTHORITY_WEIGHT = 0.25
    AUDIENCE_APPEAL_WEIGHT = 0.20
    UNIQUENESS_WEIGHT = 0.10
    ENGAGEMENT_WEIGHT = 0.10
    
    # Analysis Settings
    MAX_VIDEOS_TO_ANALYZE = 50
    MAX_SEARCH_RESULTS = 10
    CACHE_DURATION_HOURS = 24
    
    # Scraping Settings
    REQUEST_DELAY = 1.0  # Delay between requests
    MAX_RETRIES = 3
    TIMEOUT = 30
    
    # Output Settings
    GENERATE_DETAILED_REPORT = True
    SAVE_RAW_DATA = False
    OUTPUT_FORMAT = 'json'  # json, markdown, both

# Create .env file template
def create_env_template():
    env_template = """
# 1-Click Podcast Guest Tracker Configuration

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b

# Optional API Keys
YOUTUBE_API_KEY=your_youtube_api_key_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here

# Analysis Settings
MAX_VIDEOS_TO_ANALYZE=50
CACHE_DURATION_HOURS=24
"""
    
    with open('.env', 'w') as f:
        f.write(env_template.strip())
    
    print("Created .env template file. Please update with your settings.")

if __name__ == "__main__":
    create_env_template()

