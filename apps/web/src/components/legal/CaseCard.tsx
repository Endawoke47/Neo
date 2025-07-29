import React from 'react';
import { Eye, Edit, Trash2, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@counselflow/ui/components/Card';
import { formatCurrency, formatDate } from '@counselflow/ui/utils';
import { LegalCase } from '../../services/legal-data.service';

interface CaseCardProps {
  case_: LegalCase;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Critical': return 'text-red-600 bg-red-50';
    case 'High': return 'text-orange-600 bg-orange-50';
    case 'Medium': return 'text-yellow-600 bg-yellow-50';
    case 'Low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Active': return 'text-green-600 bg-green-50';
    case 'In Progress': return 'text-blue-600 bg-blue-50';
    case 'Under Review': return 'text-yellow-600 bg-yellow-50';
    case 'Completed': return 'text-gray-600 bg-gray-50';
    case 'On Hold': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const CaseCard = React.memo<CaseCardProps>(({ 
  case_, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const handleView = React.useCallback(() => {
    onView?.(case_.id);
  }, [case_.id, onView]);

  const handleEdit = React.useCallback(() => {
    onEdit?.(case_.id);
  }, [case_.id, onEdit]);

  const handleDelete = React.useCallback(() => {
    onDelete?.(case_.id);
  }, [case_.id, onDelete]);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {case_.caseTitle}
          </CardTitle>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={handleView}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Case"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Edit Case"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Case"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(case_.priority)}`}>
            {case_.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
            {case_.status}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {case_.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(case_.dateCreated)}</span>
            </div>
            {case_.value && (
              <div className="flex items-center text-gray-500">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>{formatCurrency(case_.value)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <span className="font-medium">{case_.country}</span>
              <span className="mx-2">•</span>
              <span>{case_.module}</span>
            </div>
            {case_.riskLevel && (
              <div className="flex items-center text-xs text-gray-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>{case_.riskLevel} Risk</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CaseCard.displayName = 'CaseCard';

export default CaseCard;