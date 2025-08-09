import { useEffect, useRef } from "react";

interface ChartData {
  labels: string[];
  data: number[];
}

interface RadarChartProps {
  data: ChartData;
  className?: string;
}

export function RadarChart({ data, className = "" }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const loadChart = async () => {
      if (!canvasRef.current) return;

      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } = await import('chart.js');
      
      Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Compatibility Score',
            data: data.data,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 1)',
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2,
            pointRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.r}%`;
                }
              }
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
                color: 'rgb(156, 163, 175)',
                backdropColor: 'transparent',
              },
              grid: {
                color: 'rgb(229, 231, 235)',
              },
              angleLines: {
                color: 'rgb(229, 231, 235)',
              }
            }
          }
        }
      });
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ title, value, change, icon, trend = 'up' }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <i className={`${icon} text-primary text-lg`}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className={`font-medium ${trendColor}`}>{change}</span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>
      )}
    </div>
  );
}
