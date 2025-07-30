#!/usr/bin/env python3
# web_app.py - Integrated Multi-GPU Ollama Setup

import asyncio
import json
import os
import subprocess
import time
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import traceback
from datetime import datetime

# Set environment variables for multi-GPU before importing ollama_client
os.environ['OLLAMA_NUM_PARALLEL'] = '2'
os.environ['OLLAMA_MAX_LOADED_MODELS'] = '1'
os.environ['CUDA_VISIBLE_DEVICES'] = '0,1,2,3,4,5'

# Import our modules
from podcast_guest_tracker import OneClickPodcastGuestTracker

# Updated Ollama Client for 70B Multi-GPU
import requests

class OllamaClient:
    def __init__(self):
        self.base_url = 'http://localhost:11434'
        self.model = "llama3.1:70b"
        self.max_retries = 3
        self.retry_delay = 5
    
    def generate_text(self, prompt, max_tokens=1000, temperature=0.7):
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "num_ctx": 4096,
                "num_gpu": 6,
                "num_thread": 32,
                "repeat_penalty": 1.1
            }
        }
        
        for attempt in range(self.max_retries):
            try:
                print(f"🤖 Calling LLM 70B Multi-GPU (attempt {attempt + 1}/{self.max_retries})...")
                response = requests.post(url, json=payload, timeout=300)
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "generated_text": result.get("response", ""),
                        "model": self.model
                    }
                else:
                    print(f"❌ LLM API returned status {response.status_code}")
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay)
                        continue
                    
            except Exception as e:
                print(f"❌ LLM error (attempt {attempt + 1}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                    continue
        
        return {
            "generated_text": "70B model analysis temporarily unavailable.",
            "model": self.model,
            "error": "All retry attempts failed"
        }
    
    def test_connection(self):
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m['name'] for m in models]
                if self.model in model_names:
                    return True, f"✅ Connected to Ollama. Model {self.model} available."
                else:
                    return False, f"❌ Model {self.model} not found. Available: {model_names}"
            return False, f"❌ Ollama not responding: {response.status_code}"
        except Exception as e:
            return False, f"❌ Connection failed: {str(e)}"

# Global instance
ollama_client = OllamaClient()

# Create FastAPI app
app = FastAPI(title="1-Click Podcast Guest Tracker", version="1.0.0")

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
        # Check if Ollama is responding
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
    for i in range(30):  # Wait up to 30 seconds
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

# Simple HTML template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>1-Click Podcast Guest Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        input[type="text"] { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        input[type="text"]:focus { border-color: #4CAF50; outline: none; }
        button { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 18px; width: 100%; margin-top: 10px; }
        button:hover { background: #45a049; }
        button:disabled { background: #cccccc; cursor: not-allowed; }
        .loading { display: none; text-align: center; margin-top: 20px; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .result { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px; border-left: 4px solid #4CAF50; }
        .error { background-color: #ffebee; border-left-color: #f44336; color: #c62828; }
        .score { font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; }
        .gpu-status { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎙️ 1-Click Podcast Guest Tracker</h1>
        <p class="subtitle">Powered by LLaMA 3.1 70B Multi-GPU</p>
        
        <div class="gpu-status" id="gpuStatus">
            <strong>🎮 Multi-GPU Status:</strong> Checking...
        </div>
        
        <form id="analysisForm" onsubmit="analyzeGuest(event)">
            <div class="form-group">
                <label for="guest_name">Guest Name:</label>
                <input type="text" id="guest_name" name="guest_name" required placeholder="e.g., Elon Musk">
            </div>
            
            <div class="form-group">
                <label for="guest_url">Guest URL (Twitter, LinkedIn, etc.):</label>
                <input type="text" id="guest_url" name="guest_url" required placeholder="e.g., https://twitter.com/elonmusk">
            </div>
            
            <div class="form-group">
                <label for="host_channel">Host YouTube Channel (optional):</label>
                <input type="text" id="host_channel" name="host_channel" placeholder="e.g., https://youtube.com/@lexfridman">
            </div>
            
            <button type="submit" id="submitBtn">🔍 Analyze Guest (70B Model)</button>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Analyzing with 70B model across 6 GPUs... This may take 2-3 minutes.</p>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        // Check GPU status on page load
        fetch('/gpu-status')
            .then(response => response.json())
            .then(data => {
                document.getElementById('gpuStatus').innerHTML = 
                    '<strong>🎮 Multi-GPU Status:</strong> ' + data.status;
            });

        async function analyzeGuest(event) {
            event.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Analyzing with 70B Model...';
            loading.style.display = 'block';
            result.innerHTML = '';
            
            try {
                const formData = new FormData(event.target);
                const response = await fetch('/analyze', { method: 'POST', body: formData });
                const data = await response.json();
                
                if (data.error) {
                    result.innerHTML = `<div class="result error"><h3>❌ Analysis Failed</h3><p><strong>Error:</strong> ${data.error}</p></div>`;
                } else {
                    const score = data.recommendation_summary?.overall_score || 0;
                    const recommendation = data.recommendation_summary?.recommendation || 'Unknown';
                    
                    result.innerHTML = `
                        <div class="result">
                            <h3>✅ Analysis Complete (70B Model)</h3>
                            <div class="score">Score: ${score}/100</div>
                            <p><strong>Recommendation:</strong> ${recommendation}</p>
                            <p><strong>Analysis Time:</strong> ${data.analysis_metadata?.total_analysis_time || 0}s</p>
                            <details>
                                <summary>Detailed Report</summary>
                                <pre style="white-space: pre-wrap; font-size: 12px;">${data.final_report || 'Report not available'}</pre>
                            </details>
                        </div>
                    `;
                }
            } catch (error) {
                result.innerHTML = `<div class="result error"><h3>❌ Connection Error</h3><p>${error.message}</p></div>`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '🔍 Analyze Guest (70B Model)';
                loading.style.display = 'none';
            }
        }
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse(content=HTML_TEMPLATE)

@app.get("/health")
async def health_check():
    is_connected, message = ollama_client.test_connection()
    return {
        "status": "healthy" if is_connected else "unhealthy",
        "ollama_status": message,
        "model": "llama3.1:70b",
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

@app.post("/analyze")
async def analyze_guest(
    guest_name: str = Form(...),
    guest_url: str = Form(...),
    host_channel: str = Form("")
):
    try:
        # Ensure Ollama is running
        if not ensure_ollama_running():
            return {"error": "Failed to start Ollama with multi-GPU support"}
        
        # Test connection
        is_connected, message = ollama_client.test_connection()
        if not is_connected:
            return {"error": f"LLM connection failed: {message}"}
        
        # Initialize tracker
        tracker = OneClickPodcastGuestTracker()
        
        # Use default if no host channel provided
        if not host_channel.strip():
            host_channel = "https://youtube.com/@lexfridman"
        
        # Run analysis
        result = await tracker.analyze_podcast_guest_complete(
            guest_name=guest_name.strip(),
            guest_url=guest_url.strip(),
            host_channel_url=host_channel.strip()
        )
        
        return result
        
    except Exception as e:
        print(f"Analysis error: {e}")
        traceback.print_exc()
        return {"error": f"Analysis failed: {str(e)}"}

if __name__ == "__main__":
    print("🚀 Starting 1-Click Podcast Guest Tracker with Multi-GPU 70B")
    print("🎮 Configuring 6x GTX 1080 Ti for LLaMA 3.1 70B")
    print("📊 Web interface will be available at: http://localhost:8000")
    
    # Ensure Ollama is running before starting web app
    ensure_ollama_running()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

