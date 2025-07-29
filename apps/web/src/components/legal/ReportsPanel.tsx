import React from 'react';
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@counselflow/ui/components/Card';
import { LegalCase } from '../../services/legal-data.service';

interface ReportsPanelProps {
  cases: LegalCase[];
}

const ReportsPanel = React.memo<ReportsPanelProps>(({ cases }) => {
  const reports = React.useMemo(() => [
    {
      id: 'case-summary',
      title: 'Case Summary Report',
      description: 'Overview of all active cases and their status',
      icon: BarChart3,
      lastGenerated: '2024-07-15',
      type: 'Summary'
    },
    {
      id: 'monthly-activity',
      title: 'Monthly Activity Report',
      description: 'Legal activities and outcomes for the current month',
      icon: Calendar,
      lastGenerated: '2024-07-14',
      type: 'Activity'
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      description: 'Key performance indicators and trends',
      icon: TrendingUp,
      lastGenerated: '2024-07-13',
      type: 'Analytics'
    }
  ], []);

  const handleGenerateReport = React.useCallback((reportId: string) => {
    console.log('Generate report:', reportId);
  }, []);

  const handleDownloadReport = React.useCallback((reportId: string) => {
    console.log('Download report:', reportId);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
        <p className="text-gray-600">Generate and download comprehensive reports for your legal cases.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Icon className="h-5 w-5 mr-2 text-blue-600" />
                  {report.title}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">{report.description}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{report.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Generated:</span>
                    <span className="font-medium">{report.lastGenerated}</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleGenerateReport(report.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Stats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{cases.length}</div>
            <div className="text-sm text-gray-600">Total Cases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {cases.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Cases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {cases.filter(c => c.priority === 'High' || c.priority === 'Critical').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {cases.filter(c => c.riskLevel === 'High').length}
            </div>
            <div className="text-sm text-gray-600">High Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReportsPanel.displayName = 'ReportsPanel';

export default ReportsPanel;