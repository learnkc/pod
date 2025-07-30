#!/usr/bin/env python3
# guest_analyzer_base.py - Enhanced guest profile analysis

import asyncio
import aiohttp
import requests
from bs4 import BeautifulSoup
import json
import re
import time
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse, urljoin
import os
from dotenv import load_dotenv
from ollama_client import ollama_client

load_dotenv()

class PremiumGuestAnalyzer:
    """Advanced guest profile analyzer with comprehensive social media scraping"""
    
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def extract_enhanced_person_name(self, url: str) -> str:
        """Extract person name from various URL formats"""
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            path = parsed_url.path
            
            if 'twitter.com' in domain or 'x.com' in domain:
                # Extract from Twitter URL
                username = path.strip('/').split('/')[0]
                return username.replace('@', '').title()
            
            elif 'linkedin.com' in domain:
                # Extract from LinkedIn URL
                if '/in/' in path:
                    name_part = path.split('/in/')[1].split('/')[0]
                    return name_part.replace('-', ' ').title()
            
            elif 'youtube.com' in domain:
                # Extract from YouTube URL
                if '/@' in path:
                    username = path.split('/@')[1].split('/')[0]
                    return username.replace('-', ' ').title()
                elif '/c/' in path:
                    username = path.split('/c/')[1].split('/')[0]
                    return username.replace('-', ' ').title()
            
            # Fallback: try to extract from domain or path
            if path and len(path) > 1:
                name_candidate = path.strip('/').split('/')[0]
                if name_candidate and not name_candidate.isdigit():
                    return name_candidate.replace('-', ' ').replace('_', ' ').title()
            
            return "Unknown Guest"
            
        except Exception as e:
            print(f"Error extracting name from URL: {e}")
            return "Unknown Guest"
    
    async def scrape_twitter_profile(self, url: str) -> Dict[str, Any]:
        """Scrape Twitter profile information"""
        try:
            # Try multiple approaches for Twitter scraping
            profile_data = {}
            
            # Method 1: Direct scraping (may be limited)
            if self.session:
                async with self.session.get(url, timeout=10) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Extract basic info from meta tags
                        title_tag = soup.find('title')
                        if title_tag:
                            profile_data['title'] = title_tag.get_text()
                        
                        # Look for JSON-LD data
                        json_scripts = soup.find_all('script', type='application/ld+json')
                        for script in json_scripts:
                            try:
                                data = json.loads(script.string)
                                if isinstance(data, dict) and 'name' in data:
                                    profile_data['name'] = data['name']
                                    profile_data['description'] = data.get('description', '')
                            except:
                                continue
            
            # Extract username from URL as fallback
            username = self.extract_enhanced_person_name(url)
            if not profile_data.get('name'):
                profile_data['name'] = username
            
            profile_data['platform'] = 'Twitter'
            profile_data['url'] = url
            profile_data['username'] = username
            
            return profile_data
            
        except Exception as e:
            print(f"Twitter scraping error: {e}")
            return {'platform': 'Twitter', 'url': url, 'error': str(e)}
    
    async def scrape_linkedin_profile(self, url: str) -> Dict[str, Any]:
        """Scrape LinkedIn profile information"""
        try:
            profile_data = {}
            
            if self.session:
                async with self.session.get(url, timeout=10) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Extract from meta tags
                        og_title = soup.find('meta', property='og:title')
                        if og_title:
                            profile_data['name'] = og_title.get('content', '')
                        
                        og_description = soup.find('meta', property='og:description')
                        if og_description:
                            profile_data['description'] = og_description.get('content', '')
                        
                        # Look for structured data
                        json_scripts = soup.find_all('script', type='application/ld+json')
                        for script in json_scripts:
                            try:
                                data = json.loads(script.string)
                                if isinstance(data, dict):
                                    profile_data.update({
                                        'name': data.get('name', profile_data.get('name', '')),
                                        'job_title': data.get('jobTitle', ''),
                                        'company': data.get('worksFor', {}).get('name', '') if isinstance(data.get('worksFor'), dict) else ''
                                    })
                            except:
                                continue
            
            profile_data['platform'] = 'LinkedIn'
            profile_data['url'] = url
            
            return profile_data
            
        except Exception as e:
            print(f"LinkedIn scraping error: {e}")
            return {'platform': 'LinkedIn', 'url': url, 'error': str(e)}
    
    async def perform_web_search(self, person_name: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform web search to gather additional information"""
        try:
            search_results = []
            
            # Use DuckDuckGo for search (no API key required)
            search_query = f"{person_name} biography professional background"
            
            # Simple web search simulation (in production, you'd use actual search APIs)
            search_results.append({
                'title': f"{person_name} - Professional Profile",
                'snippet': f"Information about {person_name}'s professional background and expertise.",
                'url': f"https://example.com/{person_name.lower().replace(' ', '-')}",
                'source': 'Web Search'
            })
            
            return search_results[:max_results]
            
        except Exception as e:
            print(f"Web search error: {e}")
            return []
    
    async def comprehensive_person_analysis(self, person_name: str, primary_url: str) -> Dict[str, Any]:
        """Comprehensive analysis combining all data sources"""
        print(f"🔍 Analyzing: {person_name}")
        print(f"🔗 Primary URL: {primary_url}")
        
        analysis_data = {
            'person_name': person_name,
            'primary_url': primary_url,
            'analysis_timestamp': time.time(),
            'data_sources': []
        }
        
        try:
            # Determine platform and scrape accordingly
            if 'twitter.com' in primary_url or 'x.com' in primary_url:
                print("📱 Scraping Twitter profile...")
                twitter_data = await self.scrape_twitter_profile(primary_url)
                analysis_data['twitter_data'] = twitter_data
                analysis_data['data_sources'].append('Twitter')
            
            elif 'linkedin.com' in primary_url:
                print("💼 Scraping LinkedIn profile...")
                linkedin_data = await self.scrape_linkedin_profile(primary_url)
                analysis_data['linkedin_data'] = linkedin_data
                analysis_data['data_sources'].append('LinkedIn')
            
            # Perform web search for additional context
            print("🔍 Performing web search...")
            search_results = await self.perform_web_search(person_name)
            analysis_data['web_search_results'] = search_results
            analysis_data['data_sources'].append('Web Search')
            
            # Calculate data quality score
            quality_score = self.calculate_data_quality(analysis_data)
            analysis_data['data_quality_score'] = quality_score
            
            print(f"✅ Analysis complete. Quality: {quality_score}/100")
            
            return analysis_data
            
        except Exception as e:
            print(f"Analysis error: {e}")
            analysis_data['error'] = str(e)
            return analysis_data
    
    def calculate_data_quality(self, data: Dict[str, Any]) -> int:
        """Calculate quality score based on available data"""
        score = 0
        
        # Base score for having primary URL
        if data.get('primary_url'):
            score += 20
        
        # Score for social media data
        if data.get('twitter_data') and not data['twitter_data'].get('error'):
            score += 30
        
        if data.get('linkedin_data') and not data['linkedin_data'].get('error'):
            score += 30
        
        # Score for web search results
        if data.get('web_search_results'):
            score += 20
        
        return min(score, 100)
    
    async def extract_structured_guest_profile(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured profile using LLM"""
        
        # Prepare data for LLM analysis
        person_name = analysis_data.get('person_name', 'Unknown')
        
        # Compile all available information
        info_text = f"Person: {person_name}\n"
        
        if analysis_data.get('twitter_data'):
            twitter = analysis_data['twitter_data']
            info_text += f"Twitter: {twitter.get('description', '')}\n"
        
        if analysis_data.get('linkedin_data'):
            linkedin = analysis_data['linkedin_data']
            info_text += f"LinkedIn: {linkedin.get('description', '')}\n"
            info_text += f"Job Title: {linkedin.get('job_title', '')}\n"
            info_text += f"Company: {linkedin.get('company', '')}\n"
        
        if analysis_data.get('web_search_results'):
            for result in analysis_data['web_search_results'][:3]:
                info_text += f"Web Info: {result.get('snippet', '')}\n"
        
        # LLM prompt for structured extraction
        prompt = f"""
Analyze the following information about a person and extract a structured profile:

{info_text}

Please provide a JSON response with the following structure:
{{
    "name": "Full name",
    "current_designation": "Current job title/role",
    "company": "Current company/organization",
    "industry": "Industry they work in",
    "expertise_areas": ["area1", "area2", "area3"],
    "authority_indicators": ["credential1", "credential2"],
    "social_following": {{"platform": "follower_count"}},
    "potential_interview_topics": ["topic1", "topic2", "topic3"],
    "estimated_authority_level": "HIGH/MEDIUM/LOW",
    "brief_bio": "2-3 sentence professional summary"
}}

Focus on professional information and expertise areas that would be relevant for podcast interviews.
"""
        
        try:
            response = ollama_client.generate_text(prompt, max_tokens=800, temperature=0.3)
            llm_response = response.get('generated_text', '')
            
            # Try to parse JSON response
            try:
                # Extract JSON from response if it's wrapped in text
                json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
                if json_match:
                    structured_profile = json.loads(json_match.group())
                else:
                    # Fallback structured response
                    structured_profile = {
                        "name": person_name,
                        "current_designation": "Unknown",
                        "company": "Unknown",
                        "industry": "Unknown",
                        "expertise_areas": ["General expertise"],
                        "authority_indicators": ["Professional background"],
                        "social_following": {"unknown": "unknown"},
                        "potential_interview_topics": ["Professional experience", "Industry insights"],
                        "estimated_authority_level": "MEDIUM",
                        "brief_bio": f"Professional with expertise in their field."
                    }
            except json.JSONDecodeError:
                # Create fallback profile
                structured_profile = {
                    "name": person_name,
                    "current_designation": "Unknown",
                    "company": "Unknown", 
                    "industry": "Unknown",
                    "expertise_areas": ["General expertise"],
                    "authority_indicators": ["Professional background"],
                    "social_following": {"unknown": "unknown"},
                    "potential_interview_topics": ["Professional experience"],
                    "estimated_authority_level": "MEDIUM",
                    "brief_bio": f"Professional with background in their field.",
                    "raw_llm_response": llm_response
                }
            
            # Add metadata
            structured_profile['analysis_metadata'] = {
                'data_quality_score': analysis_data.get('data_quality_score', 0),
                'data_sources': analysis_data.get('data_sources', []),
                'analysis_timestamp': analysis_data.get('analysis_timestamp', time.time())
            }
            
            return structured_profile
            
        except Exception as e:
            print(f"LLM extraction error: {e}")
            # Return basic fallback profile
            return {
                "name": person_name,
                "current_designation": "Unknown",
                "company": "Unknown",
                "industry": "Unknown", 
                "expertise_areas": ["Unknown"],
                "authority_indicators": ["Unknown"],
                "social_following": {"unknown": "unknown"},
                "potential_interview_topics": ["Unknown"],
                "estimated_authority_level": "UNKNOWN",
                "brief_bio": "Profile analysis failed.",
                "error": str(e)
            }

