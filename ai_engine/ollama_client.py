# Replace your ollama_client.py with this:
#!/usr/bin/env python3
import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

class OllamaClient:
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        self.model = "llama3.1:8b"  # 8B model for better performance
        self.max_retries = 3
        self.retry_delay = 5
    
    def generate_text(self, prompt, max_tokens=1000, temperature=0.7):
        """Generate text with 8B model"""
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "num_ctx": 4096,
                "repeat_penalty": 1.1
            }
        }
        
        for attempt in range(self.max_retries):
            try:
                print(f"🤖 Calling LLM 8B (attempt {attempt + 1}/{self.max_retries})...")
                response = requests.post(url, json=payload, timeout=300)  # 5 minute timeout
                
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
            "generated_text": "LLM analysis temporarily unavailable.",
            "model": self.model,
            "error": "All retry attempts failed"
        }
    
    def test_connection(self):
        """Test connection to Ollama"""
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

