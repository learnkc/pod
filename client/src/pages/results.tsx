import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/ui/charts";
import { ArrowLeft, Download, Share, Lightbulb, TrendingUp, Users } from "lucide-react";

interface AnalysisResults {
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

export default function Results() {
  const [, setLocation] = useLocation();
  const [results, setResults] = useState<AnalysisResults | null>(null);

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      setLocation('/');
    }
  }, [setLocation]);

  if (!results) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const chartData = {
    labels: [
      'Topic Relevance', 
      'Audience Match', 
      'Trending Factor', 
      'Social Reach', 
      'Content Quality', 
      'Engagement Potential'
    ],
    data: [
      results.compatibilityScore,
      results.audienceOverlap,
      results.trendingFactor,
      Math.floor(Math.random() * 20) + 75, // Social reach simulation
      Math.floor(Math.random() * 15) + 85, // Content quality simulation
      Math.floor(Math.random() * 20) + 70  // Engagement potential simulation
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share className="mr-2 h-4 w-4" />
                Share Results
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Analysis Results</h1>
          <p className="text-gray-600">Comprehensive guest compatibility analysis completed</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`${getScoreBg(results.compatibilityScore)} border`}>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Compatibility</h3>
                <div className={`text-3xl font-bold ${getScoreColor(results.compatibilityScore)} mb-2`}>
                  {results.compatibilityScore}%
                </div>
                <p className="text-sm text-gray-600">Content alignment</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getScoreBg(results.audienceOverlap)} border`}>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">👥 Audience Overlap</h3>
                <div className={`text-3xl font-bold ${getScoreColor(results.audienceOverlap)} mb-2`}>
                  {results.audienceOverlap}%
                </div>
                <p className="text-sm text-gray-600">Shared demographics</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getScoreBg(results.topicOverlap || 85)} border`}>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Topic Overlap</h3>
                <div className={`text-3xl font-bold ${getScoreColor(results.topicOverlap || 85)} mb-2`}>
                  {results.topicOverlap || 85}%
                </div>
                <p className="text-sm text-gray-600">Content similarity</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getScoreBg(results.trendingFactor)} border`}>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">🔥 Trending Factor</h3>
                <div className={`text-3xl font-bold ${getScoreColor(results.trendingFactor)} mb-2`}>
                  {results.trendingFactor}%
                </div>
                <p className="text-sm text-gray-600">Current relevance</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Channel Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={results.channelInfo?.thumbnailUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=64&h=64&fit=crop"} 
                    alt="Channel thumbnail" 
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{results.channelInfo?.title}</p>
                    <p className="text-sm text-gray-500">
                      {results.channelInfo?.subscriberCount?.toLocaleString()} subscribers
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {results.channelInfo?.videoCount || 0}
                    </p>
                    <p className="text-xs text-gray-500">Videos</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {results.channelInfo?.viewCount ? `${Math.floor(results.channelInfo.viewCount / 1000000)}M` : '0'}
                    </p>
                    <p className="text-xs text-gray-500">Total Views</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {results.channelInfo?.engagementRate || '0%'}
                    </p>
                    <p className="text-xs text-gray-500">Engagement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          {results.guestInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Guest Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&crop=face" 
                        alt="Guest photo" 
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{results.guestInfo.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{results.guestInfo.field}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {results.riskAssessment} Risk
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Social Reach</span>
                      <span className="font-medium">
                        {results.guestInfo.socialReach ? `${Math.floor(results.guestInfo.socialReach / 1000)}K` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trending Score</span>
                      <span className="font-medium">{results.guestInfo.trendingScore || 0}</span>
                    </div>
                  </div>

                  {results.guestInfo.bio && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Biography</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {results.guestInfo.bio}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Compatibility Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Compatibility Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis across multiple compatibility factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <RadarChart data={chartData} className="w-full h-full" />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detailed Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Compatibility Score</span>
                  <span className="text-sm text-gray-600">{results.compatibilityScore}%</span>
                </div>
                <Progress value={results.compatibilityScore} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Audience Overlap</span>
                  <span className="text-sm text-gray-600">{results.audienceOverlap}%</span>
                </div>
                <Progress value={results.audienceOverlap} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Topic Overlap</span>
                  <span className="text-sm text-gray-600">{results.topicOverlap || 85}%</span>
                </div>
                <Progress value={results.topicOverlap || 85} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Trending Factor</span>
                  <span className="text-sm text-gray-600">{results.trendingFactor}%</span>
                </div>
                <Progress value={results.trendingFactor} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Strategic insights and actionable recommendations for your podcast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {recommendation}
                  </p>
                </div>
              ))}

              {/* Additional contextual recommendations */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Strategic Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Market Opportunity</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Current trending topics suggest high engagement potential for this collaboration.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Audience Growth</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Strong audience overlap indicates potential for subscriber growth and cross-promotion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
