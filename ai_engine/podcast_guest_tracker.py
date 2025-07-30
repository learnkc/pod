#!/usr/bin/env python3
# podcast_guest_tracker.py - Complete Integration System

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
import os

# Import all our components
from guest_analyzer_base import PremiumGuestAnalyzer
from host_channel_analyzer import YouTubeHostAnalyzer
from relevance_scoring_engine import GuestRelevanceScorer

class OneClickPodcastGuestTracker:
    """Complete 1-click podcast guest analysis system"""
    
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        self.guest_analyzer = None
        self.host_analyzer = YouTubeHostAnalyzer(ollama_url)
        self.relevance_scorer = GuestRelevanceScorer(ollama_url)
        
        # Cache for host analysis (to avoid re-analyzing same channel)
        self.host_cache = {}
        
    async def analyze_podcast_guest_complete(self, 
                                           guest_name: str, 
                                           guest_url: str, 
                                           host_channel_url: str,
                                           use_cache: bool = True) -> Dict[str, Any]:
        """
        Complete 1-click analysis of podcast guest
        
        Args:
            guest_name: Name of the potential guest
            guest_url: URL of guest's profile (Twitter, LinkedIn, YouTube, etc.)
            host_channel_url: Host's YouTube channel URL
            use_cache: Whether to use cached host analysis
        
        Returns:
            Complete analysis with guest profile, host analysis, and relevance scoring
        """
        
        print(f"🚀 Starting 1-Click Analysis")
        print(f"Guest: {guest_name}")
        print(f"Guest URL: {guest_url}")
        print(f"Host Channel: {host_channel_url}")
        
        analysis_start = time.time()
        
        try:
            # Step 1: Analyze Guest Profile
            print("\n📊 Step 1: Analyzing Guest Profile...")
            guest_start = time.time()
            
            async with PremiumGuestAnalyzer() as guest_analyzer:
                # Extract person name if not provided
                if not guest_name or guest_name == "Unknown":
                    guest_name = guest_analyzer.extract_enhanced_person_name(guest_url)
                
                # Comprehensive guest analysis
                social_data = await guest_analyzer.comprehensive_person_analysis(guest_name, guest_url)
                
                # Extract structured profile
                guest_profile = await guest_analyzer.extract_structured_guest_profile(social_data)
            
            guest_time = time.time() - guest_start
            print(f"✅ Guest analysis complete ({guest_time:.1f}s)")
            
            # Step 2: Analyze Host Channel
            print("\n📺 Step 2: Analyzing Host Channel...")
            host_start = time.time()
            
            # Check cache first
            host_analysis = None
            if use_cache and host_channel_url in self.host_cache:
                cache_age = time.time() - self.host_cache[host_channel_url]['timestamp']
                if cache_age < 86400:  # 24 hours cache
                    host_analysis = self.host_cache[host_channel_url]['data']
                    print("📋 Using cached host analysis")
            
            # Analyze if not cached
            if not host_analysis:
                host_analysis = await self.host_analyzer.analyze_host_channel(host_channel_url)
                
                # Cache the result
                if use_cache and 'error' not in host_analysis:
                    self.host_cache[host_channel_url] = {
                        'data': host_analysis,
                        'timestamp': time.time()
                    }
            
            host_time = time.time() - host_start
            print(f"✅ Host analysis complete ({host_time:.1f}s)")
            
            # Step 3: Calculate Relevance Score
            print("\n🎯 Step 3: Calculating Relevance Score...")
            score_start = time.time()
            
            relevance_analysis = self.relevance_scorer.calculate_overall_relevance_score(
                guest_profile, host_analysis
            )
            
            # Get LLM validation
            llm_validation = self.relevance_scorer.call_llm_for_scoring_validation(
                relevance_analysis, guest_profile, host_analysis
            )
            
            score_time = time.time() - score_start
            print(f"✅ Relevance scoring complete ({score_time:.1f}s)")
            
            # Step 4: Generate Final Report
            print("\n📋 Step 4: Generating Final Report...")
            report_start = time.time()
            
            final_report = await self.generate_comprehensive_report(
                guest_profile, host_analysis, relevance_analysis, llm_validation
            )
            
            report_time = time.time() - report_start
            total_time = time.time() - analysis_start
            
            print(f"✅ Report generation complete ({report_time:.1f}s)")
            print(f"🏁 Total analysis time: {total_time:.1f}s")
            
            # Compile final result
            final_result = {
                "analysis_metadata": {
                    "guest_name": guest_name,
                    "guest_url": guest_url,
                    "host_channel_url": host_channel_url,
                    "analysis_timestamp": datetime.now().isoformat(),
                    "total_analysis_time": round(total_time, 1),
                    "performance_metrics": {
                        "guest_analysis_time": round(guest_time, 1),
                        "host_analysis_time": round(host_time, 1),
                        "scoring_time": round(score_time, 1),
                        "report_time": round(report_time, 1)
                    }
                },
                "guest_profile": guest_profile,
                "host_analysis": host_analysis,
                "relevance_analysis": relevance_analysis,
                "llm_validation": llm_validation,
                "final_report": final_report,
                "recommendation_summary": {
                    "overall_score": relevance_analysis.get('overall_relevance_score', 0),
                    "recommendation": relevance_analysis.get('recommendation', 'UNKNOWN'),
                    "confidence": relevance_analysis.get('confidence_level', 'UNKNOWN'),
                    "key_decision_factors": self.extract_key_decision_factors(relevance_analysis)
                }
            }
            
            print(f"\n🎉 Analysis Complete!")
            print(f"📊 Overall Score: {final_result['recommendation_summary']['overall_score']}/100")
            print(f"💡 Recommendation: {final_result['recommendation_summary']['recommendation']}")
            
            return final_result
            
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
            return {
                "error": str(e),
                "analysis_metadata": {
                    "guest_name": guest_name,
                    "guest_url": guest_url,
                    "host_channel_url": host_channel_url,
                    "analysis_timestamp": datetime.now().isoformat(),
                    "status": "FAILED"
                }
            }
    
    def extract_key_decision_factors(self, relevance_analysis: Dict[str, Any]) -> List[str]:
        """Extract the key factors that influenced the decision"""
        factors = []
        
        score_breakdown = relevance_analysis.get('score_breakdown', {})
        
        # Find highest scoring factors
        scores = {}
        for factor, data in score_breakdown.items():
            scores[factor] = data.get('score', 0)
        
        # Sort by score
        sorted_factors = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        # Top 3 factors
        for factor, score in sorted_factors[:3]:
            if score > 60:
                factor_name = factor.replace('_', ' ').title()
                factors.append(f"{factor_name}: {score}/100")
        
        # Add concerns if overall score is low
        overall_score = relevance_analysis.get('overall_relevance_score', 0)
        if overall_score < 60:
            concerns = relevance_analysis.get('areas_of_concern', [])
            if concerns:
                factors.append(f"Main concern: {concerns[0]}")
        
        return factors
    
    async def generate_comprehensive_report(self, 
                                          guest_profile: Dict[str, Any], 
                                          host_analysis: Dict[str, Any], 
                                          relevance_analysis: Dict[str, Any],
                                          llm_validation: str) -> str:
        """Generate a comprehensive human-readable report"""
        
        guest_name = guest_profile.get('name', 'Unknown Guest')
        overall_score = relevance_analysis.get('overall_relevance_score', 0)
        recommendation = relevance_analysis.get('recommendation', 'UNKNOWN')
        
        # Extract key data points
        designation = guest_profile.get('current_designation', 'Unknown Role')
        company = guest_profile.get('company', 'Unknown Company')
        expertise_areas = guest_profile.get('expertise_areas', ['Not specified'])
        
        # Channel performance data
        channel_dna = host_analysis.get('channel_dna', {})
        if isinstance(channel_dna, dict) and 'channel_dna' in channel_dna:
            channel_dna = channel_dna['channel_dna']
        
        channel_topics = channel_dna.get('primary_topics', ['Unknown'])
        avg_views = host_analysis.get('performance_metrics', {}).get('average_views', 0)
        
        # Score breakdown
        score_breakdown = relevance_analysis.get('score_breakdown', {})
        topic_score = score_breakdown.get('topic_alignment', {}).get('score', 0)
        authority_score = score_breakdown.get('authority_score', {}).get('score', 0)
        
        # Build comprehensive report
        report = f"""
# PODCAST GUEST ANALYSIS REPORT
**Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}**

## EXECUTIVE SUMMARY
**Guest:** {guest_name}  
**Current Role:** {designation} at {company}  
**Overall Relevance Score:** {overall_score}/100  
**Recommendation:** {recommendation}  

{llm_validation}

---

## GUEST PROFILE

**Professional Background:**
- **Name:** {guest_name}
- **Designation:** {designation}
- **Company:** {company}
- **Industry:** {guest_profile.get('industry', 'Not specified')}

**Expertise Areas:**
{chr(10).join(f'• {area}' for area in expertise_areas[:5])}

**Authority Indicators:**
{chr(10).join(f'• {indicator}' for indicator in guest_profile.get('authority_indicators', ['Not available'])[:3])}

**Social Media Presence:**
{self.format_social_following(guest_profile.get('social_following', {}))}

---

## HOST CHANNEL ANALYSIS

**Channel Performance:**
- **Average Views:** {avg_views:,} per video
- **Primary Topics:** {', '.join(channel_topics)}
- **Content Style:** {channel_dna.get('content_style', 'Not determined')}

**Successful Guest Types:**
{chr(10).join(f'• {guest_type}' for guest_type in channel_dna.get('preferred_guest_types', ['Not specified']))}

---

## RELEVANCE ANALYSIS

### Score Breakdown:
- **Topic Alignment:** {topic_score}/100 ({score_breakdown.get('topic_alignment', {}).get('weight', 0)*100:.0f}% weight)
- **Authority/Credibility:** {authority_score}/100 ({score_breakdown.get('authority_score', {}).get('weight', 0)*100:.0f}% weight)
- **Audience Appeal:** {score_breakdown.get('audience_appeal', {}).get('score', 0)}/100 ({score_breakdown.get('audience_appeal', {}).get('weight', 0)*100:.0f}% weight)
- **Uniqueness Factor:** {score_breakdown.get('uniqueness_factor', {}).get('score', 0)}/100 ({score_breakdown.get('uniqueness_factor', {}).get('weight', 0)*100:.0f}% weight)
- **Engagement Potential:** {score_breakdown.get('engagement_potential', {}).get('score', 0)}/100 ({score_breakdown.get('engagement_potential', {}).get('weight', 0)*100:.0f}% weight)

### Key Strengths:
{chr(10).join(f'• {strength}' for strength in relevance_analysis.get('key_strengths', ['Not identified']))}

### Areas of Concern:
{chr(10).join(f'• {concern}' for concern in relevance_analysis.get('areas_of_concern', ['None identified']))}

---

## INTERVIEW RECOMMENDATIONS

### Suggested Topics:
{chr(10).join(f'• {topic}' for topic in guest_profile.get('potential_interview_topics', ['Topic research needed'])[:5])}

### Expected Audience Engagement:
**{relevance_analysis.get('confidence_level', 'MEDIUM')} confidence level**

---

## FINAL RECOMMENDATION

**Decision:** {recommendation}  
**Confidence Level:** {relevance_analysis.get('confidence_level', 'MEDIUM')}

{self.generate_recommendation_rationale(recommendation, overall_score, relevance_analysis)}

---
*Report generated by 1-Click Podcast Guest Tracker*
"""
        return report.strip()
    
    def format_social_following(self, social_following: Dict[str, str]) -> str:
        """Format social media following for report"""
        if not social_following:
            return "• Social media data not available"
        
        formatted = []
        for platform, count in social_following.items():
            if count and count != 'unknown':
                formatted.append(f"• {platform.title()}: {count} followers")
        
        return '\n'.join(formatted) if formatted else "• Social media data not available"
    
    def generate_recommendation_rationale(self, recommendation: str, score: float, analysis: Dict[str, Any]) -> str:
        """Generate rationale for the recommendation"""
        
        if recommendation == "HIGHLY_RECOMMENDED":
            return f"With a score of {score}/100, this guest shows excellent alignment across multiple factors. They would likely be a valuable addition to your podcast with high audience appeal and strong topical relevance."
        
        elif recommendation == "RECOMMENDED":
            return f"Scoring {score}/100, this guest demonstrates good potential for your podcast. While there may be some areas for improvement, the overall fit is positive and worth pursuing."
        
        elif recommendation == "CONSIDER":
            return f"At {score}/100, this guest shows moderate potential. Consider whether their unique perspective or expertise in specific areas would add value to your audience despite some limitations."
        
        elif recommendation == "LOW_PRIORITY":
            return f"With a score of {score}/100, this guest may not be the best fit currently. Consider them for future episodes if their relevance increases or if you're exploring new topic areas."
        
        else:  # NOT_RECOMMENDED
            return f"Scoring {score}/100, this guest doesn't appear to be a strong fit for your channel at this time. The analysis suggests limited alignment with your audience and content themes."

