// Task Form Modal with Comprehensive Validation
// Provides a complete form for creating and editing tasks with real-time validation

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import FormField, { FormSection, FormGrid, FormActions } from '../ui/FormField';
import { validateForm, taskValidationSchema, validateFieldRealTime } from '../../utils/validation';
import { useUsers, useMatters, useContracts, useClients } from '../../hooks/useApi';
import { Task } from '../../services/api.service';

interface TaskFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (taskData: any) => Promise<{ success: boolean; error?: string }>;
  readonly task?: Task | null;
  readonly isLoading?: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  category: string;
  tags: string[];
  assignedToId: string;
  matterId: string;
  contractId: string;
  clientId: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'To Do',
  dueDate: '',
  estimatedHours: 0,
  actualHours: 0,
  progress: 0,
  category: '',
  tags: [],
  assignedToId: '',
  matterId: '',
  contractId: '',
  clientId: ''
};

const priorities = [
  { value: 'Low', label: 'Low Priority' },
  { value: 'Medium', label: 'Medium Priority' },
  { value: 'High', label: 'High Priority' },
  { value: 'Urgent', label: 'Urgent' }
];

const statuses = [
  { value: 'To Do', label: 'To Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const categories = [
  { value: 'Legal Research', label: 'Legal Research' },
  { value: 'Document Review', label: 'Document Review' },
  { value: 'Contract Analysis', label: 'Contract Analysis' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Litigation', label: 'Litigation' },
  { value: 'Client Communication', label: 'Client Communication' },
  { value: 'Administrative', label: 'Administrative' },
  { value: 'Court Filing', label: 'Court Filing' },
  { value: 'IP Management', label: 'IP Management' },
  { value: 'Policy Development', label: 'Policy Development' },
  { value: 'Other', label: 'Other' }
];

export default function TaskFormModal({ isOpen, onClose, onSave, task, isLoading = false }: TaskFormModalProps) {
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch related data for dropdowns
  const { data: users = [] } = useUsers({ limit: 100 });
  const { data: matters = [] } = useMatters({ limit: 100 });
  const { data: contracts = [] } = useContracts({ limit: 100 });
  const { data: clients = [] } = useClients({ limit: 100 });

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        dueDate: task.dueDate?.split('T')[0] || '',
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        progress: task.progress || 0,
        category: task.category || '',
        tags: task.tags || [],
        assignedToId: task.assignedToId || '',
        matterId: task.matterId || '',
        contractId: task.contractId || '',
        clientId: task.clientId || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [task, isOpen]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time validation
    validateFieldRealTime(fieldName, value, taskValidationSchema, errors, setErrors);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = async () => {
    // Validate entire form
    const validation = validateForm(formData, taskValidationSchema);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await onSave(formData);
      
      if (result.success) {
        onClose();
        setFormData(initialFormData);
        setErrors({});
      } else {
        // Handle server-side validation errors
        if (result.error) {
          setErrors({ submit: result.error });
        }
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    setTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <button 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={handleCancel}
          aria-label="Close modal"
        ></button>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {task ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {/* Display submit errors */}
            {errors['submit'] && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{errors['submit']}</div>
              </div>
            )}

            <div className="space-y-8">
              {/* Basic Information */}
              <FormSection 
                title="Basic Information"
                description="Essential task details and description"
              >
                <FormField
                  label="Task Title"
                  name="title"
                  value={formData.title}
                  onChange={(value) => handleFieldChange('title', value)}
                  error={errors['title']}
                  required
                  placeholder="Enter task title"
                />
                
                <FormField
                  label="Description"
                  name="description"
                  type="textarea"
                  value={formData.description}
                  onChange={(value) => handleFieldChange('description', value)}
                  error={errors['description']}
                  placeholder="Describe what needs to be done..."
                  rows={3}
                />

                <FormGrid columns={3}>
                  <FormField
                    label="Priority"
                    name="priority"
                    type="select"
                    value={formData.priority}
                    onChange={(value) => handleFieldChange('priority', value)}
                    options={priorities}
                    error={errors['priority']}
                    required
                  />
                  
                  <FormField
                    label="Status"
                    name="status"
                    type="select"
                    value={formData.status}
                    onChange={(value) => handleFieldChange('status', value)}
                    options={statuses}
                    error={errors['status']}
                    required
                  />
                  
                  <FormField
                    label="Category"
                    name="category"
                    type="select"
                    value={formData.category}
                    onChange={(value) => handleFieldChange('category', value)}
                    options={categories}
                    error={errors['category']}
                  />
                </FormGrid>
              </FormSection>

              {/* Time and Progress */}
              <FormSection 
                title="Time and Progress"
                description="Time estimates and progress tracking"
              >
                <FormGrid columns={2}>
                  <FormField
                    label="Due Date"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(value) => handleFieldChange('dueDate', value)}
                    error={errors['dueDate']}
                  />
                  
                  <FormField
                    label="Progress (%)"
                    name="progress"
                    type="number"
                    value={formData.progress}
                    onChange={(value) => handleFieldChange('progress', value)}
                    error={errors['progress']}
                    min={0}
                    max={100}
                    step={5}
                  />
                  
                  <FormField
                    label="Estimated Hours"
                    name="estimatedHours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(value) => handleFieldChange('estimatedHours', value)}
                    error={errors['estimatedHours']}
                    min={0}
                    step={0.5}
                  />
                  
                  <FormField
                    label="Actual Hours"
                    name="actualHours"
                    type="number"
                    value={formData.actualHours}
                    onChange={(value) => handleFieldChange('actualHours', value)}
                    error={errors['actualHours']}
                    min={0}
                    step={0.5}
                  />
                </FormGrid>
              </FormSection>

              {/* Assignments and Relationships */}
              <FormSection 
                title="Assignments and Relationships"
                description="Task assignment and related entities"
              >
                <FormGrid columns={2}>
                  <FormField
                    label="Assigned To"
                    name="assignedToId"
                    type="select"
                    value={formData.assignedToId}
                    onChange={(value) => handleFieldChange('assignedToId', value)}
                    options={users.map(user => {
                      const specialization = user.specialization ? `(${user.specialization})` : '';
                      return {
                        value: user.id,
                        label: `${user.firstName} ${user.lastName} ${specialization}`
                      };
                    })}
                    error={errors['assignedToId']}
                    required
                  />
                  
                  <FormField
                    label="Related Client"
                    name="clientId"
                    type="select"
                    value={formData.clientId}
                    onChange={(value) => handleFieldChange('clientId', value)}
                    options={clients.map(client => ({
                      value: client.id,
                      label: client.name
                    }))}
                    error={errors['clientId']}
                  />
                  
                  <FormField
                    label="Related Matter"
                    name="matterId"
                    type="select"
                    value={formData.matterId}
                    onChange={(value) => handleFieldChange('matterId', value)}
                    options={matters.map(matter => ({
                      value: matter.id,
                      label: matter.title
                    }))}
                    error={errors['matterId']}
                  />
                  
                  <FormField
                    label="Related Contract"
                    name="contractId"
                    type="select"
                    value={formData.contractId}
                    onChange={(value) => handleFieldChange('contractId', value)}
                    options={contracts.map(contract => ({
                      value: contract.id,
                      label: contract.title
                    }))}
                    error={errors['contractId']}
                  />
                </FormGrid>
              </FormSection>

              {/* Tags */}
              <FormSection 
                title="Tags"
                description="Add tags to categorize and organize tasks"
              >
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </FormSection>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-3">
            <FormActions
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel={task ? 'Update Task' : 'Create Task'}
              isSubmitting={isSubmitting}
              submitDisabled={Object.keys(errors).length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}