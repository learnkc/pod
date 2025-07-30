// ====================================
// BACKEND - Node.js/Express Server
// ====================================

// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/podcastanalyzer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ====================================
// DATABASE MODELS
// ====================================

// models/Guest.js
const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  field: String,
  bio: String,
  socialMedia: {
    twitter: String,
    linkedin: String,
    youtube: String,
    followers: Number
  },
  expertise: [String],
  mediaAppearances: [String],
  trendingScore: { type: Number, default: 0 },
  region: String,
  lastUpdated: { type: Date, default: Date.now }
});

const Guest = mongoose.model('Guest', guestSchema);

// models/Channel.js
const channelSchema = new mongoose.Schema({
  channelId: String,
  channelUrl: String,
  title: String,
  description: String,
  subscriberCount: Number,
  videoCount: Number,
  viewCount: Number,
  topics: [String],
  demographics: {
    primaryAge: String,
    primaryGender: String,
    topCountries: [String]
  },
  recentVideos: [{
    title: String,
    views: Number,
    likes: Number,
    publishedAt: Date
  }],
  lastAnalyzed: { type: Date, default: Date.now }
});

const Channel = mongoose.model('Channel', channelSchema);

// models/Analysis.js
const analysisSchema = new mongoose.Schema({
  channelId: String,
  guestName: String,
  guestField: String,
  region: String,
  compatibilityScore: Number,
  audienceOverlap: Number,
  trendingFactor: Number,
  riskAssessment: String,
  recommendations: [String],
  detailedReport: Object,
  createdAt: { type: Date, default: Date.now }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

// ====================================
// AI ANALYSIS SERVICE
// ====================================

// services/aiAnalysis.js
class AIAnalysisService {
  constructor() {
    this.hfToken = process.env.HUGGINGFACE_TOKEN;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
  }

  async analyzeTextSentiment(text) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/cardiffnlp/twitter-roberta-base-sentiment-latest`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.hfToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return null;
    }
  }

  async extractKeywords(text) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/yanekyuk/bert-keyword-extractor`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.hfToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }

  async classifyContent(text) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/facebook/bart-large-mnli`,
        {
          inputs: text,
          parameters: {
            candidate_labels: [
              "technology", "business", "health", "entertainment", 
              "science", "sports", "politics", "finance", "education"
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.hfToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Content classification error:', error);
      return null;
    }
  }

  async calculateCompatibility(channelContent, guestContent) {
    // Analyze both contents
    const channelClassification = await this.classifyContent(channelContent);
    const guestClassification = await this.classifyContent(guestContent);
    
    if (!channelClassification || !guestClassification) {
      return { score: 50, details: "Analysis unavailable" };
    }

    // Calculate similarity score
    let compatibilityScore = 0;
    const channelTopics = channelClassification.labels?.slice(0, 3) || [];
    const guestTopics = guestClassification.labels?.slice(0, 3) || [];

    channelTopics.forEach((topic, index) => {
      const guestIndex = guestTopics.indexOf(topic);
      if (guestIndex !== -1) {
        compatibilityScore += (10 - index - guestIndex) * 10;
      }
    });

    return {
      score: Math.min(Math.max(compatibilityScore, 0), 100),
      channelTopics,
      guestTopics,
      details: `Primary overlap in: ${channelTopics.filter(t => guestTopics.includes(t)).join(', ')}`
    };
  }
}

const aiService = new AIAnalysisService();

// ====================================
// YOUTUBE API SERVICE
// ====================================

// services/youtubeService.js
class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async getChannelInfo(channelId) {
    try {
      const response = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          part: 'snippet,statistics,brandingSettings',
          id: channelId,
          key: this.apiKey
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = response.data.items[0];
      return {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
        thumbnails: channel.snippet.thumbnails
      };
    } catch (error) {
      console.error('YouTube API error:', error);
      throw error;
    }
  }

  async getRecentVideos(channelId, maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          channelId: channelId,
          maxResults: maxResults,
          order: 'date',
          type: 'video',
          key: this.apiKey
        }
      });

      return response.data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: new Date(item.snippet.publishedAt),
        thumbnails: item.snippet.thumbnails
      }));
    } catch (error) {
      console.error('YouTube videos fetch error:', error);
      return [];
    }
  }

  extractChannelId(url) {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        if (pattern.source.includes('@')) {
          return this.getChannelIdByHandle(match[1]);
        }
        return match[1];
      }
    }
    
    return url; // Assume it's already a channel ID
  }

  async getChannelIdByHandle(handle) {
    // This would require additional API calls or web scraping
    // For now, return the handle as-is
    return handle;
  }
}

const youtubeService = new YouTubeService();

// ====================================
// WEB SCRAPING SERVICE
// ====================================

// services/webScrapingService.js
class WebScrapingService {
  async scrapeGuestInfo(guestName) {
    try {
      // Search for guest information (using Wikipedia as example)
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(guestName)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'PodcastAnalyzer/1.0'
        }
      });

      if (response.data && response.data.extract) {
        return {
          name: guestName,
          bio: response.data.extract,
          field: this.extractFieldFromBio(response.data.extract),
          source: 'Wikipedia'
        };
      }
    } catch (error) {
      console.log(`No Wikipedia entry found for ${guestName}`);
    }

    // Fallback to basic info
    return {
      name: guestName,
      bio: `Information about ${guestName}`,
      field: 'Unknown',
      source: 'Default'
    };
  }

  extractFieldFromBio(bio) {
    const fields = {
      'technology': ['engineer', 'developer', 'tech', 'software', 'AI', 'computer'],
      'business': ['entrepreneur', 'CEO', 'founder', 'business', 'company'],
      'entertainment': ['actor', 'musician', 'artist', 'film', 'movie', 'music'],
      'science': ['scientist', 'researcher', 'professor', 'PhD', 'research'],
      'sports': ['athlete', 'player', 'sport', 'olympic', 'championship'],
      'politics': ['politician', 'senator', 'president', 'minister', 'government']
    };

    for (const [field, keywords] of Object.entries(fields)) {
      if (keywords.some(keyword => bio.toLowerCase().includes(keyword.toLowerCase()))) {
        return field;
      }
    }

    return 'general';
  }

  async getTrendingTopics(region = 'global') {
    // Simulate trending topics (in real app, would use Google Trends API or social media APIs)
    const trendingData = {
      global: [
        { name: 'Artificial Intelligence', score: 95 },
        { name: 'Climate Change', score: 87 },
        { name: 'Cryptocurrency', score: 82 },
        { name: 'Space Exploration', score: 78 }
      ],
      'north-america': [
        { name: 'Tech Innovation', score: 92 },
        { name: 'Healthcare', score: 85 },
        { name: 'Politics', score: 80 }
      ],
      india: [
        { name: 'Digital India', score: 90 },
        { name: 'Startup Ecosystem', score: 88 },
        { name: 'Bollywood', score: 75 }
      ]
    };

    return trendingData[region] || trendingData.global;
  }
}

const webScrapingService = new WebScrapingService();

// ====================================
// API ROUTES
// ====================================

// Route: Analyze Guest
app.post('/api/analyze-guest', async (req, res) => {
  try {
    const { guestName, field, region, channelUrl, trendingPeriod } = req.body;

    if (!channelUrl) {
      return res.status(400).json({ error: 'Channel URL is required' });
    }

    // Extract channel ID and get channel info
    const channelId = youtubeService.extractChannelId(channelUrl);
    const channelInfo = await youtubeService.getChannelInfo(channelId);
    const recentVideos = await youtubeService.getRecentVideos(channelId);

    // Get or create channel record
    let channel = await Channel.findOne({ channelId });
    if (!channel) {
      channel = new Channel({
        channelId,
        channelUrl,
        ...channelInfo,
        recentVideos
      });
      await channel.save();
    }

    // Analyze channel content
    const channelContent = `${channelInfo.description} ${recentVideos.map(v => v.title).join(' ')}`;
    const channelTopics = await aiService.classifyContent(channelContent);

    let guestInfo = null;
    let compatibilityAnalysis = null;

    if (guestName) {
      // Get guest information
      guestInfo = await webScrapingService.scrapeGuestInfo(guestName);
      
      // Save or update guest
      let guest = await Guest.findOne({ name: guestName });
      if (!guest) {
        guest = new Guest(guestInfo);
        await guest.save();
      }

      // Analyze compatibility
      compatibilityAnalysis = await aiService.calculateCompatibility(
        channelContent, 
        guestInfo.bio
      );
    }

    // Get trending topics
    const trendingTopics = await webScrapingService.getTrendingTopics(region);

    // Calculate scores
    const compatibilityScore = compatibilityAnalysis?.score || 0;
    const audienceOverlap = Math.floor(Math.random() * 40) + 60; // Simulated
    const trendingFactor = guestName ? 
      (trendingTopics.find(t => guestInfo.bio.includes(t.name))?.score || 50) : 
      Math.max(...trendingTopics.map(t => t.score));

    // Create analysis record
    const analysis = new Analysis({
      channelId,
      guestName: guestName || 'Field-based search',
      guestField: field || (guestInfo?.field),
      region,
      compatibilityScore,
      audienceOverlap,
      trendingFactor,
      riskAssessment: compatibilityScore > 70 ? 'Low' : compatibilityScore > 40 ? 'Medium' : 'High',
      recommendations: generateRecommendations(compatibilityScore, audienceOverlap, trendingFactor),
      detailedReport: {
        channelInfo,
        guestInfo,
        compatibilityAnalysis,
        trendingTopics,
        channelTopics
      }
    });

    await analysis.save();

    res.json({
      success: true,
      analysis: {
        compatibilityScore,
        audienceOverlap,
        trendingFactor,
        riskAssessment: analysis.riskAssessment,
        recommendations: analysis.recommendations,
        guestInfo,
        channelInfo,
        trendingTopics
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

// Route: Get trending guests
app.get('/api/trending-guests', async (req, res) => {
  try {
    const { field, region } = req.query;
    
    const query = {};
    if (field && field !== '') query.field = field;
    if (region && region !== 'global') query.region = region;

    const trendingGuests = await Guest.find(query)
      .sort({ trendingScore: -1 })
      .limit(20);

    res.json({ guests: trendingGuests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending guests' });
  }
});

// Route: Search guests (autocomplete)
app.get('/api/search-guests', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Guest.find({
      name: { $regex: query, $options: 'i' }
    }).limit(10).select('name field');

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Route: Get analysis history
app.get('/api/analysis-history/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const analyses = await Analysis.find({ channelId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ analyses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

// Helper function
function generateRecommendations(compatibility, overlap, trending) {
  const recommendations = [];
  
  if (compatibility > 80) {
    recommendations.push("Excellent match! This guest aligns perfectly with your content style.");
  } else if (compatibility > 60) {
    recommendations.push("Good compatibility. Consider preparing bridge topics to enhance connection.");
  } else {
    recommendations.push("Lower compatibility. Focus on unique angles or controversial discussions.");
  }

  if (trending > 80) {
    recommendations.push("High trending factor - book quickly while they're in demand!");
  }

  if (overlap > 70) {
    recommendations.push("Strong audience overlap suggests high engagement potential.");
  }

  return recommendations;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ====================================
// FRONTEND - React Application
// ====================================

// package.json (Frontend)
/*
{
  "name": "podcast-analyzer-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.4.0",
    "react-router-dom": "^6.11.0",
    "recharts": "^2.6.2",
    "tailwindcss": "^3.3.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
*/

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Results from './components/Results';
import History from './components/History';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [formData, setFormData] = useState({
    guestName: '',
    field: '',
    region: 'global',
    channelUrl: '',
    trendingPeriod: '30days'
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingGuests, setTrendingGuests] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingGuests();
  }, []);

  const fetchTrendingGuests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/trending-guests');
      setTrendingGuests(response.data.guests || []);
    } catch (error) {
      console.error('Failed to fetch trending guests:', error);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'guestName' && value.length > 2) {
      try {
        const response = await axios.get(`http://localhost:5000/api/search-guests?query=${value}`);
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else if (name === 'guestName') {
      setSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.channelUrl) {
      alert('Please enter your YouTube channel URL');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/analyze-guest', formData);
      
      if (response.data.success) {
        // Store results in sessionStorage and navigate
        sessionStorage.setItem('analysisResults', JSON.stringify(response.data.analysis));
        navigate('/results');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, guestName: suggestion.name }));
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎙️ PodcastIQ</h1>
          <p className="text-xl text-blue-100">AI-Powered Guest Analysis for Podcast Hosts</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Guest Name
                </label>
                <input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleInputChange}
                  placeholder="e.g., Elon Musk, Neil deGrasse Tyson"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-sm text-gray-500">{suggestion.field}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field/Industry
                </label>
                <select
                  name="field"
                  value={formData.field}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Field (Optional)</option>
                  <option value="technology">🖥️ Technology</option>
                  <option value="business">💼 Business & Entrepreneurship</option>
                  <option value="health">🏥 Health & Wellness</option>
                  <option value="entertainment">🎬 Entertainment</option>
                  <option value="science">🔬 Science & Research</option>
                  <option value="sports">⚽ Sports</option>
                  <option value="politics">🏛️ Politics & Society</option>
                  <option value="finance">💰 Finance & Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Region
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="global">🌍 Global</option>
                  <option value="north-america">🇺🇸 North America</option>
                  <option value="europe">🇪🇺 Europe</option>
                  <option value="asia">🌏 Asia Pacific</option>
                  <option value="india">🇮🇳 India</option>
                  <option value="uk">🇬🇧 United Kingdom</option>
                  <option value="australia">🇦🇺 Australia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trending Period
                </label>
                <select
                  name="trendingPeriod"
                  value={formData.trendingPeriod}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="7days">📅 Last 7 Days</option>
                  <option value="30days">📅 Last 30 Days</option>
                  <option value="90days">📅 Last 3 Months</option>
                  <option value="1year">📅 Last Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your YouTube Channel URL *
              </label>
              <input
                type="url"
                name="channelUrl"
                value={formData.channelUrl}
                onChange={handleInputChange}
                placeholder="https://youtube.com/@yourchannel"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? '🔄 Analyzing...' : '🚀 Analyze Guest Compatibility'}
            </button>
          </form>

          {trendingGuests.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
              <h3 className="text-xl font-bold text-orange-800 mb-4">🔥 Currently Trending</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingGuests.slice(0, 6).map((guest, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-gray-800">{guest.name}</h4>
                    <p className="text-sm text-gray-600">{guest.field}</p>
                    <div className="mt-2">
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                        Score: {guest.trendingScore || 75}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// src/components/Results.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Results = () => {
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!results) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const compatibilityData = [
    { name: 'Compatible', value: results.compatibilityScore },
    { name: 'Incompatible', value: 100 - results.compatibilityScore }
  ];

  const metricsData = [
    { name: 'Compatibility', score: results.compatibilityScore },
    { name: 'Audience Overlap', score: results.audienceOverlap },
    { name: 'Trending Factor', score: results.trendingFactor }
  ];

  const COLORS = ['#10B981', '#EF4444'];

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">📊 Analysis Results</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            ← New Analysis
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Compatibility Score */}
          <div className={`${getScoreBg(results.compatibilityScore)} p-6 rounded-2xl`}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">🎯 Compatibility Score</h3>
            <div className={`text-4xl font-bold ${getScoreColor(results.compatibilityScore)}`}>
              {results.compatibilityScore}%
            </div>
            <p className="text-gray-600 mt-2">Content alignment with your channel</p>
          </div>

          {/* Audience Overlap */}
          <div className={`${getScoreBg(results.audienceOverlap)} p-6 rounded-2xl`}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">👥 Audience Overlap</h3>
            <div className={`text-4xl font-bold ${getScoreColor(results.audienceOverlap)}`}>
              {results.audienceOverlap}%
            </div>
            <p className="text-gray-600 mt-2">Shared audience demographics</p>
          </div>

          {/* Trending Factor */}
          <div className={`${getScoreBg(results.trendingFactor)} p-6 rounded-2xl`}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">🔥 Trending Factor</h3>
            <div className={`text-4xl font-bold ${getScoreColor(results.trendingFactor)}`}>
              {results.trendingFactor}%
            </div>
            <p className="text-gray-600 mt-2">Current popularity & relevance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compatibility Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Compatibility Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={compatibilityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {compatibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Overall Metrics</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Guest Information */}
        {results.guestInfo && (
          <div className="bg-white p-6 rounded-2xl shadow-2xl mt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">👤 Guest Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Basic Information</h4>
                <p><strong>Name:</strong> {results.guestInfo.name}</p>
                <p><strong>Field:</strong> {results.guestInfo.field}</p>
                <p><strong>Source:</strong> {results.guestInfo.source}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {results.guestInfo.bio.substring(0, 300)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white p-6 rounded-2xl shadow-2xl mt-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">💡 Recommendations</h3>
          <div className="space-y-3">
            {results.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-2xl">✅</span>
                <p className="text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white p-6 rounded-2xl shadow-2xl mt-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Risk Assessment</h3>
          <div className={`p-4 rounded-lg ${
            results.riskAssessment === 'Low' ? 'bg-green-100 text-green-800' :
            results.riskAssessment === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            <p className="font-semibold">Risk Level: {results.riskAssessment}</p>
            <p className="mt-2">
              {results.riskAssessment === 'Low' && 'This guest appears to be a safe choice with high potential for success.'}
              {results.riskAssessment === 'Medium' && 'This guest has moderate risk. Consider preparing additional talking points.'}
              {results.riskAssessment === 'High' && 'This guest may require careful handling or may not be the best fit for your audience.'}
            </p>
          </div>
        </div>

        {/* Trending Topics */}
        {results.trendingTopics && (
          <div className="bg-white p-6 rounded-2xl shadow-2xl mt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">📈 Trending Topics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.trendingTopics.map((topic, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">{topic.name}</h4>
                  <p className="text-blue-600">Score: {topic.score}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;

// src/components/History.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const History = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    // In a real app, you'd get this from user authentication
    const defaultChannelId = 'UC_default_channel';
    setChannelId(defaultChannelId);
    fetchHistory(defaultChannelId);
  }, []);

  const fetchHistory = async (cId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/analysis-history/${cId}`);
      setAnalyses(response.data.analyses || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">📚 Analysis History</h1>
          <p className="text-xl text-blue-100">Review your previous guest analyses</p>
        </div>

        {analyses.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No analyses yet</h3>
            <p className="text-gray-600 mb-6">Start analyzing guests to see your history here.</p>
            <a
              href="/"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Start Analysis
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {analyses.map((analysis, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{analysis.guestName}</h3>
                    <p className="text-gray-600">{analysis.guestField}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.compatibilityScore}%
                    </div>
                    <div className="text-sm text-gray-500">Compatibility</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">
                      {analysis.audienceOverlap}%
                    </div>
                    <div className="text-sm text-blue-800">Audience Overlap</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      {analysis.trendingFactor}%
                    </div>
                    <div className="text-sm text-green-800">Trending Factor</div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    analysis.riskAssessment === 'Low' ? 'bg-green-50' :
                    analysis.riskAssessment === 'Medium' ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <div className={`text-lg font-semibold ${
                      analysis.riskAssessment === 'Low' ? 'text-green-600' :
                      analysis.riskAssessment === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {analysis.riskAssessment}
                    </div>
                    <div className={`text-sm ${
                      analysis.riskAssessment === 'Low' ? 'text-green-800' :
                      analysis.riskAssessment === 'Medium' ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      Risk Level
                    </div>
                  </div>
                </div>

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Key Recommendations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.recommendations.slice(0, 2).map((rec, recIndex) => (
                        <li key={recIndex}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

// ====================================
// PACKAGE.JSON FILES
// ====================================

// Backend package.json
/*
{
  "name": "podcast-analyzer-backend",
  "version": "1.0.0",
  "description": "Backend API for Podcast Guest Analyzer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mongoose": "^7.3.0",
    "axios": "^1.4.0",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.1.4"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
*/

// ====================================
// ENVIRONMENT CONFIGURATION
// ====================================

// .env file (Backend)
/*
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/podcastanalyzer
YOUTUBE_API_KEY=your_youtube_api_key_here
HUGGINGFACE_TOKEN=your_huggingface_token_here
*/

// ====================================
// DEPLOYMENT SCRIPTS
// ====================================

// docker-compose.yml
/*
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/podcastanalyzer
    depends_on:
      - mongo
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
*/

// Dockerfile (Backend)
/*
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
*/

// Dockerfile (Frontend)
/*
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
*/

// ====================================
// API DOCUMENTATION
// ====================================

/*
API Endpoints:

POST /api/analyze-guest
- Analyzes a guest for podcast compatibility
- Body: { guestName, field, region, channelUrl, trendingPeriod }
- Returns: Analysis results with scores and recommendations

GET /api/trending-guests?field=tech&region=global
- Gets trending guests by field and region
- Query params: field (optional), region (optional)
- Returns: Array of trending guests

GET /api/search-guests?query=elon
- Searches for guests (autocomplete)
- Query params: query (minimum 2 characters)
- Returns: Array of guest suggestions

GET /api/analysis-history/:channelId
- Gets analysis history for a channel
- Params: channelId
- Returns: Array of previous analyses

Usage Instructions:

1. Backend Setup:
   - npm install
   - Create .env file with required API keys
   - npm run dev

2. Frontend Setup:
   - npm install
   - npm start

3. Required API Keys:
   - YouTube Data API v3 key
   - Hugging Face API token
   - MongoDB connection string

4. Features:
   - AI-powered content analysis using Hugging Face models
   - YouTube channel analysis
   - Guest compatibility scoring
   - Trending analysis
   - Historical tracking
   - Real-time suggestions

5. AI Models Used:
   - cardiffnlp/twitter-roberta-base-sentiment-latest (sentiment analysis)
   - yanekyuk/bert-keyword-extractor (keyword extraction)
   - facebook/bart-large-mnli (content classification)
*/
