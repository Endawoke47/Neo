// Form Validation Utilities
// Comprehensive validation functions for all management forms

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Basic validation functions
export const validateRequired = (value: any): string | null => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'This field is required';
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number): string | null => {
  if (value && value.length < minLength) {
    return `Must be at least ${minLength} characters long`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number): string | null => {
  if (value && value.length > maxLength) {
    return `Must be no more than ${maxLength} characters long`;
  }
  return null;
};

export const validatePattern = (value: string, pattern: RegExp): string | null => {
  if (value && !pattern.test(value)) {
    return 'Invalid format';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return 'Please enter a valid phone number';
  }
  return null;
};

export const validateDate = (date: string): string | null => {
  if (date && isNaN(Date.parse(date))) {
    return 'Please enter a valid date';
  }
  return null;
};

export const validateFutureDate = (date: string): string | null => {
  if (date) {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate < today) {
      return 'Date must be in the future';
    }
  }
  return null;
};

export const validatePastDate = (date: string): string | null => {
  if (date) {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (inputDate > today) {
      return 'Date must be in the past';
    }
  }
  return null;
};

export const validatePositiveNumber = (value: number): string | null => {
  if (value !== null && value !== undefined && value < 0) {
    return 'Must be a positive number';
  }
  return null;
};

export const validateRange = (value: number, min: number, max: number): string | null => {
  if (value !== null && value !== undefined) {
    if (value < min || value > max) {
      return `Must be between ${min} and ${max}`;
    }
  }
  return null;
};

// Generic validation function
export const validateField = (value: any, rules: ValidationRule): string | null => {
  // Required validation
  if (rules.required) {
    const error = validateRequired(value);
    if (error) return error;
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return null;
  }

  // String-specific validations
  if (typeof value === 'string') {
    if (rules.minLength) {
      const error = validateMinLength(value, rules.minLength);
      if (error) return error;
    }

    if (rules.maxLength) {
      const error = validateMaxLength(value, rules.maxLength);
      if (error) return error;
    }

    if (rules.pattern) {
      const error = validatePattern(value, rules.pattern);
      if (error) return error;
    }
  }

  // Custom validation
  if (rules.custom) {
    const error = rules.custom(value);
    if (error) return error;
  }

  return null;
};

// Validate entire form
export const validateForm = (data: Record<string, any>, schema: ValidationSchema): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Pre-defined validation schemas for common entities

export const clientValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    required: true,
    custom: validateEmail
  },
  phone: {
    custom: validatePhone
  },
  clientType: {
    required: true
  },
  industry: {
    maxLength: 50
  },
  address: {
    maxLength: 200
  }
};

export const matterValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 500
  },
  type: {
    required: true
  },
  priority: {
    required: true
  },
  riskLevel: {
    required: true
  },
  clientId: {
    required: true
  },
  assignedLawyerId: {
    required: true
  },
  estimatedValue: {
    custom: validatePositiveNumber
  },
  statute_of_limitations: {
    custom: validateFutureDate
  }
};

export const contractValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 500
  },
  type: {
    required: true
  },
  clientId: {
    required: true
  },
  assignedLawyerId: {
    required: true
  },
  value: {
    custom: validatePositiveNumber
  },
  currency: {
    required: true
  },
  startDate: {
    custom: validateDate
  },
  endDate: {
    custom: (value: string) => {
      const dateError = validateDate(value);
      if (dateError) return dateError;
      return validateFutureDate(value);
    }
  }
};

export const documentValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 500
  },
  type: {
    required: true
  },
  category: {
    maxLength: 50
  }
};

export const disputeValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 500
  },
  type: {
    required: true
  },
  priority: {
    required: true
  },
  riskLevel: {
    required: true
  },
  clientId: {
    required: true
  },
  assignedLawyerId: {
    required: true
  },
  claimAmount: {
    custom: validatePositiveNumber
  },
  currency: {
    required: true
  },
  courtName: {
    maxLength: 100
  },
  caseNumber: {
    maxLength: 50
  }
};

export const entityValidationSchema: ValidationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  type: {
    required: true
  },
  jurisdiction: {
    required: true,
    maxLength: 50
  },
  status: {
    required: true
  },
  incorporationDate: {
    custom: validatePastDate
  },
  lastFiling: {
    custom: validateDate
  },
  compliance: {
    custom: (value: number) => validateRange(value, 0, 100)
  },
  subsidiaries: {
    custom: validatePositiveNumber
  }
};

export const taskValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 500
  },
  priority: {
    required: true
  },
  status: {
    required: true
  },
  assignedToId: {
    required: true
  },
  dueDate: {
    custom: validateDate
  },
  estimatedHours: {
    custom: validatePositiveNumber
  },
  actualHours: {
    custom: validatePositiveNumber
  },
  progress: {
    custom: (value: number) => validateRange(value, 0, 100)
  },
  category: {
    maxLength: 50
  }
};

// Utility function to get formatted error message
export const getFieldError = (fieldName: string, errors: Record<string, string>): string | null => {
  return errors[fieldName] || null;
};

// Utility function to check if field has error
export const hasFieldError = (fieldName: string, errors: Record<string, string>): boolean => {
  return fieldName in errors;
};

// Utility function for real-time validation
export const validateFieldRealTime = (
  fieldName: string, 
  value: any, 
  schema: ValidationSchema,
  errors: Record<string, string>,
  setErrors: (errors: Record<string, string>) => void
): void => {
  const rules = schema[fieldName];
  if (rules) {
    const error = validateField(value, rules);
    const newErrors = { ...errors };
    
    if (error) {
      newErrors[fieldName] = error;
    } else {
      delete newErrors[fieldName];
    }
    
    setErrors(newErrors);
  }
};