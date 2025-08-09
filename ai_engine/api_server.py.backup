#!/usr/bin/env python3
# api_server.py - API-only server for AI engine (no frontend)

import asyncio
import json
import os
import subprocess
import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import traceback
from datetime import datetime

# Set environment variables for multi-GPU before importing ollama_client
os.environ['OLLAMA_NUM_PARALLEL'] = '2'
os.environ['OLLAMA_MAX_LOADED_MODELS'] = '1'
os.environ['CUDA_VISIBLE_DEVICES'] = '0,1,2,3,4,5'

# Import our modules
from podcast_guest_tracker import OneClickPodcastGuestTracker
from ollama_client import ollama_client

# Request models
class AnalyzeRequest(BaseModel):
    guest_name: str
    guest_url: str
    host_channel: str = "https://youtube.com/@lexfridman"
    field: str = "general"

# Create FastAPI app (API only, no HTML frontend)
app = FastAPI(title="Podcast Guest Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ensure_ollama_running():
    """Ensure Ollama is running with multi-GPU setup"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama is already running")
            return True
    except:
        pass
    
    print("🚀 Starting Ollama with Multi-GPU support...")
    
    # Kill existing Ollama processes
    subprocess.run(["pkill", "ollama"], capture_output=True)
    time.sleep(3)
    
    # Start Ollama with environment variables
    env = os.environ.copy()
    env.update({
        'OLLAMA_NUM_PARALLEL': '2',
        'OLLAMA_MAX_LOADED_MODELS': '1',
        'CUDA_VISIBLE_DEVICES': '0,1,2,3,4,5'
    })
    
    subprocess.Popen(["ollama", "serve"], env=env)
    
    # Wait for Ollama to start
    for i in range(30):
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                print("✅ Ollama started successfully")
                return True
        except:
            pass
        time.sleep(1)
    
    print("❌ Failed to start Ollama")
    return False

@app.get("/health")
async def health_check():
    is_connected, message = ollama_client.test_connection()
    return {
        "status": "healthy" if is_connected else "unhealthy",
        "ollama_status": message,
        "model": "llama3.1:8b",
        "multi_gpu": True,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/gpu-status")
async def gpu_status():
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=index,name,memory.used,memory.total", "--format=csv,noheader,nounits"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            gpu_info = result.stdout.strip().split('\n')
            status = f"6 GPUs detected: {len(gpu_info)} active"
            return {"status": status, "details": gpu_info}
        else:
            return {"status": "GPU status unavailable"}
    except:
        return {"status": "GPU monitoring failed"}

@app.post("/api/analyze")
async def analyze_guest(request: AnalyzeRequest):
    try:
        # Ensure Ollama is running
        if not ensure_ollama_running():
            raise HTTPException(status_code=500, detail="Failed to start Ollama with multi-GPU support")
        
        # Test connection
        is_connected, message = ollama_client.test_connection()
        if not is_connected:
            raise HTTPException(status_code=500, detail=f"LLM connection failed: {message}")
        
        # Initialize tracker
        tracker = OneClickPodcastGuestTracker()
        
        # Run analysis
        result = await tracker.analyze_podcast_guest_complete(
            guest_name=request.guest_name.strip(),
            guest_url=request.guest_url.strip(),
            host_channel_url=request.host_channel.strip()
        )
        
        return result
        
    except Exception as e:
        print(f"Analysis error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Podcast Guest Tracker API (No Frontend)")
    print("🎮 Using LLaMA 3.1 8B model")
    print("📊 API will be available at: http://localhost:8001")
    
    # Ensure Ollama is running before starting API
    ensure_ollama_running()
    
    port = int(os.getenv('PORT', 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)

