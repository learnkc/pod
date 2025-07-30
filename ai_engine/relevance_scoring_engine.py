#!/usr/bin/env python3
# relevance_scoring_engine.py - Advanced relevance scoring for guest-host matching

import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from ollama_client import ollama_client

class GuestRelevanceScorer:
    """Advanced scoring engine to match guests with host channels"""
    
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        
        # Configurable scoring weights
        self.scoring_weights = {
            'topic_alignment': 0.35,      # How well guest topics match channel
            'authority_score': 0.25,      # Guest's credibility and expertise
            'audience_appeal': 0.20,      # Likely audience interest
            'uniqueness_factor': 0.10,    # How unique/fresh the guest is
            'engagement_potential': 0.10  # Predicted engagement levels
        }
    
    def calculate_topic_alignment_score(self, guest_profile: Dict[str, Any], host_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate how well guest topics align with channel topics"""
        
        # Extract guest expertise areas
        guest_topics = guest_profile.get('expertise_areas', [])
        guest_topics.extend(guest_profile.get('potential_interview_topics', []))
        
        # Extract host channel topics
        channel_dna = host_analysis.get('channel_dna', {})
        if isinstance(channel_dna, dict) and 'channel_dna' in channel_dna:
            channel_dna = channel_dna['channel_dna']
        
        host_topics = channel_dna.get('primary_topics', [])
        host_topics.extend(channel_dna.get('success_patterns', {}).get('high_performing_topics', []))
        
        # Calculate overlap
        guest_topics_lower = [topic.lower() for topic in guest_topics if topic]
        host_topics_lower = [topic.lower() for topic in host_topics if topic]
        
        if not guest_topics_lower or not host_topics_lower:
            return {
                'score': 50,  # Neutral score when data is missing
                'reasoning': 'Insufficient topic data for comparison',
                'topic_matches': [],
                'weight': self.scoring_weights['topic_alignment']
            }
        
        # Find matches
        matches = []
        for guest_topic in guest_topics_lower:
            for host_topic in host_topics_lower:
                if guest_topic in host_topic or host_topic in guest_topic:
                    matches.append((guest_topic, host_topic))
        
        # Calculate score based on matches
        match_ratio = len(matches) / max(len(guest_topics_lower), len(host_topics_lower))
        base_score = min(match_ratio * 100, 100)
        
        # Boost score if there are exact matches
        exact_matches = len([m for m in matches if m[0] == m[1]])
        if exact_matches > 0:
            base_score = min(base_score + (exact_matches * 10), 100)
        
        return {
            'score': int(base_score),
            'reasoning': f"Found {len(matches)} topic alignments out of {len(guest_topics_lower)} guest topics",
            'topic_matches': matches[:5],  # Top 5 matches
            'weight': self.scoring_weights['topic_alignment']
        }
    
    def calculate_authority_score(self, guest_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate guest's authority and credibility score"""
        
        authority_level = guest_profile.get('estimated_authority_level', 'UNKNOWN')
        authority_indicators = guest_profile.get('authority_indicators', [])
        
        # Base score from authority level
        authority_scores = {
            'HIGH': 90,
            'MEDIUM': 65,
            'LOW': 40,
            'UNKNOWN': 50
        }
        
        base_score = authority_scores.get(authority_level, 50)
        
        # Boost based on authority indicators
        indicator_boost = min(len(authority_indicators) * 5, 20)
        
        # Check for specific high-value indicators
        high_value_indicators = ['phd', 'ceo', 'founder', 'author', 'professor', 'expert']
        for indicator in authority_indicators:
            if any(hvi in indicator.lower() for hvi in high_value_indicators):
                indicator_boost += 10
                break
        
        final_score = min(base_score + indicator_boost, 100)
        
        return {
            'score': int(final_score),
            'reasoning': f"Authority level: {authority_level}, {len(authority_indicators)} indicators",
            'authority_indicators': authority_indicators[:3],
            'weight': self.scoring_weights['authority_score']
        }
    
    def calculate_audience_appeal_score(self, guest_profile: Dict[str, Any], host_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate likely audience appeal"""
        
        # Get channel performance metrics
        performance_metrics = host_analysis.get('performance_metrics', {})
        avg_views = performance_metrics.get('average_views', 0)
        engagement_rate = performance_metrics.get('engagement_rate', 0)
        
        # Base score from guest's estimated appeal
        guest_industry = guest_profile.get('industry', 'Unknown')
        guest_designation = guest_profile.get('current_designation', 'Unknown')
        
        # Industry appeal mapping (this could be made more sophisticated)
        industry_appeal = {
            'technology': 85,
            'business': 80,
            'entertainment': 90,
            'education': 70,
            'healthcare': 65,
            'finance': 75,
            'unknown': 60
        }
        
        base_score = industry_appeal.get(guest_industry.lower(), 60)
        
        # Adjust based on designation
        high_appeal_roles = ['ceo', 'founder', 'celebrity', 'author', 'influencer']
        if any(role in guest_designation.lower() for role in high_appeal_roles):
            base_score += 15
        
        # Adjust based on channel's typical performance
        if avg_views > 100000:  # High-performing channel
            base_score += 5
        elif avg_views < 10000:  # Smaller channel
            base_score -= 5
        
        final_score = min(max(base_score, 0), 100)
        
        return {
            'score': int(final_score),
            'reasoning': f"Industry: {guest_industry}, Role: {guest_designation}",
            'appeal_factors': [guest_industry, guest_designation],
            'weight': self.scoring_weights['audience_appeal']
        }
    
    def calculate_uniqueness_score(self, guest_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate how unique/fresh the guest perspective is"""
        
        # This is a simplified uniqueness calculation
        # In production, you might check against a database of previous guests
        
        expertise_areas = guest_profile.get('expertise_areas', [])
        industry = guest_profile.get('industry', 'Unknown')
        
        # Base uniqueness score
        base_score = 70  # Assume moderate uniqueness
        
        # Boost for niche or emerging fields
        niche_fields = ['ai', 'blockchain', 'quantum', 'biotech', 'space', 'robotics']
        if any(field in ' '.join(expertise_areas).lower() for field in niche_fields):
            base_score += 20
        
        # Boost for unique combination of expertise
        if len(expertise_areas) >= 3:
            base_score += 10
        
        final_score = min(base_score, 100)
        
        return {
            'score': int(final_score),
            'reasoning': f"Expertise in {len(expertise_areas)} areas, industry: {industry}",
            'uniqueness_factors': expertise_areas[:3],
            'weight': self.scoring_weights['uniqueness_factor']
        }
    
    def calculate_engagement_potential_score(self, guest_profile: Dict[str, Any], host_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate predicted engagement potential"""
        
        # Factors that typically drive engagement
        guest_topics = guest_profile.get('potential_interview_topics', [])
        social_following = guest_profile.get('social_following', {})
        
        base_score = 60  # Base engagement potential
        
        # Boost for controversial or trending topics
        high_engagement_topics = ['politics', 'technology', 'business', 'controversy', 'innovation']
        topic_boost = sum(5 for topic in guest_topics if any(het in topic.lower() for het in high_engagement_topics))
        
        # Boost for social media presence
        social_boost = 0
        for platform, followers in social_following.items():
            if followers and followers != 'unknown':
                try:
                    # Try to extract number from follower count
                    follower_num = int(re.sub(r'[^\d]', '', str(followers)))
                    if follower_num > 100000:
                        social_boost += 15
                    elif follower_num > 10000:
                        social_boost += 10
                    elif follower_num > 1000:
                        social_boost += 5
                except:
                    social_boost += 5  # Some social presence
        
        final_score = min(base_score + topic_boost + social_boost, 100)
        
        return {
            'score': int(final_score),
            'reasoning': f"Topic engagement potential + social presence",
            'engagement_factors': guest_topics[:3],
            'weight': self.scoring_weights['engagement_potential']
        }
    
    def calculate_overall_relevance_score(self, guest_profile: Dict[str, Any], host_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive relevance score"""
        
        print("🎯 Calculating relevance scores...")
        
        # Calculate individual scores
        topic_score = self.calculate_topic_alignment_score(guest_profile, host_analysis)
        authority_score = self.calculate_authority_score(guest_profile)
        audience_score = self.calculate_audience_appeal_score(guest_profile, host_analysis)
        uniqueness_score = self.calculate_uniqueness_score(guest_profile)
        engagement_score = self.calculate_engagement_potential_score(guest_profile, host_analysis)
        
        # Calculate weighted overall score
        overall_score = (
            topic_score['score'] * topic_score['weight'] +
            authority_score['score'] * authority_score['weight'] +
            audience_score['score'] * audience_score['weight'] +
            uniqueness_score['score'] * uniqueness_score['weight'] +
            engagement_score['score'] * engagement_score['weight']
        )
        
        # Determine recommendation
        if overall_score >= 80:
            recommendation = "HIGHLY_RECOMMENDED"
            confidence = "HIGH"
        elif overall_score >= 65:
            recommendation = "RECOMMENDED"
            confidence = "MEDIUM"
        elif overall_score >= 50:
            recommendation = "CONSIDER"
            confidence = "MEDIUM"
        elif overall_score >= 35:
            recommendation = "LOW_PRIORITY"
            confidence = "LOW"
        else:
            recommendation = "NOT_RECOMMENDED"
            confidence = "HIGH"
        
        # Identify key strengths and concerns
        scores_list = [
            ('Topic Alignment', topic_score['score']),
            ('Authority', authority_score['score']),
            ('Audience Appeal', audience_score['score']),
            ('Uniqueness', uniqueness_score['score']),
            ('Engagement Potential', engagement_score['score'])
        ]
        
        scores_list.sort(key=lambda x: x[1], reverse=True)
        key_strengths = [f"{name}: {score}/100" for name, score in scores_list[:2] if score >= 70]
        areas_of_concern = [f"{name}: {score}/100" for name, score in scores_list if score < 50]
        
        return {
            'overall_relevance_score': int(overall_score),
            'recommendation': recommendation,
            'confidence_level': confidence,
            'score_breakdown': {
                'topic_alignment': topic_score,
                'authority_score': authority_score,
                'audience_appeal': audience_score,
                'uniqueness_factor': uniqueness_score,
                'engagement_potential': engagement_score
            },
            'key_strengths': key_strengths,
            'areas_of_concern': areas_of_concern,
            'scoring_weights': self.scoring_weights,
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def call_llm_for_scoring_validation(self, relevance_analysis: Dict[str, Any], guest_profile: Dict[str, Any], host_analysis: Dict[str, Any]) -> str:
        """Use LLM to validate and provide additional insights on scoring"""
        
        overall_score = relevance_analysis.get('overall_relevance_score', 0)
        recommendation = relevance_analysis.get('recommendation', 'UNKNOWN')
        
        guest_name = guest_profile.get('name', 'Unknown Guest')
        guest_expertise = ', '.join(guest_profile.get('expertise_areas', ['Unknown'])[:3])
        
        channel_topics = host_analysis.get('channel_dna', {}).get('channel_dna', {}).get('primary_topics', ['Unknown'])
        channel_topics_str = ', '.join(channel_topics[:3])
        
        prompt = f"""
Review this podcast guest relevance analysis and provide validation:

GUEST: {guest_name}
EXPERTISE: {guest_expertise}
OVERALL SCORE: {overall_score}/100
RECOMMENDATION: {recommendation}

HOST CHANNEL TOPICS: {channel_topics_str}

SCORE BREAKDOWN:
- Topic Alignment: {relevance_analysis.get('score_breakdown', {}).get('topic_alignment', {}).get('score', 0)}/100
- Authority: {relevance_analysis.get('score_breakdown', {}).get('authority_score', {}).get('score', 0)}/100
- Audience Appeal: {relevance_analysis.get('score_breakdown', {}).get('audience_appeal', {}).get('score', 0)}/100

Please provide:
1. Validation of the scoring (does it seem reasonable?)
2. Key interview opportunities with this guest
3. Potential challenges or risks
4. Specific questions the host should ask
5. Expected audience reaction

Keep response concise and actionable.
"""
        
        try:
            response = ollama_client.generate_text(prompt, max_tokens=600, temperature=0.4)
            return response.get('generated_text', 'Validation analysis failed')
        except Exception as e:
            return f"LLM validation failed: {str(e)}"

