// ai_routes.ts
// Enhanced routes that use the AI engine

import { Router } from 'express';
import { aiEngineService } from '../integration/ai_engine_bridge';
import { storage } from './storage';

const router = Router();

// Health check for AI integration
router.get('/ai/health', async (req, res) => {
  try {
    const engineRunning = await aiEngineService.ensureEngineRunning();
    const ollamaStatus = await aiEngineService.checkOllamaStatus();
    
    res.json({
      status: 'healthy',
      aiEngine: engineRunning,
      ollama: ollamaStatus.running,
      model: ollamaStatus.model || 'Not found',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Check AI engine status
router.get('/ai/status', async (req, res) => {
  try {
    // Check if the AI engine is running
    const engineRunning = await aiEngineService.ensureEngineRunning();
    
    // Check if Ollama is running
    const ollamaStatus = await aiEngineService.checkOllamaStatus();
    
    res.json({
      aiEngine: {
        running: engineRunning,
        url: 'http://localhost:8001',
      },
      ollama: {
        running: ollamaStatus.running,
        model: ollamaStatus.model || 'Not found',
        error: ollamaStatus.error,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to check AI status: ${error.message}` });
  }
});

// Enhanced analyze endpoint that uses the AI engine
router.post('/ai/analyze', async (req, res) => {
  try {
    const { channelUrl, guestName, field, region } = req.body;

    if (!channelUrl) {
      return res.status(400).json({ error: 'Channel URL is required' });
    }

    if (!guestName) {
      return res.status(400).json({ error: 'Guest name is required' });
    }

    // Call the AI engine to analyze the guest
    const analysisResult = await aiEngineService.analyzePodcastGuest({
      guestName,
      guestField: field,
      channelUrl,
      region,
    });

    if (!analysisResult.success) {
      return res.status(500).json({ error: analysisResult.error });
    }

    // Extract data from the analysis
    const { analysis } = analysisResult;
    const { channelInfo, guestInfo } = analysis;

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
        field: field || guestInfo.field,
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
      guestField: field || guestInfo.field,
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

    // Return the analysis result
    res.json({
      success: true,
      analysis: {
        ...analysis,
        analysisId: savedAnalysis.id
      }
    });
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ error: `AI Analysis failed: ${error.message}` });
  }
});

export default router;
