// Entity Form Modal with Comprehensive Validation
// Provides a complete form for creating and editing entities with real-time validation

import React, { useState } from 'react';
import { X } from 'lucide-react';
import FormField, { FormSection, FormGrid, FormActions } from '../ui/FormField';
import { validateForm, entityValidationSchema, validateFieldRealTime } from '../../utils/validation';
import { useClients } from '../../hooks/useApi';
import { Entity } from '../../services/api.service';

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entityData: any) => Promise<{ success: boolean; error?: string }>;
  entity?: Entity | null;
  isLoading?: boolean;
}

interface EntityFormData {
  name: string;
  type: string;
  jurisdiction: string;
  status: string;
  incorporationDate: string;
  lastFiling: string;
  compliance: number;
  subsidiaries: number;
  riskLevel: string;
  clientId: string;
  parentEntityId: string;
}

const initialFormData: EntityFormData = {
  name: '',
  type: '',
  jurisdiction: '',
  status: 'Active',
  incorporationDate: '',
  lastFiling: '',
  compliance: 100,
  subsidiaries: 0,
  riskLevel: 'Low',
  clientId: '',
  parentEntityId: ''
};

const entityTypes = [
  { value: 'Corporation', label: 'Corporation' },
  { value: 'LLC', label: 'Limited Liability Company (LLC)' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
  { value: 'Non-Profit', label: 'Non-Profit Organization' },
  { value: 'Government', label: 'Government Entity' },
  { value: 'Trust', label: 'Trust' },
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Other', label: 'Other' }
];

const jurisdictions = [
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Burundi', label: 'Burundi' },
  { value: 'South Sudan', label: 'South Sudan' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'DRC', label: 'Democratic Republic of Congo' },
  { value: 'International', label: 'International' },
  { value: 'Other', label: 'Other' }
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Dissolved', label: 'Dissolved' },
  { value: 'Merged', label: 'Merged' },
  { value: 'Acquired', label: 'Acquired' },
  { value: 'Pending', label: 'Pending Formation' }
];

const riskLevels = [
  { value: 'Low', label: 'Low Risk' },
  { value: 'Medium', label: 'Medium Risk' },
  { value: 'High', label: 'High Risk' },
  { value: 'Critical', label: 'Critical Risk' }
];

export default function EntityFormModal({ isOpen, onClose, onSave, entity, isLoading = false }: EntityFormModalProps) {
  const [formData, setFormData] = useState<EntityFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients for dropdown
  const { data: clients = [] } = useClients({ limit: 100 });

  // Initialize form data when entity changes
  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        type: entity.type || '',
        jurisdiction: entity.jurisdiction || '',
        status: entity.status || 'Active',
        incorporationDate: entity.incorporationDate?.split('T')[0] || '',
        lastFiling: entity.lastFiling?.split('T')[0] || '',
        compliance: entity.compliance || 100,
        subsidiaries: entity.subsidiaries || 0,
        riskLevel: entity.riskLevel || 'Low',
        clientId: entity.clientId || '',
        parentEntityId: entity.parentEntityId || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [entity, isOpen]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time validation
    validateFieldRealTime(fieldName, value, entityValidationSchema, errors, setErrors);
  };

  const handleSubmit = async () => {
    // Validate entire form
    const validation = validateForm(formData, entityValidationSchema);
    
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCancel}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {entity ? 'Edit Entity' : 'Create New Entity'}
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
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{errors.submit}</div>
              </div>
            )}

            <div className="space-y-8">
              {/* Basic Information */}
              <FormSection 
                title="Basic Information"
                description="Essential details about the entity"
              >
                <FormGrid columns={2}>
                  <FormField
                    label="Entity Name"
                    name="name"
                    value={formData.name}
                    onChange={(value) => handleFieldChange('name', value)}
                    error={errors.name}
                    required
                    placeholder="Enter entity name"
                  />
                  
                  <FormField
                    label="Entity Type"
                    name="type"
                    type="select"
                    value={formData.type}
                    onChange={(value) => handleFieldChange('type', value)}
                    options={entityTypes}
                    error={errors.type}
                    required
                  />
                  
                  <FormField
                    label="Jurisdiction"
                    name="jurisdiction"
                    type="select"
                    value={formData.jurisdiction}
                    onChange={(value) => handleFieldChange('jurisdiction', value)}
                    options={jurisdictions}
                    error={errors.jurisdiction}
                    required
                  />
                  
                  <FormField
                    label="Status"
                    name="status"
                    type="select"
                    value={formData.status}
                    onChange={(value) => handleFieldChange('status', value)}
                    options={statusOptions}
                    error={errors.status}
                    required
                  />
                </FormGrid>
              </FormSection>

              {/* Dates and Compliance */}
              <FormSection 
                title="Dates and Compliance"
                description="Important dates and compliance information"
              >
                <FormGrid columns={2}>
                  <FormField
                    label="Incorporation Date"
                    name="incorporationDate"
                    type="date"
                    value={formData.incorporationDate}
                    onChange={(value) => handleFieldChange('incorporationDate', value)}
                    error={errors.incorporationDate}
                  />
                  
                  <FormField
                    label="Last Filing Date"
                    name="lastFiling"
                    type="date"
                    value={formData.lastFiling}
                    onChange={(value) => handleFieldChange('lastFiling', value)}
                    error={errors.lastFiling}
                  />
                  
                  <FormField
                    label="Compliance Score (%)"
                    name="compliance"
                    type="number"
                    value={formData.compliance}
                    onChange={(value) => handleFieldChange('compliance', value)}
                    error={errors.compliance}
                    min={0}
                    max={100}
                    step={1}
                  />
                  
                  <FormField
                    label="Number of Subsidiaries"
                    name="subsidiaries"
                    type="number"
                    value={formData.subsidiaries}
                    onChange={(value) => handleFieldChange('subsidiaries', value)}
                    error={errors.subsidiaries}
                    min={0}
                    step={1}
                  />
                </FormGrid>
              </FormSection>

              {/* Relationships and Risk */}
              <FormSection 
                title="Relationships and Risk Assessment"
                description="Client relationships and risk evaluation"
              >
                <FormGrid columns={3}>
                  <FormField
                    label="Associated Client"
                    name="clientId"
                    type="select"
                    value={formData.clientId}
                    onChange={(value) => handleFieldChange('clientId', value)}
                    options={clients.map(client => ({
                      value: client.id,
                      label: client.name
                    }))}
                    error={errors.clientId}
                  />
                  
                  <FormField
                    label="Parent Entity"
                    name="parentEntityId"
                    value={formData.parentEntityId}
                    onChange={(value) => handleFieldChange('parentEntityId', value)}
                    error={errors.parentEntityId}
                    placeholder="Enter parent entity ID"
                  />
                  
                  <FormField
                    label="Risk Level"
                    name="riskLevel"
                    type="select"
                    value={formData.riskLevel}
                    onChange={(value) => handleFieldChange('riskLevel', value)}
                    options={riskLevels}
                    error={errors.riskLevel}
                    required
                  />
                </FormGrid>
              </FormSection>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-3">
            <FormActions
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel={entity ? 'Update Entity' : 'Create Entity'}
              isSubmitting={isSubmitting}
              submitDisabled={Object.keys(errors).length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}