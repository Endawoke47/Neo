import React, { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLegalCases, getTemplates } from '../../services/legal-data.service';
import CaseList from './CaseList';

// Lazy load heavy components
const ReportsPanel = lazy(() => import('./ReportsPanel'));
const TemplatesPanel = lazy(() => import('./TemplatesPanel'));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));

interface LegalManagementSystemProps {
  initialTab?: string;
}

const LegalManagementSystem = React.memo<LegalManagementSystemProps>(({ 
  initialTab = 'cases' 
}) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  // Use React Query for better caching and state management
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: getLegalCases,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['legal-templates'],
    queryFn: getTemplates,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const handleCreateCase = React.useCallback(() => {
    // Implementation for creating new case
    console.log('Create new case');
  }, []);

  const handleViewCase = React.useCallback((id: string) => {
    // Implementation for viewing case
    console.log('View case:', id);
  }, []);

  const handleEditCase = React.useCallback((id: string) => {
    // Implementation for editing case
    console.log('Edit case:', id);
  }, []);

  const handleDeleteCase = React.useCallback((id: string) => {
    // Implementation for deleting case
    console.log('Delete case:', id);
  }, []);

  const tabs = React.useMemo(() => [
    { id: 'cases', name: 'Cases', count: cases.length },
    { id: 'templates', name: 'Templates', count: templates.length },
    { id: 'reports', name: 'Reports' },
    { id: 'analytics', name: 'Analytics' }
  ], [cases.length, templates.length]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cases':
        return (
          <CaseList
            cases={cases}
            onCreateCase={handleCreateCase}
            onViewCase={handleViewCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
          />
        );
      case 'templates':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading templates...</div>}>
            <TemplatesPanel templates={templates} isLoading={templatesLoading} />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading reports...</div>}>
            <ReportsPanel cases={cases} />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading analytics...</div>}>
            <AnalyticsPanel cases={cases} templates={templates} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  if (casesLoading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading legal management system...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== undefined && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
});

LegalManagementSystem.displayName = 'LegalManagementSystem';

export default LegalManagementSystem;