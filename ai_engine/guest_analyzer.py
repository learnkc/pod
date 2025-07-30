# guest_analyzer_enhancements.py
# Add these components to your existing guest_analyzer.py

import json
import asyncio
from typing import Dict, List, Any
import requests
from datetime import datetime

class GuestAnalyzerEnhancements:
    """Missing components for your existing guest analyzer"""
    
    def __init__(self, mixtral_url="http://localhost:8080"):
        self.mixtral_url = mixtral_url
    
    def create_structured_guest_prompt(self, social_data: Dict[str, Any]) -> str:
        """Enhanced prompt specifically for guest profile extraction"""
        
        person_name = social_data.get("person_name", "Unknown")
        profiles = social_data.get("profiles", [])
        search_results = social_data.get("search_results", [])
        
        # Compile all available data
        all_content = []
        for profile in profiles:
            platform = profile.get('platform', 'unknown')
            if profile.get('bio'):
                all_content.append(f"[{platform.upper()}] Bio: {profile['bio']}")
            if profile.get('content_snippet'):
                all_content.append(f"[{platform.upper()}] Content: {profile['content_snippet'][:500]}")
            if profile.get('recent_tweets'):
                all_content.append(f"[{platform.upper()}] Recent posts: {' | '.join(profile['recent_tweets'][:3])}")
        
        for result in search_results[:3]:
            all_content.append(f"[WEB] {result['content'][:300]}")
        
        content_text = '\n'.join(all_content)
        
        prompt = f"""<s>[INST] Extract structured information about this person for podcast guest evaluation.

PERSON: {person_name}

AVAILABLE DATA:
{content_text}

Extract and format as JSON:
{{
    "name": "Full name of the person",
    "current_designation": "Current job title/role",
    "company": "Current company/organization",
    "industry": "Primary industry/field",
    "expertise_areas": ["area1", "area2", "area3"],
    "previous_podcasts": ["podcast name 1", "podcast name 2"] or ["Unable to determine"],
    "social_following": {{
        "twitter": "follower count or 'unknown'",
        "linkedin": "connection count or 'unknown'",
        "youtube": "subscriber count or 'unknown'"
    }},
    "authority_indicators": ["indicator1", "indicator2", "indicator3"],
    "key_topics": ["topic1", "topic2", "topic3"],
    "recent_activities": ["activity1", "activity2"],
    "credibility_score": 85,
    "popularity_indicators": ["metric1", "metric2"],
    "potential_interview_topics": ["topic1", "topic2", "topic3"],
    "bio_summary": "2-3 sentence professional summary"
}}

Respond with ONLY valid JSON. [/INST]"""
        
        return prompt
    
    def call_llama_for_guest_extraction(self, prompt: str) -> Dict[str, Any]:
        """Call local Llama model for guest data extraction"""
        try:
            payload = {
                "prompt": prompt,
                "n_predict": 2000,
                "temperature": 0.1,  # Low temperature for structured extraction
                "stop": ["</s>", "[/INST]"],
                "stream": False,
                "top_p": 0.8
            }
            
            response = requests.post(
                f"{self.mixtral_url}/completion",
                json=payload,
                timeout=120,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("content", "").strip()
                
                # Extract JSON from response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_str = content[json_start:json_end]
                    return json.loads(json_str)
            
            return self.create_fallback_guest_profile(prompt)
            
        except Exception as e:
            print(f"LLM extraction failed: {e}")
            return self.create_fallback_guest_profile(prompt)
    
    def create_fallback_guest_profile(self, original_prompt: str) -> Dict[str, Any]:
        """Create fallback profile when LLM fails"""
        return {
            "name": "Manual extraction needed",
            "current_designation": "Unable to determine",
            "company": "Unknown",
            "industry": "Requires manual analysis",
            "expertise_areas": ["Manual review required"],
            "previous_podcasts": ["Unable to determine"],
            "social_following": {
                "twitter": "unknown",
                "linkedin": "unknown", 
                "youtube": "unknown"
            },
            "authority_indicators": ["Requires manual verification"],
            "key_topics": ["Manual analysis needed"],
            "recent_activities": ["Check raw data"],
            "credibility_score": 50,
            "popularity_indicators": ["Manual assessment required"],
            "potential_interview_topics": ["To be determined"],
            "bio_summary": "Manual analysis required for accurate profile"
        }

# Add this method to your existing PremiumGuestAnalyzer class
async def extract_structured_guest_profile(self, social_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured guest profile using LLM"""
    enhancer = GuestAnalyzerEnhancements()
    
    prompt = enhancer.create_structured_guest_prompt(social_data)
    guest_profile = enhancer.call_llama_for_guest_extraction(prompt)
    
    # Add metadata
    guest_profile["extraction_metadata"] = {
        "timestamp": datetime.now().isoformat(),
        "data_quality_score": social_data.get("overall_quality_score", 0),
        "confidence_score": social_data.get("confidence_score", 0),
        "sources_used": social_data.get("data_sources", [])
    }
    
    return guest_profile
