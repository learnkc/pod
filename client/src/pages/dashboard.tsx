import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api, type AnalysisRequest } from "@/lib/api";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<AnalysisRequest>({
    channelUrl: '',
    guestName: '',
    field: '',
    region: 'global',
    trendingPeriod: '30days'
  });

  const [activeTab, setActiveTab] = useState('analyze');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestSuggestions, setGuestSuggestions] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Guest search for autocomplete
  useEffect(() => {
    const searchGuests = async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await api.searchGuests(searchQuery);
          setGuestSuggestions(response.suggestions || []);
          setShowAutocomplete(true);
        } catch (error) {
          setGuestSuggestions([]);
          setShowAutocomplete(false);
        }
      } else {
        setGuestSuggestions([]);
        setShowAutocomplete(false);
      }
    };

    const debounce = setTimeout(searchGuests, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: api.analyzeGuest,
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: "Guest compatibility analysis has been completed successfully.",
      });
      
      sessionStorage.setItem('analysisResults', JSON.stringify(data.analysis));
      setLocation('/results');
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze guest compatibility.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.channelUrl) {
      toast({
        title: "Missing Information",
        description: "Please enter a YouTube channel URL.",
        variant: "destructive",
      });
      return;
    }

    analysisMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof AnalysisRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'guestName') {
      setSearchQuery(value);
    }
  };

  const selectGuest = (guest: any) => {
    setFormData(prev => ({ ...prev, guestName: guest.name }));
    setSearchQuery(guest.name);
    setShowAutocomplete(false);
  };

  const handleQuickAction = (type: string) => {
    if (!formData.channelUrl) {
      toast({
        title: "Channel URL Required",
        description: "Please enter your YouTube channel URL first.",
        variant: "destructive",
      });
      return;
    }

    const quickActions = {
      trending: () => handleInputChange('field', 'technology'),
      competitors: () => handleInputChange('field', 'business'),
      seasonal: () => handleInputChange('field', 'entertainment')
    };

    quickActions[type as keyof typeof quickActions]?.();
    
    toast({
      title: "Quick Analysis Started",
      description: `Analyzing ${type} recommendations for your channel...`,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-5">
        {/* Header */}
        <div className="text-center mb-10 text-white">
          <h1 className="text-4xl font-bold mb-2 text-shadow-lg">
            🎙️ PodcastIQ
          </h1>
          <p className="text-lg opacity-90">
            AI-Powered Guest Analysis for Podcast Hosts
          </p>
        </div>

        {/* Main Dashboard */}
        <div className="podcast-dashboard">
          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'analyze' ? 'active' : ''}`}
              onClick={() => setActiveTab('analyze')}
            >
              🔍 Analyze Guest
            </button>
            <button 
              className={`nav-tab ${activeTab === 'discover' ? 'active' : ''}`}
              onClick={() => setActiveTab('discover')}
            >
              🌟 Discover Trending
            </button>
            <button 
              className={`nav-tab ${activeTab === 'match' ? 'active' : ''}`}
              onClick={() => setActiveTab('match')}
            >
              🎯 Smart Match
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-10">
            {activeTab === 'analyze' && (
              <div>
                <form onSubmit={handleSubmit}>
                  <div className="input-grid">
                    <div className="input-group">
                      <label htmlFor="guest-name">
                        Guest Name <span className="feature-badge">AI Powered</span>
                      </label>
                      <input
                        type="text"
                        id="guest-name"
                        className="input-field"
                        placeholder="e.g., Elon Musk, Neil deGrasse Tyson"
                        value={formData.guestName}
                        onChange={(e) => handleInputChange('guestName', e.target.value)}
                      />
                      {showAutocomplete && guestSuggestions.length > 0 && (
                        <div className="autocomplete-dropdown" style={{ display: 'block' }}>
                          {guestSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="autocomplete-item"
                              onClick={() => selectGuest(suggestion)}
                            >
                              {suggestion.name} - {suggestion.field}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="input-group">
                      <label htmlFor="field-selector">Field/Industry</label>
                      <select
                        id="field-selector"
                        className="input-field select-field"
                        value={formData.field}
                        onChange={(e) => handleInputChange('field', e.target.value)}
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

                    <div className="input-group">
                      <label htmlFor="region-selector">Target Region</label>
                      <select
                        id="region-selector"
                        className="input-field select-field"
                        value={formData.region}
                        onChange={(e) => handleInputChange('region', e.target.value)}
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

                    <div className="input-group">
                      <label htmlFor="trending-period">Trending Period</label>
                      <select
                        id="trending-period"
                        className="input-field select-field"
                        value={formData.trendingPeriod}
                        onChange={(e) => handleInputChange('trendingPeriod', e.target.value)}
                      >
                        <option value="7days">📅 Last 7 Days</option>
                        <option value="30days">📅 Last 30 Days</option>
                        <option value="90days">📅 Last 3 Months</option>
                        <option value="1year">📅 Last Year</option>
                      </select>
                    </div>

                    <div className="input-group channel-input">
                      <label htmlFor="channel-url">
                        Your YouTube Channel URL <span className="feature-badge">Required</span>
                      </label>
                      <input
                        type="url"
                        id="channel-url"
                        className="input-field"
                        placeholder="https://youtube.com/@yourchannel or Channel ID"
                        value={formData.channelUrl}
                        onChange={(e) => handleInputChange('channelUrl', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="analyze-btn"
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? '🔄 Analyzing... This may take a moment' : '🚀 Analyze Guest Compatibility'}
                  </button>
                </form>

                <div className="quick-actions">
                  <div className="quick-action" onClick={() => handleQuickAction('trending')}>
                    <h3>🔥 Trending Now</h3>
                    <p>Discover who's trending in your field right now and their compatibility with your audience</p>
                  </div>
                  <div className="quick-action" onClick={() => handleQuickAction('competitors')}>
                    <h3>👥 Competitor Analysis</h3>
                    <p>See what guests similar channels are featuring and find overlooked opportunities</p>
                  </div>
                  <div className="quick-action" onClick={() => handleQuickAction('seasonal')}>
                    <h3>📅 Seasonal Insights</h3>
                    <p>Get recommendations based on upcoming events, holidays, and trending topics</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'discover' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">🌟 Discover Trending Guests</h2>
                <p className="text-gray-500 mb-8">Find the most popular guests in your industry right now</p>
                <button className="analyze-btn max-w-md mx-auto">
                  🔍 Search Trending Guests
                </button>
              </div>
            )}

            {activeTab === 'match' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">🎯 Smart Match</h2>
                <p className="text-gray-500 mb-8">Get AI-powered guest recommendations based on your channel</p>
                <button className="analyze-btn max-w-md mx-auto">
                  🤖 Find Perfect Matches
                </button>
              </div>
            )}
          </div>

          {/* Trending Section */}
          <div className="trending-section">
            <div className="trending-header">
              <h3>Currently Trending</h3>
              <span className="fire-icon">🔥</span>
            </div>
            <div className="trending-grid">
              <div className="trending-item">
                <h4>AI & Technology</h4>
                <p>Sam Altman, Sundar Pichai, Jensen Huang</p>
              </div>
              <div className="trending-item">
                <h4>Business Leaders</h4>
                <p>Tim Cook, Satya Nadella, Reed Hastings</p>
              </div>
              <div className="trending-item">
                <h4>Health & Wellness</h4>
                <p>Dr. Peter Attia, Rhonda Patrick, Andrew Huberman</p>
              </div>
              <div className="trending-item">
                <h4>Content Creators</h4>
                <p>MrBeast, Emma Chamberlain, Marques Brownlee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
