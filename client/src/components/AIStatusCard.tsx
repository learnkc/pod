import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Placeholder UI components - in a real app, these would be imported from your UI library
const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

const CardContent = ({ children }) => (
  <div className="p-6 pt-0">{children}</div>
);

const CardFooter = ({ children }) => (
  <div className="flex items-center p-6 pt-0">{children}</div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-green-500 text-white',
    destructive: 'bg-red-500 text-white',
    outline: 'border border-input bg-background text-foreground'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'default', size = 'default', onClick, className = '' }) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3'
  };
  
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface AIStatusResponse {
  aiEngine: {
    running: boolean;
    url: string;
  };
  ollama: {
    running: boolean;
    model: string;
    error?: string;
  };
}

export function AIStatusCard() {
  const { data, isLoading, isError, refetch } = useQuery<AIStatusResponse>({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const response = await axios.get('/api/ai/status');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">AI Engine Status</CardTitle>
        <CardDescription>Llama 3.1 Integration Status</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse"></div>
            <p>Checking AI status...</p>
          </div>
        ) : isError ? (
          <div className="text-red-500">Failed to check AI status</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>AI Engine:</span>
              <Badge variant={data?.aiEngine.running ? "success" : "destructive"}>
                {data?.aiEngine.running ? "Running" : "Offline"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Ollama:</span>
              <Badge variant={data?.ollama.running ? "success" : "destructive"}>
                {data?.ollama.running ? "Running" : "Offline"}
              </Badge>
            </div>
            
            {data?.ollama.running && (
              <div className="flex items-center justify-between">
                <span>Model:</span>
                <Badge variant="outline">{data.ollama.model}</Badge>
              </div>
            )}
            
            {data?.ollama.error && (
              <div className="text-sm text-red-500 mt-2">
                {data.ollama.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AIStatusCard;
