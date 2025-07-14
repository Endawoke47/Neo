// Client Form Modal with Comprehensive Validation
// Provides a complete form for creating and editing clients with real-time validation

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import FormField, { FormSection, FormGrid, FormActions } from '../ui/FormField';
import { validateForm, clientValidationSchema, validateFieldRealTime } from '../../utils/validation';
import { useUsers } from '../../hooks/useApi';
import { Client } from '../../services/api.service';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => Promise<{ success: boolean; error?: string }>;
  client?: Client | null;
  isLoading?: boolean;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  clientType: string;
  industry: string;
  notes: string;
  assignedLawyerId: string;
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  clientType: 'Individual',
  industry: '',
  notes: '',
  assignedLawyerId: ''
};

const clientTypes = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'Small Business', label: 'Small Business' },
  { value: 'Enterprise', label: 'Enterprise' },
  { value: 'Non-Profit', label: 'Non-Profit Organization' },
  { value: 'Government', label: 'Government Entity' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Trust', label: 'Trust' },
  { value: 'Other', label: 'Other' }
];

const industries = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Finance', label: 'Finance & Banking' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Retail', label: 'Retail & E-commerce' },
  { value: 'Education', label: 'Education' },
  { value: 'Energy', label: 'Energy & Utilities' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Transportation', label: 'Transportation & Logistics' },
  { value: 'Media', label: 'Media & Entertainment' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Mining', label: 'Mining & Natural Resources' },
  { value: 'Hospitality', label: 'Hospitality & Tourism' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Legal Services', label: 'Legal Services' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Other', label: 'Other' }
];

export default function ClientFormModal({ isOpen, onClose, onSave, client, isLoading = false }: ClientFormModalProps) {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users (lawyers) for assignment dropdown
  const { data: users = [] } = useUsers({ 
    limit: 100,
    role: 'lawyer' // Filter for lawyers only
  });

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        clientType: client.clientType || 'Individual',
        industry: client.industry || '',
        notes: client.notes || '',
        assignedLawyerId: client.assignedLawyerId || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [client, isOpen]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time validation
    validateFieldRealTime(fieldName, value, clientValidationSchema, errors, setErrors);
  };

  const handleSubmit = async () => {
    // Validate entire form
    const validation = validateForm(formData, clientValidationSchema);
    
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
                {client ? 'Edit Client' : 'Create New Client'}
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
                description="Essential client contact and identification details"
              >
                <FormGrid columns={2}>
                  <FormField
                    label="Client Name"
                    name="name"
                    value={formData.name}
                    onChange={(value) => handleFieldChange('name', value)}
                    error={errors.name}
                    required
                    placeholder="Enter full name or company name"
                  />
                  
                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(value) => handleFieldChange('email', value)}
                    error={errors.email}
                    required
                    placeholder="client@example.com"
                  />
                  
                  <FormField
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={(value) => handleFieldChange('phone', value)}
                    error={errors.phone}
                    placeholder="+254 700 123 456"
                  />
                  
                  <FormField
                    label="Client Type"
                    name="clientType"
                    type="select"
                    value={formData.clientType}
                    onChange={(value) => handleFieldChange('clientType', value)}
                    options={clientTypes}
                    error={errors.clientType}
                    required
                  />
                </FormGrid>

                <FormField
                  label="Address"
                  name="address"
                  type="textarea"
                  value={formData.address}
                  onChange={(value) => handleFieldChange('address', value)}
                  error={errors.address}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </FormSection>

              {/* Business Information */}
              <FormSection 
                title="Business Information"
                description="Industry and business-related details"
              >
                <FormGrid columns={2}>
                  <FormField
                    label="Industry"
                    name="industry"
                    type="select"
                    value={formData.industry}
                    onChange={(value) => handleFieldChange('industry', value)}
                    options={industries}
                    error={errors.industry}
                  />
                  
                  <FormField
                    label="Assigned Lawyer"
                    name="assignedLawyerId"
                    type="select"
                    value={formData.assignedLawyerId}
                    onChange={(value) => handleFieldChange('assignedLawyerId', value)}
                    options={users.map(user => ({
                      value: user.id,
                      label: `${user.firstName} ${user.lastName} ${user.specialization ? `(${user.specialization})` : ''}`
                    }))}
                    error={errors.assignedLawyerId}
                  />
                </FormGrid>
              </FormSection>

              {/* Additional Information */}
              <FormSection 
                title="Additional Information"
                description="Notes and special considerations"
              >
                <FormField
                  label="Notes"
                  name="notes"
                  type="textarea"
                  value={formData.notes}
                  onChange={(value) => handleFieldChange('notes', value)}
                  error={errors.notes}
                  placeholder="Any additional notes about the client, special requirements, or important information..."
                  rows={4}
                />
              </FormSection>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-3">
            <FormActions
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel={client ? 'Update Client' : 'Create Client'}
              isSubmitting={isSubmitting}
              submitDisabled={Object.keys(errors).length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}