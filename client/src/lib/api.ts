import { apiRequest } from './queryClient';

export interface AnalysisRequest {
  channelUrl: string;
  guestName?: string;
  field?: string;
  region?: string;
  trendingPeriod?: string;
}

export interface AnalysisResult {
  compatibilityScore: number;
  audienceOverlap: number;
  topicOverlap: number;
  trendingFactor: number;
  riskAssessment: string;
  recommendations: string[];
  channelInfo: any;
  guestInfo: any;
  analysisId: string;
}

export const api = {
  // Get dashboard metrics
  getMetrics: async () => {
    const response = await apiRequest('GET', '/api/metrics');
    return response.json();
  },

  // Get trending topics
  getTrendingTopics: async (region?: string) => {
    const url = region ? `/api/trending-topics?region=${region}` : '/api/trending-topics';
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // Search guests
  searchGuests: async (query: string) => {
    const response = await apiRequest('GET', `/api/guests/search?query=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Get all guests
  getGuests: async (field?: string, region?: string) => {
    let url = '/api/guests';
    const params = new URLSearchParams();
    if (field) params.append('field', field);
    if (region) params.append('region', region);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // Analyze guest compatibility
  analyzeGuest: async (data: AnalysisRequest): Promise<{ analysis: AnalysisResult }> => {
    const response = await apiRequest('POST', '/api/analyze', data);
    return response.json();
  },

  // Get analysis history
  getAnalyses: async (channelId?: string) => {
    const url = channelId ? `/api/analyses/${channelId}` : '/api/analyses';
    const response = await apiRequest('GET', url);
    return response.json();
  },
};
