// ai_engine_bridge.ts
// Bridge between Express backend and Python AI engine (API only)

import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Configuration
const AI_ENGINE_PORT = 8001; // Changed to avoid conflict
const AI_ENGINE_URL = `http://localhost:${AI_ENGINE_PORT}`;
const AI_ENGINE_PATH = path.resolve(process.cwd(), 'ai_engine');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Interface for guest analysis request
interface GuestAnalysisRequest {
  guestName: string;
  guestField?: string;
  channelUrl?: string;
  region?: string;
}

// Interface for guest analysis response
interface GuestAnalysisResponse {
  success: boolean;
  error?: string;
  analysis?: any;
}

/**
 * AI Engine Service
 * Handles communication with the Python AI engine (API only)
 */
class AIEngineService {
  private engineProcess: any = null;
  private isEngineRunning: boolean = false;

  constructor() {
    this.checkEngineStatus();
  }

  /**
   * Check if the AI engine is running
   */
  private async checkEngineStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${AI_ENGINE_URL}/health`, { timeout: 2000 });
      this.isEngineRunning = response.status === 200;
      console.log(`AI Engine status: ${this.isEngineRunning ? 'Running' : 'Not running'}`);
      return this.isEngineRunning;
    } catch (error) {
      this.isEngineRunning = false;
      return false;
    }
  }

  /**
   * Start the AI engine if it's not already running (API only)
   */
  async ensureEngineRunning(): Promise<boolean> {
    const isRunning = await this.checkEngineStatus();
    if (isRunning) {
      return true;
    }

    console.log('Starting AI Engine API...');
    
    if (!fs.existsSync(AI_ENGINE_PATH)) {
      console.log(`AI Engine directory not found at ${AI_ENGINE_PATH}`);
      return false;
    }

    try {
      // Start the AI engine with API-only mode
      this.engineProcess = spawn('python', ['api_server.py'], {
        cwd: AI_ENGINE_PATH,
        env: {
          ...process.env,
          OLLAMA_URL,
          PORT: AI_ENGINE_PORT.toString(),
          API_ONLY: 'true', // Flag to run in API-only mode
        },
        stdio: 'pipe',
      });

      this.engineProcess.stdout.on('data', (data: Buffer) => {
        console.log(`AI Engine: ${data.toString().trim()}`);
      });

      this.engineProcess.stderr.on('data', (data: Buffer) => {
        console.log(`AI Engine Error: ${data.toString().trim()}`);
      });

      this.engineProcess.on('close', (code: number) => {
        console.log(`AI Engine process exited with code ${code}`);
        this.isEngineRunning = false;
        this.engineProcess = null;
      });

      // Wait for the engine to start
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await this.checkEngineStatus();
        if (status) {
          console.log('AI Engine API started successfully');
          return true;
        }
      }

      console.log('Failed to start AI Engine API');
      return false;
    } catch (error) {
      console.log(`Error starting AI Engine: ${error}`);
      return false;
    }
  }

  /**
   * Analyze a podcast guest using the AI engine
   */
  async analyzePodcastGuest(request: GuestAnalysisRequest): Promise<GuestAnalysisResponse> {
    try {
      const isRunning = await this.ensureEngineRunning();
      if (!isRunning) {
        return {
          success: false,
          error: 'AI Engine is not running and could not be started',
        };
      }

      // Prepare the request data
      const requestData = {
        guest_name: request.guestName,
        guest_url: this.constructGuestUrl(request.guestName, request.guestField),
        host_channel: request.channelUrl || 'https://youtube.com/@lexfridman',
        field: request.guestField || 'general'
      };

      console.log(`Calling AI Engine to analyze guest: ${request.guestName}`);
      const response = await axios.post(`${AI_ENGINE_URL}/api/analyze`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minute timeout for LLM processing
      });

      if (response.data.error) {
        return {
          success: false,
          error: response.data.error,
        };
      }

      const transformedAnalysis = this.transformAIEngineResponse(response.data, request);

      return {
        success: true,
        analysis: transformedAnalysis,
      };
    } catch (error: any) {
      console.log(`Error analyzing guest: ${error.message}`);
      return {
        success: false,
        error: `Analysis failed: ${error.message}`,
      };
    }
  }

  /**
   * Construct a guest URL for searching
   */
  private constructGuestUrl(guestName: string, field?: string): string {
    // Try to construct a meaningful URL for the guest
    const searchQuery = encodeURIComponent(`${guestName} ${field || ''}`).trim();
    return `https://www.google.com/search?q=${searchQuery}`;
  }

  /**
   * Transform the AI engine response to match our API format
   */
  private transformAIEngineResponse(aiResponse: any, request: GuestAnalysisRequest): any {
    const guestProfile = aiResponse.guest_profile || {};
    const hostAnalysis = aiResponse.host_analysis || {};
    const relevanceAnalysis = aiResponse.relevance_analysis || {};
    const recommendationSummary = aiResponse.recommendation_summary || {};

    const channelInfo = {
      channelId: hostAnalysis.channel_id || 'unknown',
      title: hostAnalysis.channel_title || 'Unknown Channel',
      description: hostAnalysis.channel_description || '',
      subscriberCount: hostAnalysis.subscriber_count || 0,
      videoCount: hostAnalysis.video_count || 0,
      viewCount: hostAnalysis.view_count || 0,
      engagementRate: hostAnalysis.engagement_rate || '0%',
      thumbnailUrl: hostAnalysis.thumbnail_url || '',
    };

    const guestInfo = {
      name: guestProfile.name || request.guestName,
      field: guestProfile.industry || request.guestField || 'general',
      bio: guestProfile.bio || `${request.guestName} is a professional in the ${request.guestField || 'general'} field.`,
      socialReach: this.calculateSocialReach(guestProfile.social_following),
      trendingScore: recommendationSummary.overall_score || 0,
      expertise: guestProfile.expertise_areas || [request.guestField || 'general'],
    };

    return {
      compatibilityScore: recommendationSummary.overall_score || 0,
      audienceOverlap: relevanceAnalysis.score_breakdown?.audience_appeal?.score || 0,
      topicOverlap: relevanceAnalysis.score_breakdown?.topic_alignment?.score || 0,
      trendingFactor: relevanceAnalysis.score_breakdown?.uniqueness_factor?.score || 0,
      riskAssessment: relevanceAnalysis.confidence_level || 'Medium',
      recommendations: relevanceAnalysis.key_strengths || [`Strong potential in ${request.guestField || 'general'} field`],
      channelInfo,
      guestInfo,
      detailedReport: aiResponse.final_report || `Analysis completed for ${request.guestName}`,
    };
  }

  /**
   * Calculate social reach from social following data
   */
  private calculateSocialReach(socialFollowing: any): number {
    if (!socialFollowing) return 0;
    
    let totalReach = 0;
    for (const [platform, followers] of Object.entries(socialFollowing)) {
      if (followers && followers !== 'unknown') {
        const followerCount = parseInt(String(followers).replace(/[^0-9]/g, '') || '0');
        totalReach += followerCount;
      }
    }
    return totalReach;
  }

  /**
   * Check the status of Ollama
   */
  async checkOllamaStatus(): Promise<{ running: boolean; model?: string; error?: string }> {
    try {
      const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
      if (response.status === 200) {
        const models = response.data.models || [];
        const llama31Model = models.find((m: any) => m.name.includes('llama3.1'));
        
        return {
          running: true,
          model: llama31Model ? llama31Model.name : 'llama3.1 not found',
        };
      }
      
      return {
        running: false,
        error: `Ollama returned status ${response.status}`,
      };
    } catch (error: any) {
      return {
        running: false,
        error: `Ollama connection failed: ${error.message}`,
      };
    }
  }
}

export const aiEngineService = new AIEngineService();
