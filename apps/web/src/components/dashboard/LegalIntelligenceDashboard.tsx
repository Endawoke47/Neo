// Legal Intelligence Dashboard Component
// Phase 2: Feature 3 - Frontend Integration for Legal Intelligence Analytics

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, AlertTriangle, Brain, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Types
interface LegalIntelligenceRequest {
  analysisTypes: string[];
  jurisdictions: string[];
  legalAreas: string[];
  period: string;
  filters: Record<string, any>;
  insights: {
    includeRecommendations: boolean;
    includePredictions: boolean;
    includeComparisons: boolean;
    includeTrends: boolean;
    includeAlerts: boolean;
    detailLevel: 'summary' | 'detailed';
    visualizations: string[];
  };
  language: string;
  confidentialityLevel: string;
}

interface TrendData {
  id: string;
  name: string;
  direction: string;
  magnitude: number;
  significance: number;
  timeframe: string;
  dataPoints: Array<{ date: string; value: number; confidence: number }>;
}

interface Prediction {
  id: string;
  type: string;
  outcome: string;
  probability: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  impact: string;
}

interface IntelligenceResult {
  analysisId: string;
  requestSummary: {
    analysisTypesRequested: string[];
    jurisdictionsAnalyzed: string[];
    legalAreasAnalyzed: string[];
    coveragePeriod: string;
  };
  trendAnalysis: TrendData[];
  predictiveInsights: Prediction[];
  keyInsights: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    significance: number;
    actionable: boolean;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    expectedImpact: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    deadline?: string;
  }>;
  visualizations: Array<{
    id: string;
    type: string;
    title: string;
    data: any[];
  }>;
  metadata: {
    requestId: string;
    executionTime: number;
    accuracy: { overall: number };
    coverage: { sampleSize: number };
  };
}

const LegalIntelligenceDashboard: React.FC = () => {
  // State
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('trends');
  
  // Form state
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(['NIGERIA']);
  const [selectedLegalAreas, setSelectedLegalAreas] = useState<string[]>(['CORPORATE']);
  const [selectedPeriod, setSelectedPeriod] = useState('LAST_6_MONTHS');
  const [analysisTypes, setAnalysisTypes] = useState<string[]>(['TREND_ANALYSIS']);

  // Configuration
  const jurisdictions = [
    { value: 'NIGERIA', label: 'Nigeria' },
    { value: 'SOUTH_AFRICA', label: 'South Africa' },
    { value: 'KENYA', label: 'Kenya' },
    { value: 'GHANA', label: 'Ghana' },
    { value: 'UAE', label: 'United Arab Emirates' },
    { value: 'SAUDI_ARABIA', label: 'Saudi Arabia' },
    { value: 'EGYPT', label: 'Egypt' },
    { value: 'MOROCCO', label: 'Morocco' },
  ];

  const legalAreas = [
    { value: 'CORPORATE', label: 'Corporate Law' },
    { value: 'COMMERCIAL', label: 'Commercial Law' },
    { value: 'LITIGATION', label: 'Litigation' },
    { value: 'EMPLOYMENT', label: 'Employment Law' },
    { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property' },
    { value: 'REAL_ESTATE', label: 'Real Estate' },
    { value: 'TAX', label: 'Tax Law' },
    { value: 'REGULATORY', label: 'Regulatory Compliance' },
  ];

  const periods = [
    { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
    { value: 'LAST_YEAR', label: 'Last Year' },
    { value: 'LAST_2_YEARS', label: 'Last 2 Years' },
    { value: 'LAST_5_YEARS', label: 'Last 5 Years' },
  ];

  const analysisTypeOptions = [
    { value: 'TREND_ANALYSIS', label: 'Trend Analysis', icon: TrendingUp },
    { value: 'PREDICTIVE_MODELING', label: 'Predictive Modeling', icon: Brain },
    { value: 'COMPARATIVE_ANALYSIS', label: 'Comparative Analysis', icon: BarChart3 },
    { value: 'RISK_INTELLIGENCE', label: 'Risk Intelligence', icon: AlertTriangle },
    { value: 'MARKET_INTELLIGENCE', label: 'Market Intelligence', icon: BarChart3 },
    { value: 'REGULATORY_INTELLIGENCE', label: 'Regulatory Intelligence', icon: AlertTriangle },
  ];

  // API call
  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request: LegalIntelligenceRequest = {
        analysisTypes,
        jurisdictions: selectedJurisdictions,
        legalAreas: selectedLegalAreas,
        period: selectedPeriod,
        filters: {},
        insights: {
          includeRecommendations: true,
          includePredictions: true,
          includeComparisons: true,
          includeTrends: true,
          includeAlerts: true,
          detailLevel: 'detailed',
          visualizations: ['LINE_CHART', 'BAR_CHART', 'PIE_CHART']
        },
        language: 'ENGLISH',
        confidentialityLevel: 'public'
      };

      const response = await fetch('/api/intelligence/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [analysisTypes, selectedJurisdictions, selectedLegalAreas, selectedPeriod]);

  // Chart colors
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  // Render trend chart
  const renderTrendChart = (trend: TrendData) => (
    <Card key={trend.id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {trend.name}
        </CardTitle>
        <CardDescription>
          {trend.direction} trend with {(trend.significance * 100).toFixed(1)}% significance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend.dataPoints}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8' }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#82ca9d"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Render prediction card
  const renderPredictionCard = (prediction: Prediction) => (
    <Card key={prediction.id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {prediction.type}
          </span>
          <Badge variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}>
            {(prediction.probability * 100).toFixed(1)}% probability
          </Badge>
        </CardTitle>
        <CardDescription>{prediction.outcome}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%</p>
          <p><strong>Timeframe:</strong> {prediction.timeframe}</p>
          <p><strong>Impact:</strong> {prediction.impact}</p>
          <div>
            <strong>Key Factors:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {prediction.factors.map((factor, index) => (
                <Badge key={index} variant="outline">{factor}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Legal Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered legal analytics and insights for informed decision-making
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Configuration</CardTitle>
          <CardDescription>
            Configure your legal intelligence analysis parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Jurisdictions</label>
              <Select value={selectedJurisdictions[0]} onValueChange={(value) => setSelectedJurisdictions([value])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions.map((jurisdiction) => (
                    <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                      {jurisdiction.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Legal Areas</label>
              <Select value={selectedLegalAreas[0]} onValueChange={(value) => setSelectedLegalAreas([value])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {legalAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <Select value={analysisTypes[0]} onValueChange={(value) => setAnalysisTypes([value])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Analysis'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trends Found</p>
                    <p className="text-2xl font-bold">{result.trendAnalysis?.length || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Predictions</p>
                    <p className="text-2xl font-bold">{result.predictiveInsights?.length || 0}</p>
                  </div>
                  <Brain className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alerts</p>
                    <p className="text-2xl font-bold">{result.alerts?.length || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold">
                      {(result.metadata.accuracy.overall * 100).toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <h3 className="text-xl font-semibold">Trend Analysis</h3>
              {result.trendAnalysis?.length > 0 ? (
                result.trendAnalysis.map(renderTrendChart)
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No trend data available for the selected criteria
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <h3 className="text-xl font-semibold">Predictive Insights</h3>
              {result.predictiveInsights?.length > 0 ? (
                result.predictiveInsights.map(renderPredictionCard)
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No predictive insights available for the selected criteria
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <h3 className="text-xl font-semibold">Key Insights</h3>
              <div className="grid gap-4">
                {result.keyInsights?.map((insight) => (
                  <Card key={insight.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {insight.title}
                        <Badge variant={insight.actionable ? 'default' : 'secondary'}>
                          {insight.actionable ? 'Actionable' : 'Informational'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{insight.description}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Significance: {(insight.significance * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <h3 className="text-xl font-semibold">Recommendations</h3>
              <div className="grid gap-4">
                {result.recommendations?.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {rec.title}
                        <Badge variant={rec.priority === 'HIGH' ? 'destructive' : rec.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{rec.description}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Expected Impact: {rec.expectedImpact}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <h3 className="text-xl font-semibold">Alerts</h3>
              <div className="grid gap-4">
                {result.alerts?.map((alert) => (
                  <Alert key={alert.id} variant={alert.severity === 'HIGH' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{alert.title}</strong>
                      <p>{alert.description}</p>
                      {alert.deadline && (
                        <p className="text-sm mt-1">Deadline: {alert.deadline}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default LegalIntelligenceDashboard;
