import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, Upload, Download, Filter, Edit, Eye, Trash2, 
  Plus, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock,
  Building, Scale, Users, Shield, BookOpen, Settings, BarChart3,
  FileCheck, MessageCircle, Globe
} from 'lucide-react';

// Types
interface LegalCase {
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

interface Template {
  id: string;
  name: string;
  category: string;
  jurisdiction: string;
  language: string;
  lastUpdated: string;
  usage: number;
  tags: string[];
}

// African Legal Cases Demo Data
const africanLegalCases = [
  // Entity Management Cases
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
    relatedEntities: ['Safaricom Kenya', 'Safaricom Ethiopia', 'Vodacom Group'],
    complianceRequirements: ['CAK Licensing', 'CBK Approval', 'Competition Authority'],
    documents: ['Articles of Association', 'Memorandum', 'Board Resolutions'],
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
    relatedEntities: ['Shell Nigeria', 'Seplat Energy', 'NNPC'],
    complianceRequirements: ['DPR Approval', 'NUPRC License', 'Environmental Impact'],
    documents: ['JV Agreement', 'Operating Agreement', 'Environmental Studies'],
    riskLevel: 'High'
  },

  // Contract Management Cases
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
    contractType: 'Service Agreement',
    parties: ['MTN Uganda', 'Uganda Communications Commission'],
    keyTerms: ['5-year term', 'Performance guarantees', 'Technology transfer'],
    renewalDate: '2029-03-10',
    obligations: ['Network coverage targets', 'Quality standards', 'Local content requirements'],
    riskLevel: 'Medium'
  },
  {
    id: 'CON002',
    caseTitle: 'South African Mining Concession',
    country: 'South Africa',
    entityType: 'Mining Agreement',
    module: 'Contract Management',
    status: 'Active',
    jurisdiction: 'Johannesburg High Court',
    value: 25000000,
    priority: 'Critical',
    dateCreated: '2024-01-05',
    lastUpdated: '2024-07-11',
    description: 'Platinum mining rights and community development agreement in North West Province',
    contractType: 'Mining Rights Agreement',
    parties: ['Anglo American Platinum', 'Department of Mineral Resources', 'Local Communities'],
    keyTerms: ['20-year mining rights', 'Community development fund', 'Environmental restoration'],
    renewalDate: '2044-01-05',
    obligations: ['Environmental compliance', 'Community investment', 'Local employment'],
    riskLevel: 'High'
  },

  // Dispute Management Cases
  {
    id: 'DIS001',
    caseTitle: 'Ethiopian Airlines vs. Boeing 737 MAX',
    country: 'Ethiopia',
    entityType: 'Commercial Dispute',
    module: 'Dispute Management',
    status: 'In Litigation',
    jurisdiction: 'Addis Ababa Federal High Court',
    value: 150000000,
    priority: 'Critical',
    dateCreated: '2023-08-15',
    lastUpdated: '2024-07-10',
    description: 'Product liability and breach of contract claim following aircraft accidents',
    disputeType: 'Product Liability',
    plaintiff: 'Ethiopian Airlines',
    defendant: 'Boeing Company',
    claims: ['Breach of contract', 'Product liability', 'Economic damages'],
    nextHearing: '2024-08-15',
    settlementOffers: ['$75M Boeing offer', '$120M Airline counteroffer'],
    riskLevel: 'Critical'
  },
  {
    id: 'DIS002',
    caseTitle: 'Ghana Power Purchase Agreement Dispute',
    country: 'Ghana',
    entityType: 'Energy Dispute',
    module: 'Dispute Management',
    status: 'Arbitration',
    jurisdiction: 'Ghana International Arbitration Centre',
    value: 45000000,
    priority: 'High',
    dateCreated: '2024-02-28',
    lastUpdated: '2024-07-08',
    description: 'Dispute over power purchase agreement terms and payment delays',
    disputeType: 'Contract Dispute',
    plaintiff: 'Cenpower Generation',
    defendant: 'Electricity Company of Ghana',
    claims: ['Payment delays', 'Tariff adjustments', 'Force majeure'],
    nextHearing: '2024-08-20',
    arbitrators: ['Justice Sophia Akuffo', 'Prof. Kofi Abotsi', 'Dr. Yaw Oppong'],
    riskLevel: 'High'
  },

  // Matter Management Cases
  {
    id: 'MAT001',
    caseTitle: 'Rwanda Healthcare PPP Implementation',
    country: 'Rwanda',
    entityType: 'Public-Private Partnership',
    module: 'Matter Management',
    status: 'Active',
    jurisdiction: 'Kigali Commercial Court',
    value: 35000000,
    priority: 'High',
    dateCreated: '2024-01-20',
    lastUpdated: '2024-07-11',
    description: 'Healthcare infrastructure development through public-private partnership',
    matterType: 'Healthcare PPP',
    stakeholders: ['Ministry of Health', 'King Faisal Hospital', 'Development Partners'],
    milestones: ['Contract signing', 'Financial close', 'Construction start', 'Operations handover'],
    currentPhase: 'Implementation',
    budget: 35000000,
    teamMembers: ['Sarah Uwimana', 'Jean Baptiste Nzeyimana', 'Dr. Agnes Kalibata'],
    riskLevel: 'Medium'
  },
  {
    id: 'MAT002',
    caseTitle: 'Moroccan Renewable Energy Project',
    country: 'Morocco',
    entityType: 'Infrastructure Project',
    module: 'Matter Management',
    status: 'Planning',
    jurisdiction: 'Casablanca Commercial Court',
    value: 120000000,
    priority: 'Critical',
    dateCreated: '2024-04-10',
    lastUpdated: '2024-07-09',
    description: 'Solar power plant development in Ouarzazate with international financing',
    matterType: 'Renewable Energy',
    stakeholders: ['MASEN', 'ACWA Power', 'World Bank', 'AfDB'],
    milestones: ['Environmental clearance', 'Financing agreement', 'EPC contract', 'Grid connection'],
    currentPhase: 'Planning',
    budget: 120000000,
    teamMembers: ['Ahmed Benali', 'Fatima Zahra', 'Mohamed Alami'],
    riskLevel: 'Medium'
  },

  // Risk Management Cases
  {
    id: 'RSK001',
    caseTitle: 'Tanzania Mining Environmental Compliance',
    country: 'Tanzania',
    entityType: 'Environmental Risk',
    module: 'Risk Management',
    status: 'Under Assessment',
    jurisdiction: 'Dodoma High Court',
    value: 5000000,
    priority: 'High',
    dateCreated: '2024-03-15',
    lastUpdated: '2024-07-10',
    description: 'Environmental compliance assessment for gold mining operations in Mwanza region',
    riskType: 'Environmental Compliance',
    riskCategory: 'Regulatory',
    likelihood: 'Medium',
    impact: 'High',
    mitigation: ['Environmental monitoring', 'Community engagement', 'Regulatory liaison'],
    owner: 'Environmental Manager',
    reviewDate: '2024-08-15',
    riskLevel: 'High'
  },
  {
    id: 'RSK002',
    caseTitle: 'Kenyan Banking Cyber Security Risk',
    country: 'Kenya',
    entityType: 'Cyber Security Risk',
    module: 'Risk Management',
    status: 'Active Monitoring',
    jurisdiction: 'Nairobi Commercial Court',
    value: 12000000,
    priority: 'Critical',
    dateCreated: '2024-05-01',
    lastUpdated: '2024-07-11',
    description: 'Cyber security risk assessment and mitigation for digital banking platform',
    riskType: 'Cyber Security',
    riskCategory: 'Technology',
    likelihood: 'High',
    impact: 'Critical',
    mitigation: ['Security audits', 'Staff training', 'System upgrades', 'Insurance coverage'],
    owner: 'Chief Information Officer',
    reviewDate: '2024-08-01',
    riskLevel: 'Critical'
  },

  // Additional cases for other modules...
  {
    id: 'POL001',
    caseTitle: 'Nigerian Data Protection Policy Implementation',
    country: 'Nigeria',
    entityType: 'Data Protection Policy',
    module: 'Policy Management',
    status: 'Implementation',
    jurisdiction: 'Federal High Court Lagos',
    value: 3000000,
    priority: 'High',
    dateCreated: '2024-02-10',
    description: 'NDPR compliance policy implementation for financial services sector',
    riskLevel: 'Medium'
  },
  {
    id: 'KNW001',
    caseTitle: 'East African Competition Law Research',
    country: 'Multi-jurisdictional',
    entityType: 'Legal Research',
    module: 'Knowledge Management',
    status: 'Ongoing',
    jurisdiction: 'Regional',
    value: 500000,
    priority: 'Medium',
    dateCreated: '2024-06-01',
    description: 'Comparative analysis of competition laws across East African Community states',
    riskLevel: 'Low'
  }
];

// Legal Templates Data
const legalTemplates = [
  {
    id: 'TPL001',
    name: 'Kenyan Share Purchase Agreement',
    category: 'Corporate',
    jurisdiction: 'Kenya',
    language: 'English',
    lastUpdated: '2024-07-01',
    usage: 45,
    tags: ['M&A', 'Corporate', 'Shares']
  },
  {
    id: 'TPL002',
    name: 'Nigerian Oil & Gas JV Agreement',
    category: 'Energy',
    jurisdiction: 'Nigeria',
    language: 'English',
    lastUpdated: '2024-06-15',
    usage: 23,
    tags: ['Energy', 'Joint Venture', 'Oil & Gas']
  },
  {
    id: 'TPL003',
    name: 'South African Employment Contract',
    category: 'Employment',
    jurisdiction: 'South Africa',
    language: 'English',
    lastUpdated: '2024-07-05',
    usage: 67,
    tags: ['Employment', 'Labour Law', 'Contracts']
  }
];

// Case Files Library
const caseFiles = [
  {
    id: 'CF001',
    title: 'Safaricom vs Airtel Kenya - Competition Case',
    court: 'Competition Appeal Tribunal',
    year: '2023',
    jurisdiction: 'Kenya',
    area: 'Competition Law',
    outcome: 'Settled',
    significance: 'High',
    tags: ['Telecommunications', 'Market Dominance', 'Competition']
  },
  {
    id: 'CF002',
    title: 'Dangote Group vs Nigerian Customs - Tax Dispute',
    court: 'Federal High Court',
    year: '2024',
    jurisdiction: 'Nigeria',
    area: 'Tax Law',
    outcome: 'Pending',
    significance: 'High',
    tags: ['Customs Duty', 'Tax', 'Trade']
  }
];

// Legal Books and Codes
const legalBooks = [
  {
    id: 'LB001',
    title: 'The Constitution of Kenya, 2010',
    author: 'Republic of Kenya',
    category: 'Constitutional Law',
    jurisdiction: 'Kenya',
    year: '2010',
    pages: 194,
    isbn: '978-9966-98-141-4',
    tags: ['Constitution', 'Fundamental Rights', 'Governance']
  },
  {
    id: 'LB002',
    title: 'Companies and Allied Matters Act (CAMA) 2020',
    author: 'Federal Republic of Nigeria',
    category: 'Corporate Law',
    jurisdiction: 'Nigeria',
    year: '2020',
    pages: 856,
    isbn: '978-978-58290-1-8',
    tags: ['Corporate Law', 'Companies', 'Business Registration']
  }
];

const LegalManagementSystem = () => {
  const [activeModule, setActiveModule] = useState('Entity Management');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState('templates');
  const [filteredData, setFilteredData] = useState<LegalCase[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cases, setCases] = useState<LegalCase[]>(africanLegalCases);

  const modules = [
    { name: 'Entity Management', icon: Building, color: 'bg-primary-500' },
    { name: 'Contract Management', icon: FileCheck, color: 'bg-green-500' },
    { name: 'Dispute Management', icon: Scale, color: 'bg-red-500' },
    { name: 'Matter Management', icon: FileText, color: 'bg-purple-500' },
    { name: 'Risk Management', icon: Shield, color: 'bg-orange-500' },
    { name: 'Policy Management', icon: Settings, color: 'bg-indigo-500' },
    { name: 'Knowledge Management', icon: BookOpen, color: 'bg-teal-500' },
    { name: 'Licensing & Regulatory', icon: Globe, color: 'bg-pink-500' },
    { name: 'Outsourcing & Legal Spend', icon: DollarSign, color: 'bg-yellow-500' },
    { name: 'Task Management', icon: CheckCircle, color: 'bg-cyan-500' }
  ];

  useEffect(() => {
    if (activeModule === 'Knowledge Management') {
      // For Knowledge Management, we'll handle templates separately
      setFilteredData([]);
    } else {
      const filtered = cases.filter(caseItem => 
        caseItem.module === activeModule && 
        (caseItem.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
         caseItem.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
         caseItem.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredData(filtered);
    }
  }, [activeModule, searchQuery, cases]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate file processing
      console.log('File uploaded:', file.name);
      // Here you would process CSV/PDF/DOC files
      setShowUploadModal(false);
    }
  };

  const handleDownload = (format: string) => {
    // Simulate data download
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeModule.replace(' ', '_')}_data.${format}`;
    link.click();
  };

  const getCasesByModule = (moduleName: string) => {
    return cases.filter(caseItem => caseItem.module === moduleName);
  };

  const getRelatedCases = (caseId: string) => {
    const currentCase = cases.find(c => c.id === caseId);
    if (!currentCase) return [];
    
    return cases.filter(c => 
      c.id !== caseId && 
      (c.country === currentCase.country || 
       c.entityType === currentCase.entityType ||
       c.riskLevel === currentCase.riskLevel)
    ).slice(0, 3);
  };

  const renderModuleContent = () => {
    if (activeModule === 'Knowledge Management') {
      return (
        <div className="space-y-6">
          {/* Knowledge Management Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['templates', 'case-files', 'legal-books'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveKnowledgeTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeKnowledgeTab === tab
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'templates' && 'Legal Templates'}
                  {tab === 'case-files' && 'Case Files Library'}
                  {tab === 'legal-books' && 'Legal Books & Codes'}
                </button>
              ))}
            </nav>
          </div>

          {/* AI-Powered Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`AI-powered search in ${activeKnowledgeTab.replace('-', ' ')}... (e.g., "Nigerian contract templates" or "Competition law cases")`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">AI Assistant</span>
            </div>
          </div>

          {/* Knowledge Content */}
          {activeKnowledgeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legalTemplates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.category} • {template.jurisdiction}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        Updated: {template.lastUpdated}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeKnowledgeTab === 'case-files' && (
            <div className="space-y-4">
              {caseFiles.map((caseFile) => (
                <div key={caseFile.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{caseFile.title}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div><span className="font-medium">Court:</span> {caseFile.court}</div>
                        <div><span className="font-medium">Year:</span> {caseFile.year}</div>
                        <div><span className="font-medium">Jurisdiction:</span> {caseFile.jurisdiction}</div>
                        <div><span className="font-medium">Outcome:</span> {caseFile.outcome}</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {caseFile.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeKnowledgeTab === 'legal-books' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {legalBooks.map((book) => (
                <div key={book.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{book.title}</h3>
                  <p className="text-gray-600 mb-3">By {book.author}</p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div><span className="font-medium">Category:</span> {book.category}</div>
                    <div><span className="font-medium">Jurisdiction:</span> {book.jurisdiction}</div>
                    <div><span className="font-medium">Year:</span> {book.year}</div>
                    <div><span className="font-medium">Pages:</span> {book.pages}</div>
                    <div><span className="font-medium">ISBN:</span> {book.isbn}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {book.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 text-sm">
                      Read Online
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Module-specific table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{activeModule} Cases</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Upload size={16} />
                <span>Upload Data</span>
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((case_) => (
                  <tr key={case_.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{case_.caseTitle}</div>
                        <div className="text-sm text-gray-500">{case_.country} • {case_.entityType}</div>
                        <div className="text-xs text-gray-400 mt-1">{case_.description.slice(0, 100)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        case_.status === 'Active' ? 'bg-green-100 text-green-800' :
                        case_.status === 'In Progress' ? 'bg-primary-100 text-primary-800' :
                        case_.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {case_.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${case_.value?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        case_.riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                        case_.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                        case_.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {case_.riskLevel || 'Low'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCase(case_)}
                          className="text-primary-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cross-module integration panel */}
        {selectedCase && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Case Details: {selectedCase.caseTitle}</h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Case Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Case ID:</span> {selectedCase.id}</div>
                    <div><span className="font-medium">Country:</span> {selectedCase.country}</div>
                    <div><span className="font-medium">Jurisdiction:</span> {selectedCase.jurisdiction}</div>
                    <div><span className="font-medium">Entity Type:</span> {selectedCase.entityType}</div>
                    <div><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedCase.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        selectedCase.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedCase.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Financial Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Value:</span> ${selectedCase.value?.toLocaleString() || 'N/A'}</div>
                    <div><span className="font-medium">Status:</span> {selectedCase.status}</div>
                    <div><span className="font-medium">Risk Level:</span> {selectedCase.riskLevel}</div>
                    <div><span className="font-medium">Created:</span> {selectedCase.dateCreated}</div>
                    <div><span className="font-medium">Last Updated:</span> {selectedCase.lastUpdated}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedCase.description}</p>
                </div>
              </div>
            </div>

            {/* Cross-Module Data Integration */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Related Information Across Modules</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => {
                  const relatedCases = getCasesByModule(module.name);
                  const hasData = relatedCases.length > 0;
                  
                  return (
                    <div key={module.name} className={`p-4 rounded-lg border-2 transition-all ${
                      hasData ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center mb-2">
                        <module.icon size={20} className={`mr-2 ${hasData ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`font-medium text-sm ${hasData ? 'text-green-900' : 'text-gray-600'}`}>
                          {module.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {hasData ? `${relatedCases.length} related items` : 'No related data'}
                      </div>
                      {hasData && (
                        <button
                          onClick={() => setActiveModule(module.name)}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Related Cases */}
            <div className="border-t pt-6 mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Related Cases</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getRelatedCases(selectedCase.id).map((relatedCase) => (
                  <div key={relatedCase.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => setSelectedCase(relatedCase)}>
                    <h5 className="font-medium text-sm text-gray-900 mb-2">{relatedCase.caseTitle}</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>{relatedCase.country} • {relatedCase.module}</div>
                      <div>${relatedCase.value?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Scale size={32} className="text-teal-600" />
              <h1 className="text-2xl font-bold text-gray-900">African Legal Management System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search across all modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-80"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 font-medium">Admin User</span>
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-teal-800 text-white min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {modules.map((module) => {
                const ModuleIcon = module.icon;
                const casesCount = getCasesByModule(module.name).length;
                
                return (
                  <button
                    key={module.name}
                    onClick={() => setActiveModule(module.name)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                      activeModule === module.name
                        ? 'bg-teal-700 text-white'
                        : 'hover:bg-teal-700/50 text-teal-100'
                    }`}
                  >
                    <ModuleIcon size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{module.name}</div>
                      <div className="text-xs text-teal-300">{casesCount} cases</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-primary-100">
                  <FileText className="text-primary-600" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{cases.length}</h3>
                  <p className="text-gray-500 text-sm">Total Cases</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {cases.filter(c => c.status === 'Active').length}
                  </h3>
                  <p className="text-gray-500 text-sm">Active Cases</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100">
                  <AlertTriangle className="text-orange-600" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {cases.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').length}
                  </h3>
                  <p className="text-gray-500 text-sm">High Risk</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${(cases.reduce((sum, c) => sum + (c.value || 0), 0) / 1000000).toFixed(1)}M
                  </h3>
                  <p className="text-gray-500 text-sm">Total Value</p>
                </div>
              </div>
            </div>
          </div>

          {/* Module Content */}
          {renderModuleContent()}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Data</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File Type
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>CSV File</option>
                  <option>PDF Document</option>
                  <option>Word Document</option>
                  <option>Excel File</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose File
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".csv,.pdf,.doc,.docx,.xlsx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalManagementSystem;
