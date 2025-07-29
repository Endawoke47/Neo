import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@counselflow/ui/components/Card';
import { BarChart3, Activity, Zap, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { usePerformanceMonitor, measureBundleImpact } from '../../lib/performance';

const PerformanceDashboard: React.FC = () => {
  const { getMetrics, reportWebVitals } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<any>({});
  const [webVitals, setWebVitals] = useState<any>({});
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('show-performance-dashboard')) {
      setShowDashboard(true);
    }
  }, []);

  useEffect(() => {
    if (!showDashboard) return;

    const updateMetrics = () => {
      setMetrics(getMetrics());
      setWebVitals(reportWebVitals());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    
    // Initial update
    updateMetrics();
    
    // Measure bundle impact
    measureBundleImpact();

    return () => clearInterval(interval);
  }, [showDashboard, getMetrics, reportWebVitals]);

  if (!showDashboard) {
    return null;
  }

  const getStatusColor = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'largest-contentful-paint': { good: 2500, poor: 4000 },
      'first-input-delay': { good: 100, poor: 300 },
      'cumulative-layout-shift': { good: 0.1, poor: 0.25 },
      'page-load': { good: 3000, poor: 5000 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'text-blue-600';

    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (value: number, unit = 'ms') => {
    if (value < 1000) {
      return `${value.toFixed(1)}${unit}`;
    }
    return `${(value / 1000).toFixed(2)}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-4xl">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Performance Dashboard
            </CardTitle>
            <button
              onClick={() => setShowDashboard(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Web Vitals */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Core Web Vitals
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor('largest-contentful-paint', webVitals.lcp)}`}>
                  {formatValue(webVitals.lcp)}
                </div>
                <div className="text-xs text-gray-600">LCP</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor('first-input-delay', webVitals.fid)}`}>
                  {formatValue(webVitals.fid)}
                </div>
                <div className="text-xs text-gray-600">FID</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor('cumulative-layout-shift', webVitals.cls)}`}>
                  {webVitals.cls.toFixed(3)}
                </div>
                <div className="text-xs text-gray-600">CLS</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor('page-load', webVitals.pageLoad)}`}>
                  {formatValue(webVitals.pageLoad)}
                </div>
                <div className="text-xs text-gray-600">Page Load</div>
              </div>
            </div>
          </div>

          {/* Component Performance */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Component Performance
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(metrics)
                .filter(([name]) => name.startsWith('component-'))
                .sort(([, a]: any, [, b]: any) => b.avg - a.avg)
                .slice(0, 8)
                .map(([name, data]: any) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 truncate">
                      {name.replace('component-', '')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatValue(data.avg)}</span>
                      <span className="text-xs text-gray-500">
                        ({data.count})
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Performance Recommendations */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {webVitals.lcp > 4000 && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-red-700">LCP is slow. Consider optimizing images and critical resources.</span>
                </div>
              )}
              {webVitals.fid > 300 && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-red-700">FID is poor. Reduce JavaScript execution time.</span>
                </div>
              )}
              {webVitals.cls > 0.25 && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span className="text-red-700">CLS is high. Ensure size attributes on media elements.</span>
                </div>
              )}
              {Object.values(metrics).some((m: any) => m.avg > 16) && (
                <div className="flex items-start space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-yellow-700">Some components are slow. Consider memoization.</span>
                </div>
              )}
              {Object.keys(metrics).length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  No performance data available yet. Interact with the app to see metrics.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(PerformanceDashboard);