import React from 'react';
import { PieChart, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@counselflow/ui/components/Card';
import { LegalCase, Template } from '../../services/legal-data.service';

interface AnalyticsPanelProps {
  cases: LegalCase[];
  templates: Template[];
}

const AnalyticsPanel = React.memo<AnalyticsPanelProps>(({ cases, templates }) => {
  const analytics = React.useMemo(() => {
    const statusDistribution = cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityDistribution = cases.reduce((acc, case_) => {
      acc[case_.priority] = (acc[case_.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moduleDistribution = cases.reduce((acc, case_) => {
      acc[case_.module] = (acc[case_.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryDistribution = cases.reduce((acc, case_) => {
      acc[case_.country] = (acc[case_.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      statusDistribution,
      priorityDistribution,
      moduleDistribution,
      countryDistribution,
      totalValue: cases.reduce((sum, case_) => sum + (case_.value || 0), 0),
      averageValue: cases.length > 0 ? cases.reduce((sum, case_) => sum + (case_.value || 0), 0) / cases.length : 0
    };
  }, [cases]);

  const MetricCard = React.memo<{
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: Record<string, number>;
  }>(({ title, icon: Icon, data }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <Icon className="h-5 w-5 mr-2 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{key}</span>
              <div className="flex items-center">
                <div
                  className="h-2 bg-blue-600 rounded mr-2"
                  style={{ width: `${(value / Math.max(...Object.values(data))) * 60}px` }}
                />
                <span className="text-sm font-medium">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ));

  MetricCard.displayName = 'MetricCard';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
        <p className="text-gray-600">Comprehensive insights into your legal case portfolio.</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-semibold text-gray-900">{cases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cases.filter(c => c.status === 'Active' || c.status === 'In Progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-semibold text-gray-900">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Case Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${analytics.averageValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Status Distribution"
          icon={PieChart}
          data={analytics.statusDistribution}
        />
        
        <MetricCard
          title="Priority Distribution"
          icon={BarChart3}
          data={analytics.priorityDistribution}
        />
        
        <MetricCard
          title="Module Distribution"
          icon={Activity}
          data={analytics.moduleDistribution}
        />
        
        <MetricCard
          title="Country Distribution"
          icon={TrendingUp}
          data={analytics.countryDistribution}
        />
      </div>
    </div>
  );
});

AnalyticsPanel.displayName = 'AnalyticsPanel';

export default AnalyticsPanel;