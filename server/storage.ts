import { type Guest, type Channel, type Analysis, type TrendingTopic, type InsertGuest, type InsertChannel, type InsertAnalysis, type InsertTrendingTopic } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Guests
  getGuests(field?: string, region?: string): Promise<Guest[]>;
  getGuestById(id: string): Promise<Guest | undefined>;
  getGuestByName(name: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: string, guest: Partial<InsertGuest>): Promise<Guest | undefined>;
  searchGuests(query: string): Promise<Guest[]>;

  // Channels
  getChannels(): Promise<Channel[]>;
  getChannelById(id: string): Promise<Channel | undefined>;
  getChannelByChannelId(channelId: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: string, channel: Partial<InsertChannel>): Promise<Channel | undefined>;

  // Analyses
  getAnalyses(channelId?: string): Promise<Analysis[]>;
  getAnalysisById(id: string): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;

  // Trending Topics
  getTrendingTopics(region?: string): Promise<TrendingTopic[]>;
  createTrendingTopic(topic: InsertTrendingTopic): Promise<TrendingTopic>;
  updateTrendingTopics(topics: InsertTrendingTopic[]): Promise<TrendingTopic[]>;
}

export class MemStorage implements IStorage {
  private guests: Map<string, Guest>;
  private channels: Map<string, Channel>;
  private analyses: Map<string, Analysis>;
  private trendingTopics: Map<string, TrendingTopic>;

  constructor() {
    this.guests = new Map();
    this.channels = new Map();
    this.analyses = new Map();
    this.trendingTopics = new Map();

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample trending topics
    const sampleTopics: InsertTrendingTopic[] = [
      { name: "Artificial Intelligence", field: "Technology", score: 95, region: "global" },
      { name: "Climate Change", field: "Science", score: 87, region: "global" },
      { name: "Cryptocurrency", field: "Finance", score: 82, region: "global" },
      { name: "Space Exploration", field: "Science", score: 78, region: "global" },
      { name: "Digital India", field: "Technology", score: 90, region: "india" },
      { name: "Startup Ecosystem", field: "Business", score: 88, region: "india" },
    ];

    sampleTopics.forEach(topic => this.createTrendingTopic(topic));

    // Sample guests matching PodcastIQ trending topics
    const sampleGuests: InsertGuest[] = [
      // AI & Technology
      {
        name: "Sam Altman",
        field: "technology",
        bio: "CEO of OpenAI and former president of Y Combinator. Leading figure in artificial intelligence development and startup acceleration.",
        socialReach: 850000,
        trendingScore: 95,
        compatibilityScore: 92,
        region: "global",
        socialMedia: { twitter: "@sama", followers: 850000 },
        expertise: ["Artificial Intelligence", "Startups", "Technology Leadership"],
      },
      {
        name: "Sundar Pichai",
        field: "technology",
        bio: "CEO of Alphabet Inc. and Google. Leading technology executive overseeing Google's AI initiatives and global tech strategy.",
        socialReach: 650000,
        trendingScore: 88,
        compatibilityScore: 89,
        region: "global",
        socialMedia: { twitter: "@sundarpichai", followers: 650000 },
        expertise: ["Technology Leadership", "AI Strategy", "Cloud Computing"],
      },
      {
        name: "Jensen Huang",
        field: "technology",
        bio: "CEO and founder of NVIDIA Corporation. Pioneer in GPU computing and artificial intelligence hardware acceleration.",
        socialReach: 420000,
        trendingScore: 91,
        compatibilityScore: 86,
        region: "global",
        socialMedia: { twitter: "@nvidiaai", followers: 420000 },
        expertise: ["GPU Computing", "AI Hardware", "Technology Innovation"],
      },
      // Business Leaders
      {
        name: "Tim Cook",
        field: "business",
        bio: "CEO of Apple Inc. Leading technology executive focused on innovation, privacy, and sustainable business practices.",
        socialReach: 920000,
        trendingScore: 85,
        compatibilityScore: 88,
        region: "global",
        socialMedia: { twitter: "@tim_cook", followers: 920000 },
        expertise: ["Business Leadership", "Technology Innovation", "Corporate Strategy"],
      },
      {
        name: "Satya Nadella",
        field: "business",
        bio: "Chairman and CEO of Microsoft. Transformational leader driving cloud computing and AI integration across enterprise solutions.",
        socialReach: 780000,
        trendingScore: 82,
        compatibilityScore: 85,
        region: "global",
        socialMedia: { twitter: "@satyanadella", followers: 780000 },
        expertise: ["Cloud Computing", "Business Transformation", "Enterprise Technology"],
      },
      {
        name: "Reed Hastings",
        field: "business",
        bio: "Co-founder and executive chairman of Netflix. Media industry pioneer who revolutionized content streaming and distribution.",
        socialReach: 340000,
        trendingScore: 79,
        compatibilityScore: 82,
        region: "global",
        socialMedia: { twitter: "@reedhastings", followers: 340000 },
        expertise: ["Media Innovation", "Streaming Technology", "Content Strategy"],
      },
      // Health & Wellness
      {
        name: "Dr. Peter Attia",
        field: "health",
        bio: "Physician focused on longevity medicine. Expert in nutritional biochemistry, exercise physiology, and sleep medicine.",
        socialReach: 650000,
        trendingScore: 89,
        compatibilityScore: 84,
        region: "global",
        socialMedia: { twitter: "@PeterAttiaMD", followers: 650000 },
        expertise: ["Longevity Medicine", "Nutritional Science", "Exercise Physiology"],
      },
      {
        name: "Dr. Rhonda Patrick",
        field: "health",
        bio: "Biomedical scientist researching aging, cancer, and nutrition. Expert in micronutrient metabolism and heat shock proteins.",
        socialReach: 580000,
        trendingScore: 86,
        compatibilityScore: 83,
        region: "global",
        socialMedia: { twitter: "@FoundMyFitness", followers: 580000 },
        expertise: ["Nutritional Science", "Aging Research", "Micronutrient Metabolism"],
      },
      {
        name: "Dr. Andrew Huberman",
        field: "health",
        bio: "Neuroscientist and professor at Stanford School of Medicine. Expert in brain plasticity, stress, and focus optimization.",
        socialReach: 1200000,
        trendingScore: 94,
        compatibilityScore: 91,
        region: "global",
        socialMedia: { twitter: "@hubermanlab", followers: 1200000 },
        expertise: ["Neuroscience", "Brain Optimization", "Sleep Science"],
      },
      // Content Creators
      {
        name: "MrBeast",
        field: "entertainment",
        bio: "YouTube creator and philanthropist known for large-scale challenges and charitable initiatives. Pioneer in viral content creation.",
        socialReach: 15000000,
        trendingScore: 98,
        compatibilityScore: 87,
        region: "global",
        socialMedia: { twitter: "@MrBeast", youtube: "@MrBeast", followers: 15000000 },
        expertise: ["Content Creation", "Social Media Strategy", "Philanthropy"],
      },
      {
        name: "Emma Chamberlain",
        field: "entertainment",
        bio: "Content creator and entrepreneur. Influential voice in lifestyle content and authentic social media engagement.",
        socialReach: 8500000,
        trendingScore: 84,
        compatibilityScore: 81,
        region: "global",
        socialMedia: { twitter: "@emmachamberlain", followers: 8500000 },
        expertise: ["Lifestyle Content", "Social Media Trends", "Personal Branding"],
      },
      {
        name: "Marques Brownlee",
        field: "technology",
        bio: "Technology reviewer and educator. Leading voice in consumer technology analysis and emerging tech trends.",
        socialReach: 6200000,
        trendingScore: 87,
        compatibilityScore: 89,
        region: "global",
        socialMedia: { twitter: "@MKBHD", youtube: "@mkbhd", followers: 6200000 },
        expertise: ["Technology Reviews", "Consumer Electronics", "Tech Journalism"],
      },
    ];

    sampleGuests.forEach(guest => this.createGuest(guest));
  }

  // Guest methods
  async getGuests(field?: string, region?: string): Promise<Guest[]> {
    let guests = Array.from(this.guests.values());
    
    if (field && field !== '') {
      guests = guests.filter(guest => guest.field === field);
    }
    
    if (region && region !== 'global') {
      guests = guests.filter(guest => guest.region === region);
    }
    
    return guests.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  }

  async getGuestById(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async getGuestByName(name: string): Promise<Guest | undefined> {
    return Array.from(this.guests.values()).find(guest => 
      guest.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const guest: Guest = { 
      ...insertGuest, 
      id, 
      lastUpdated: new Date()
    };
    this.guests.set(id, guest);
    return guest;
  }

  async updateGuest(id: string, updateData: Partial<InsertGuest>): Promise<Guest | undefined> {
    const guest = this.guests.get(id);
    if (!guest) return undefined;
    
    const updatedGuest: Guest = { 
      ...guest, 
      ...updateData, 
      lastUpdated: new Date() 
    };
    this.guests.set(id, updatedGuest);
    return updatedGuest;
  }

  async searchGuests(query: string): Promise<Guest[]> {
    if (query.length < 2) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.guests.values()).filter(guest =>
      guest.name.toLowerCase().includes(lowercaseQuery) ||
      (guest.field && guest.field.toLowerCase().includes(lowercaseQuery))
    ).slice(0, 10);
  }

  // Channel methods
  async getChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async getChannelById(id: string): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async getChannelByChannelId(channelId: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(channel => 
      channel.channelId === channelId
    );
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = randomUUID();
    const channel: Channel = { 
      ...insertChannel, 
      id, 
      lastAnalyzed: new Date()
    };
    this.channels.set(id, channel);
    return channel;
  }

  async updateChannel(id: string, updateData: Partial<InsertChannel>): Promise<Channel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;
    
    const updatedChannel: Channel = { 
      ...channel, 
      ...updateData, 
      lastAnalyzed: new Date() 
    };
    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }

  // Analysis methods
  async getAnalyses(channelId?: string): Promise<Analysis[]> {
    let analyses = Array.from(this.analyses.values());
    
    if (channelId) {
      analyses = analyses.filter(analysis => analysis.channelId === channelId);
    }
    
    return analyses.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getAnalysisById(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date()
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  // Trending Topics methods
  async getTrendingTopics(region?: string): Promise<TrendingTopic[]> {
    let topics = Array.from(this.trendingTopics.values());
    
    if (region && region !== 'global') {
      topics = topics.filter(topic => topic.region === region);
    }
    
    return topics.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  async createTrendingTopic(insertTopic: InsertTrendingTopic): Promise<TrendingTopic> {
    const id = randomUUID();
    const topic: TrendingTopic = { 
      ...insertTopic, 
      id, 
      lastUpdated: new Date()
    };
    this.trendingTopics.set(id, topic);
    return topic;
  }

  async updateTrendingTopics(topics: InsertTrendingTopic[]): Promise<TrendingTopic[]> {
    // Clear existing topics for the regions being updated
    const regions = [...new Set(topics.map(t => t.region || 'global'))];
    const existingTopics = Array.from(this.trendingTopics.values());
    
    regions.forEach(region => {
      existingTopics
        .filter(topic => topic.region === region)
        .forEach(topic => this.trendingTopics.delete(topic.id));
    });

    // Add new topics
    const createdTopics: TrendingTopic[] = [];
    for (const topic of topics) {
      const created = await this.createTrendingTopic(topic);
      createdTopics.push(created);
    }
    
    return createdTopics;
  }
}

export const storage = new MemStorage();

