import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { insertGuestSchema, insertChannelSchema, insertAnalysisSchema } from "@shared/schema";
import { storage } from "./storage";

// Import AI routes
import aiRoutes from './ai_routes';

// Mock services (replace with actual implementations)
class YouTubeService {
  async getChannelInfo(channelUrl: string) {
    // Mock implementation
    return {
      channelId: "mock_channel_id",
      title: "Mock Channel",
      description: "Mock channel description",
      subscriberCount: 100000,
      videoCount: 500,
      viewCount: 10000000,
      engagementRate: "5.2%",
      thumbnailUrl: "https://example.com/thumbnail.jpg"
    };
  }

  async getChannelVideos(channelId: string) {
    // Mock implementation
    return [
      {
        videoId: "mock_video_1",
        title: "Mock Video 1",
        views: 50000,
        likes: 1000,
        comments: 100,
        publishedAt: new Date().toISOString()
      }
    ];
  }
}

class AIAnalysisService {
  async analyzeGuest(guestName: string, field: string, channelInfo: any) {
    // Mock AI analysis
    const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const audienceOverlap = Math.floor(Math.random() * 30) + 70; // 70-100
    const topicOverlap = Math.floor(Math.random() * 25) + 75; // 75-100
    const trendingFactor = Math.floor(Math.random() * 50) + 50; // 50-100

    return {
      compatibilityScore,
      audienceOverlap,
      topicOverlap,
      trendingFactor,
      riskAssessment: compatibilityScore > 80 ? 'Low' : compatibilityScore > 60 ? 'Medium' : 'High',
      recommendations: [
        `Strong alignment with ${field} content`,
        `Good fit for channel's audience demographic`,
        `Potential for high engagement based on topic relevance`
      ]
    };
  }

  async getGuestInfo(guestName: string, field: string) {
    // Mock guest information
    return {
      name: guestName,
      field: field,
      bio: `${guestName} is a renowned expert in ${field} with extensive experience and thought leadership.`,
      socialReach: Math.floor(Math.random() * 900000) + 100000, // 100k-1M
      trendingScore: Math.floor(Math.random() * 30) + 70, // 70-100
      expertise: [field, "innovation", "leadership"]
    };
  }
}

// Mock trending topics
const TRENDING_TOPICS = [
  { topic: "Artificial Intelligence", score: 95, growth: "+15%" },
  { topic: "Cryptocurrency", score: 88, growth: "+8%" },
  { topic: "Climate Change", score: 82, growth: "+12%" },
  { topic: "Remote Work", score: 79, growth: "+5%" },
  { topic: "Mental Health", score: 76, growth: "+18%" },
  { topic: "Space Exploration", score: 74, growth: "+22%" },
  { topic: "Sustainable Technology", score: 71, growth: "+9%" },
  { topic: "Digital Privacy", score: 68, growth: "+7%" }
];

// Mock guest suggestions
const GUEST_SUGGESTIONS = [
  { name: "Dr. Sarah Chen", field: "AI Research", score: 92, reason: "Leading AI researcher with viral TED talks" },
  { name: "Marcus Rodriguez", field: "Fintech", score: 89, reason: "Successful fintech entrepreneur, trending on social media" },
  { name: "Prof. Elena Vasquez", field: "Climate Science", score: 87, reason: "Climate expert with recent breakthrough research" },
  { name: "James Kim", field: "Cybersecurity", score: 85, reason: "Cybersecurity expert with recent high-profile case" },
  { name: "Dr. Amara Okafor", field: "Biotech", score: 83, reason: "Biotech innovator with promising startup" }
];

const youtubeService = new YouTubeService();
const aiService = new AIAnalysisService();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register AI routes
  app.use('/api', aiRoutes);
  
  // Get dashboard metrics
  app.get('/api/metrics', async (req, res) => {
    try {
      const analyses = await storage.getAnalyses();
      const guests = await storage.getGuests();
      const channels = await storage.getChannels();

      res.json({
        totalAnalyses: analyses.length,
        totalGuests: guests.length,
        totalChannels: channels.length,
        averageCompatibilityScore: analyses.length > 0 
          ? Math.round(analyses.reduce((sum, a) => sum + a.compatibilityScore, 0) / analyses.length)
          : 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // Get trending topics
  app.get('/api/trending-topics', async (req, res) => {
    try {
      // In a real app, this would fetch from a trending topics API
      res.json(TRENDING_TOPICS);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      res.status(500).json({ error: 'Failed to fetch trending topics' });
    }
  });

  // Search for guests
  app.get('/api/guests/search', async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Search in database first
      const dbGuests = await storage.searchGuests(q);
      
      // Add mock suggestions if not enough results
      const suggestions = GUEST_SUGGESTIONS.filter(guest => 
        guest.name.toLowerCase().includes(q.toLowerCase()) ||
        guest.field.toLowerCase().includes(q.toLowerCase())
      );

      const combined = [
        ...dbGuests.map(guest => ({
          name: guest.name,
          field: guest.field,
          score: guest.trendingScore,
          reason: `Expert in ${guest.field}`
        })),
        ...suggestions
      ].slice(0, 10);

      res.json(combined);
    } catch (error) {
      console.error('Error searching guests:', error);
      res.status(500).json({ error: 'Failed to search guests' });
    }
  });

  // Get all guests
  app.get('/api/guests', async (req, res) => {
    try {
      const guests = await storage.getGuests();
      res.json(guests);
    } catch (error) {
      console.error('Error fetching guests:', error);
      res.status(500).json({ error: 'Failed to fetch guests' });
    }
  });

  // Analyze guest compatibility (standard analysis)
  app.post('/api/analyze', async (req, res) => {
    try {
      const { channelUrl, guestName, field, region } = req.body;

      if (!channelUrl) {
        return res.status(400).json({ error: 'Channel URL is required' });
      }

      if (!guestName) {
        return res.status(400).json({ error: 'Guest name is required' });
      }

      // Get channel information
      const channelInfo = await youtubeService.getChannelInfo(channelUrl);
      
      // Get guest information
      const guestInfo = await aiService.getGuestInfo(guestName, field || 'general');
      
      // Perform AI analysis
      const analysis = await aiService.analyzeGuest(guestName, field || 'general', channelInfo);

      // Check if channel exists, create if not
      let channel = await storage.getChannelByChannelId(channelInfo.channelId);
      if (!channel) {
        channel = await storage.createChannel({
          channelId: channelInfo.channelId,
          channelUrl,
          title: channelInfo.title,
          description: channelInfo.description,
          subscriberCount: channelInfo.subscriberCount,
          videoCount: channelInfo.videoCount,
          viewCount: channelInfo.viewCount,
          engagementRate: channelInfo.engagementRate,
          thumbnailUrl: channelInfo.thumbnailUrl,
          topics: ["technology", "business", "innovation"] // Default topics
        });
      }

      // Check if guest exists, create if not
      let guest = await storage.getGuestByName(guestName);
      if (!guest) {
        guest = await storage.createGuest({
          name: guestName,
          field: field || 'general',
          bio: guestInfo.bio,
          socialReach: guestInfo.socialReach,
          trendingScore: guestInfo.trendingScore,
          region: region || 'global',
          expertise: guestInfo.expertise
        });
      }

      // Save analysis
      const savedAnalysis = await storage.createAnalysis({
        channelId: channel.channelId,
        guestName: guestName,
        guestField: field || 'general',
        region: region || 'global',
        compatibilityScore: analysis.compatibilityScore,
        audienceOverlap: analysis.audienceOverlap,
        trendingFactor: analysis.trendingFactor,
        topicOverlap: analysis.topicOverlap,
        riskAssessment: analysis.riskAssessment,
        recommendations: analysis.recommendations,
        detailedReport: {
          channelInfo,
          guestInfo,
          analysisResult: analysis
        }
      });

      // Return comprehensive result
      res.json({
        success: true,
        analysis: {
          ...analysis,
          channelInfo,
          guestInfo,
          analysisId: savedAnalysis.id
        }
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: `Analysis failed: ${error.message}` });
    }
  });

  // Get analysis history
  app.get('/api/analyses/:channelId?', async (req, res) => {
    try {
      const { channelId } = req.params;
      
      let analyses;
      if (channelId) {
        analyses = await storage.getAnalysesByChannelId(channelId);
      } else {
        analyses = await storage.getAnalyses();
      }

      res.json(analyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
