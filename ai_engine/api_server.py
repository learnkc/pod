# api_server.py - Minimal update for Llama 4 compatibility
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import ollama
import os
from typing import Optional, List, Dict, Any
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Podcast Guest Analysis AI Engine", version="2.0.0")

# Model Configuration - UPDATED TO LLAMA 4
OLLAMA_MODEL = "llama4:latest"  # Changed from previous model
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# Initialize Ollama client directly
try:
    client = ollama.Client(host=OLLAMA_URL)
    logger.info(f"Initialized Ollama client with model: {OLLAMA_MODEL}")
except Exception as e:
    logger.error(f"Failed to initialize Ollama client: {str(e)}")
    client = None

class GuestAnalysisRequest(BaseModel):
    guest_profile: str
    host_channel_data: str
    analysis_type: str = "enhanced"
    
class AnalysisResponse(BaseModel):
    compatibility_score: float
    relevance_score: float
    analysis_summary: str
    recommendations: List[str]
    detailed_analysis: Dict[str, Any]

class StatusResponse(BaseModel):
    ai_engine_status: str
    ollama_status: str
    model: str
    model_loaded: bool

@app.get("/api/ai/status", response_model=StatusResponse)
async def get_ai_status():
    """Check AI engine and Ollama status"""
    try:
        if not client:
            return StatusResponse(
                ai_engine_status="error",
                ollama_status="disconnected",
                model=OLLAMA_MODEL,
                model_loaded=False
            )
            
        # Check if Ollama is running
        models = client.list()
        
        # Check if our model is available
        model_loaded = any(OLLAMA_MODEL in model['name'] for model in models['models'])
        
        if not model_loaded:
            logger.info(f"Model {OLLAMA_MODEL} not found. Available models: {[m['name'] for m in models['models']]}")
        
        return StatusResponse(
            ai_engine_status="running",
            ollama_status="connected",
            model=OLLAMA_MODEL,
            model_loaded=model_loaded
        )
    except Exception as e:
        logger.error(f"Status check failed: {str(e)}")
        return StatusResponse(
            ai_engine_status="error",
            ollama_status="unknown",
            model=OLLAMA_MODEL,
            model_loaded=False
        )

@app.post("/api/ai/analyze", response_model=AnalysisResponse)
async def analyze_guest_compatibility(request: GuestAnalysisRequest):
    """Analyze guest compatibility using Llama 4"""
    try:
        if not client:
            raise HTTPException(status_code=503, detail="Ollama client not initialized")

        # Check if model is available, pull if not
        try:
            models = client.list()
            model_available = any(OLLAMA_MODEL in model['name'] for model in models['models'])
            
            if not model_available:
                logger.info(f"Model {OLLAMA_MODEL} not found. Attempting to pull...")
                client.pull(OLLAMA_MODEL)
                logger.info(f"Successfully pulled {OLLAMA_MODEL}")
        except Exception as pull_error:
            logger.error(f"Failed to pull model {OLLAMA_MODEL}: {str(pull_error)}")
            raise HTTPException(status_code=500, detail=f"Model {OLLAMA_MODEL} not available")

        # Construct analysis prompt
        analysis_prompt = f"""
You are an expert podcast guest analysis assistant. Analyze the compatibility between this potential guest and podcast host.

GUEST PROFILE:
{request.guest_profile}

HOST CHANNEL DATA:
{request.host_channel_data}

Provide a detailed analysis with:
1. Compatibility score (0-100) - How well do their topics, audience, and style align?
2. Relevance score (0-100) - How relevant is this guest to the host's niche?
3. Analysis summary - Key insights about the potential collaboration
4. Recommendations - Specific actionable advice

Respond in JSON format:
{{
    "compatibility_score": <number>,
    "relevance_score": <number>,
    "analysis_summary": "<detailed analysis>",
    "recommendations": ["<rec1>", "<rec2>", "<rec3>"],
    "detailed_analysis": {{
        "topic_alignment": "<analysis>",
        "audience_overlap": "<analysis>",
        "content_style": "<analysis>",
        "collaboration_potential": "<analysis>"
    }}
}}
        """

        # Generate response using Llama 4
        response = client.chat(
            model=OLLAMA_MODEL,
            messages=[
                {
                    'role': 'system',
                    'content': 'You are an expert podcast guest compatibility analyst. Provide detailed, actionable insights in JSON format.'
                },
                {
                    'role': 'user',
                    'content': analysis_prompt
                }
            ],
            options={
                'temperature': 0.7,
                'num_predict': 2048,
                'top_p': 0.9,
                'top_k': 40
            }
        )

        # Parse the response
        analysis_content = response['message']['content']
        logger.info(f"Raw response from {OLLAMA_MODEL}: {analysis_content[:200]}...")
        
        try:
            # Extract JSON from response
            json_start = analysis_content.find('{')
            json_end = analysis_content.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_content = analysis_content[json_start:json_end]
                parsed_result = json.loads(json_content)
                
                return AnalysisResponse(
                    compatibility_score=float(parsed_result.get('compatibility_score', 70)),
                    relevance_score=float(parsed_result.get('relevance_score', 65)),
                    analysis_summary=parsed_result.get('analysis_summary', 'Analysis completed successfully'),
                    recommendations=parsed_result.get('recommendations', ['Review the detailed analysis']),
                    detailed_analysis=parsed_result.get('detailed_analysis', {})
                )
            else:
                # No JSON found, create response from text
                return AnalysisResponse(
                    compatibility_score=75.0,
                    relevance_score=70.0,
                    analysis_summary=analysis_content,
                    recommendations=["Review the detailed analysis provided"],
                    detailed_analysis={"raw_response": analysis_content}
                )
                
        except json.JSONDecodeError as json_error:
            logger.warning(f"JSON parsing failed: {str(json_error)}")
            # Return response with raw content
            return AnalysisResponse(
                compatibility_score=75.0,
                relevance_score=70.0,
                analysis_summary=analysis_content,
                recommendations=["Analysis completed - review summary for insights"],
                detailed_analysis={"parsing_note": "Raw response provided due to JSON parsing issue"}
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Guest analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if client else "unhealthy", 
        "model": OLLAMA_MODEL,
        "client_initialized": client is not None
    }

@app.get("/api/ai/model-info")
async def get_model_info():
    """Get information about the current model"""
    if not client:
        raise HTTPException(status_code=503, detail="Ollama client not initialized")
    
    try:
        models = client.list()
        current_model_info = next((m for m in models['models'] if OLLAMA_MODEL in m['name']), None)
        
        return {
            "model": OLLAMA_MODEL,
            "model_info": current_model_info,
            "all_models": [m['name'] for m in models['models']],
            "status": "active"
        }
    except Exception as e:
        logger.error(f"Failed to get model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve model information: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Log startup information
    logger.info(f"Starting Podcast Guest Analysis AI Engine")
    logger.info(f"Model: {OLLAMA_MODEL}")
    logger.info(f"Ollama URL: {OLLAMA_URL}")
    logger.info(f"Client Status: {'Initialized' if client else 'Failed'}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        log_level="info"
    )
