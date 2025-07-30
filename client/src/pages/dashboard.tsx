import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

const Dashboard = () => {
  const [channelUrl, setChannelUrl] = useState('');
  const [guestName, setGuestName] = useState('');
  const [field, setField] = useState('technology');
  const [region, setRegion] = useState('global');
  const [result, setResult] = useState(null);

  // AI-powered analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/ai/analyze', data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Analysis completed:', data);
      setResult(data);
    },
    onError: (error: any) => {
      console.error('Analysis failed:', error);
    },
  });

  const handleAnalyze = () => {
    if (!channelUrl || !guestName) {
      alert('Please fill in both Channel URL and Guest Name');
      return;
    }

    analysisMutation.mutate({
      channelUrl,
      guestName,
      field,
      region,
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Podcast Guest Tracker</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Analyze New Guest</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              YouTube Channel URL
            </label>
            <input
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://youtube.com/@channel"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Guest Name
            </label>
            <input
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Field/Industry
            </label>
            <select
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              value={field}
              onChange={(e) => setField(e.target.value)}
            >
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Region
            </label>
            <select
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="global">Global</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="eu">Europe</option>
              <option value="asia">Asia</option>
            </select>
          </div>
        </div>

        <button
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
          onClick={handleAnalyze}
          disabled={analysisMutation.isPending}
        >
          {analysisMutation.isPending ? 'Analyzing with AI...' : 'Analyze Guest'}
        </button>
      </div>

      {analysisMutation.isError && (
        <div style={{ padding: '15px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '4px', marginTop: '20px' }}>
          <p style={{ color: '#c62828' }}>
            Analysis failed: {analysisMutation.error?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {result && (
        <div style={{ padding: '15px', backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '4px', marginTop: '20px' }}>
          <h3>Analysis Results</h3>
          <p>
            Compatibility Score: {result.analysis?.compatibilityScore || 0}/100
          </p>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
