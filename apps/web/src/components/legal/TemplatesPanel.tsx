import React from 'react';
import { FileText, Download, Edit, Trash2, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@counselflow/ui/components/Card';
import { formatDate } from '@counselflow/ui/utils';
import { Template } from '../../services/legal-data.service';

interface TemplatesPanelProps {
  templates: Template[];
  isLoading?: boolean;
}

const TemplateCard = React.memo<{ template: Template }>(({ template }) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          {template.name}
        </CardTitle>
        <div className="flex space-x-1 ml-2">
          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors">
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {template.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </CardHeader>
    
    <CardContent className="pt-0">
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Category:</span>
          <span className="font-medium">{template.category}</span>
        </div>
        <div className="flex justify-between">
          <span>Jurisdiction:</span>
          <span className="font-medium">{template.jurisdiction}</span>
        </div>
        <div className="flex justify-between">
          <span>Language:</span>
          <span className="font-medium">{template.language}</span>
        </div>
        <div className="flex justify-between">
          <span>Usage:</span>
          <span className="font-medium">{template.usage} times</span>
        </div>
        <div className="flex justify-between">
          <span>Last Updated:</span>
          <span className="font-medium">{formatDate(template.lastUpdated)}</span>
        </div>
      </div>
    </CardContent>
  </Card>
));

TemplateCard.displayName = 'TemplateCard';

const TemplatesPanel = React.memo<TemplatesPanelProps>(({ templates, isLoading }) => {
  const handleCreateTemplate = React.useCallback(() => {
    console.log('Create new template');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Document Templates</h3>
        <button
          onClick={handleCreateTemplate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
});

TemplatesPanel.displayName = 'TemplatesPanel';

export default TemplatesPanel;