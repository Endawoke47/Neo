import { formatDate, formatCurrency } from '@counselflow/ui/utils';

export interface LegalCase {
  id: string;
  caseTitle: string;
  country: string;
  entityType: string;
  module: string;
  status: string;
  jurisdiction: string;
  value?: number;
  priority: string;
  dateCreated: string;
  lastUpdated?: string;
  description: string;
  riskLevel: string;
  [key: string]: any;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  jurisdiction: string;
  language: string;
  lastUpdated: string;
  usage: number;
  tags: string[];
}

// Cached data to avoid recreating on every render
let cachedLegalCases: LegalCase[] | null = null;
let cachedTemplates: Template[] | null = null;

export const getLegalCases = (): LegalCase[] => {
  if (cachedLegalCases) return cachedLegalCases;

  cachedLegalCases = [
    {
      id: 'ENT001',
      caseTitle: 'Safaricom PLC Corporate Restructuring',
      country: 'Kenya',
      entityType: 'Public Limited Company',
      module: 'Entity Management',
      status: 'Active',
      jurisdiction: 'Nairobi Commercial Court',
      value: 2500000,
      priority: 'High',
      dateCreated: '2024-01-15',
      lastUpdated: '2024-07-10',
      description: 'Corporate restructuring and subsidiary formation for telecommunications expansion across East Africa',
      riskLevel: 'Medium'
    },
    {
      id: 'ENT002',
      caseTitle: 'Nigerian Oil & Gas JV Formation',
      country: 'Nigeria',
      entityType: 'Joint Venture',
      module: 'Entity Management',
      status: 'In Progress',
      jurisdiction: 'Lagos State High Court',
      value: 15000000,
      priority: 'Critical',
      dateCreated: '2024-02-20',
      lastUpdated: '2024-07-08',
      description: 'Formation of joint venture between Shell Nigeria and indigenous oil company for offshore drilling',
      riskLevel: 'High'
    },
    {
      id: 'CON001',
      caseTitle: 'MTN Uganda Infrastructure Agreement',
      country: 'Uganda',
      entityType: 'Infrastructure Contract',
      module: 'Contract Management',
      status: 'Under Review',
      jurisdiction: 'Kampala Commercial Court',
      value: 8500000,
      priority: 'High',
      dateCreated: '2024-03-10',
      lastUpdated: '2024-07-09',
      description: 'Telecommunications infrastructure deployment agreement with Uganda Communications Commission',
      riskLevel: 'Medium'
    },
    // Add more cases as needed...
  ];

  return cachedLegalCases;
};

export const getTemplates = (): Template[] => {
  if (cachedTemplates) return cachedTemplates;

  cachedTemplates = [
    {
      id: 'TPL001',
      name: 'Corporate Formation - Kenya',
      category: 'Entity Management',
      jurisdiction: 'Kenya',
      language: 'English',
      lastUpdated: '2024-06-15',
      usage: 45,
      tags: ['corporate', 'formation', 'kenya', 'company']
    },
    {
      id: 'TPL002',
      name: 'Oil & Gas JV Agreement - Nigeria',
      category: 'Contract Management',
      jurisdiction: 'Nigeria',
      language: 'English',
      lastUpdated: '2024-07-01',
      usage: 23,
      tags: ['oil-gas', 'joint-venture', 'nigeria', 'energy']
    },
    // Add more templates as needed...
  ];

  return cachedTemplates;
};

export const filterCases = (
  cases: LegalCase[],
  filters: {
    search?: string;
    country?: string;
    module?: string;
    status?: string;
    priority?: string;
  }
): LegalCase[] => {
  return cases.filter(case_ => {
    if (filters.search && !case_.caseTitle.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.country && case_.country !== filters.country) {
      return false;
    }
    if (filters.module && case_.module !== filters.module) {
      return false;
    }
    if (filters.status && case_.status !== filters.status) {
      return false;
    }
    if (filters.priority && case_.priority !== filters.priority) {
      return false;
    }
    return true;
  });
};

export const getCasesByModule = (module: string): LegalCase[] => {
  return getLegalCases().filter(case_ => case_.module === module);
};

export const getUniqueValues = (cases: LegalCase[], field: keyof LegalCase): string[] => {
  const values = cases.map(case_ => case_[field]).filter(Boolean) as string[];
  return [...new Set(values)].sort();
};