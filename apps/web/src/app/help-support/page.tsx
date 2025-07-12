'use client';

import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Phone, 
  Mail, 
  Video, 
  BookOpen, 
  FileText, 
  Download, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Mic,
  Camera,
  Calendar,
  Users,
  Bot,
  Zap,
  Shield,
  Globe,
  Headphones,
  Play,
  ChevronRight,
  ChevronDown,
  Plus,
  Filter
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  views: number;
}

interface SupportTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  created: string;
  lastUpdate: string;
  assignedTo: string;
}

export default function HelpSupportPage() {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  
  const [faqs] = useState<FAQ[]>([
    {
      id: 'faq1',
      question: 'How do I set up AI legal analysis for contracts?',
      answer: 'To set up AI legal analysis: 1) Navigate to Contract Management, 2) Upload your contract, 3) Click "AI Review" button, 4) Our AI will analyze clauses, identify risks, and suggest improvements within minutes.',
      category: 'AI Features',
      helpful: 45,
      views: 120
    },
    {
      id: 'faq2',
      question: 'Can I integrate CounselFlow with my existing calendar?',
      answer: 'Yes! CounselFlow supports integration with Google Calendar, Microsoft Outlook, and Apple Calendar. Go to Settings > Integrations to connect your calendar and sync all hearings, deadlines, and meetings automatically.',
      category: 'Integrations',
      helpful: 38,
      views: 89
    },
    {
      id: 'faq3',
      question: 'How do I manage entity compliance across multiple jurisdictions?',
      answer: 'Use our Entity Management module to track compliance across all African jurisdictions. The system automatically monitors filing deadlines, sends alerts, and provides jurisdiction-specific compliance requirements.',
      category: 'Entity Management',
      helpful: 52,
      views: 145
    },
    {
      id: 'faq4',
      question: 'What security measures protect my legal data?',
      answer: 'CounselFlow uses bank-level encryption, multi-factor authentication, and complies with international data protection standards. All data is stored in secure African data centers with 99.9% uptime guarantee.',
      category: 'Security',
      helpful: 67,
      views: 203
    },
    {
      id: 'faq5',
      question: 'How does the dispute prediction AI work?',
      answer: 'Our AI analyzes case law, precedents, judge patterns, and case factors to predict win probability. It considers jurisdiction-specific data, similar case outcomes, and current legal trends to provide accuracy rates above 85%.',
      category: 'AI Features',
      helpful: 41,
      views: 98
    }
  ]);

  const [supportTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT001',
      title: 'Unable to export entity compliance report',
      status: 'Open',
      priority: 'Medium',
      category: 'Technical',
      created: '2025-01-10',
      lastUpdate: '2025-01-11',
      assignedTo: 'Sarah Tech Support'
    },
    {
      id: 'TKT002',
      title: 'Request for Swahili language support',
      status: 'In Progress',
      priority: 'Low',
      category: 'Feature Request',
      created: '2025-01-08',
      lastUpdate: '2025-01-10',
      assignedTo: 'Dev Team'
    },
    {
      id: 'TKT003',
      title: 'AI contract analysis not working for PDF files',
      status: 'Resolved',
      priority: 'High',
      category: 'Bug Report',
      created: '2025-01-05',
      lastUpdate: '2025-01-07',
      assignedTo: 'AI Team'
    }
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const handleContactSupport = () => {
    setIsContactModalOpen(true);
  };

  const handleSubmitTicket = () => {
    alert('Support ticket submitted successfully! You will receive a confirmation email within 5 minutes.');
    setIsContactModalOpen(false);
  };

  const handleStartLiveChat = () => {
    alert('Connecting you to a live support agent... Please wait while we find an available representative.');
  };

  const handleScheduleCall = () => {
    alert('Call scheduling opened. Please select your preferred time slot for a callback from our support team.');
  };

  const handleVideoCall = () => {
    alert('Video call initiated. Our support specialist will join you shortly for screen sharing and troubleshooting.');
  };

  const handleFAQHelpful = (faqId: string, helpful: boolean) => {
    alert(helpful ? 'Thank you for your feedback!' : 'We\'ll work on improving this answer.');
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <HelpCircle className="w-8 h-8 mr-3 text-primary-600" />
              Help & Support
            </h1>
            <p className="text-gray-600 mt-1">Get help and find answers to your questions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleStartLiveChat}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </button>
            <button 
              onClick={handleContactSupport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </button>
          </div>
        </div>

        {/* Quick Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow p-6 text-center" onClick={handleStartLiveChat}>
            <MessageCircle className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold">Live Chat</h3>
            <p className="text-sm text-gray-600">Chat with support</p>
            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Available 24/7</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow p-6 text-center" onClick={handleScheduleCall}>
            <Phone className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold">Phone Support</h3>
            <p className="text-sm text-gray-600">Schedule a callback</p>
            <span className="inline-block mt-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">Within 1 hour</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow p-6 text-center" onClick={handleVideoCall}>
            <Video className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold">Video Support</h3>
            <p className="text-sm text-gray-600">Screen sharing help</p>
            <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Premium</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow p-6 text-center" onClick={handleContactSupport}>
            <Mail className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold">Email Support</h3>
            <p className="text-sm text-gray-600">Send us a message</p>
            <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">24hr response</span>
          </div>
        </div>

        {/* Help Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
                { id: 'guides', label: 'User Guides', icon: BookOpen },
                { id: 'tickets', label: 'My Tickets', icon: MessageCircle },
                { id: 'resources', label: 'Resources', icon: Download },
                { id: 'status', label: 'System Status', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search frequently asked questions..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-48">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        <option value="AI Features">AI Features</option>
                        <option value="Entity Management">Entity Management</option>
                        <option value="Contract Management">Contract Management</option>
                        <option value="Integrations">Integrations</option>
                        <option value="Security">Security</option>
                        <option value="Billing">Billing</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div
                        className="p-6 cursor-pointer flex justify-between items-center"
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">{faq.category}</span>
                            <span className="text-sm text-gray-500">{faq.views} views</span>
                            <span className="text-sm text-gray-500">{faq.helpful} helpful</span>
                          </div>
                        </div>
                        {expandedFAQ === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {expandedFAQ === faq.id && (
                        <div className="px-6 pb-6">
                          <div className="border-t pt-4">
                            <p className="text-gray-700 mb-4">{faq.answer}</p>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600">Was this helpful?</span>
                              <button
                                onClick={() => handleFAQHelpful(faq.id, true)}
                                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                Yes
                              </button>
                              <button
                                onClick={() => handleFAQHelpful(faq.id, false)}
                                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                No
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Guides Tab */}
            {activeTab === 'guides' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Getting Started Guide',
                    description: 'Complete setup and onboarding walkthrough',
                    type: 'PDF Guide',
                    duration: '15 min read',
                    level: 'Beginner'
                  },
                  {
                    title: 'AI Contract Analysis Tutorial',
                    description: 'Learn to use AI for contract review and risk assessment',
                    type: 'Video Tutorial',
                    duration: '12 min watch',
                    level: 'Intermediate'
                  },
                  {
                    title: 'Entity Management Masterclass',
                    description: 'Advanced entity structure and compliance management',
                    type: 'Interactive Guide',
                    duration: '25 min',
                    level: 'Advanced'
                  },
                  {
                    title: 'Dispute Management Workflow',
                    description: 'End-to-end dispute tracking and case management',
                    type: 'Step-by-step',
                    duration: '20 min read',
                    level: 'Intermediate'
                  },
                  {
                    title: 'API Integration Guide',
                    description: 'Connect CounselFlow with your existing systems',
                    type: 'Technical Guide',
                    duration: '30 min read',
                    level: 'Advanced'
                  },
                  {
                    title: 'Mobile App Tutorial',
                    description: 'Using CounselFlow on iOS and Android devices',
                    type: 'Video Tutorial',
                    duration: '8 min watch',
                    level: 'Beginner'
                  }
                ].map((guide, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow p-6">
                    <div className="flex items-start justify-between mb-3">
                      <BookOpen className="w-8 h-8 text-primary-600" />
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{guide.level}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{guide.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <div>{guide.type}</div>
                        <div>{guide.duration}</div>
                      </div>
                      <button className="flex items-center px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">My Support Tickets</h2>
                  <button 
                    onClick={handleContactSupport}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-6 py-3">Ticket</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Priority</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Assigned To</th>
                          <th className="px-6 py-3">Last Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supportTickets.map((ticket) => (
                          <tr key={ticket.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{ticket.title}</div>
                                <div className="text-gray-500">{ticket.id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                ticket.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4">{ticket.category}</td>
                            <td className="px-6 py-4">{ticket.assignedTo}</td>
                            <td className="px-6 py-4">{ticket.lastUpdate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Download className="w-5 h-5 mr-2" />
                      Downloads
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { name: 'Mobile App - iOS', size: '45 MB' },
                      { name: 'Mobile App - Android', size: '38 MB' },
                      { name: 'Desktop App - Windows', size: '125 MB' },
                      { name: 'Desktop App - macOS', size: '98 MB' },
                      { name: 'Browser Extension', size: '2 MB' }
                    ].map((download, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{download.name}</p>
                          <p className="text-sm text-gray-500">{download.size}</p>
                        </div>
                        <button className="flex items-center px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Quick Links
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { name: 'API Documentation', url: 'https://docs.counselflow.com' },
                      { name: 'Developer Portal', url: 'https://dev.counselflow.com' },
                      { name: 'Community Forum', url: 'https://community.counselflow.com' },
                      { name: 'Feature Requests', url: 'https://feedback.counselflow.com' },
                      { name: 'Status Page', url: 'https://status.counselflow.com' }
                    ].map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <p className="font-medium">{link.name}</p>
                        <button className="flex items-center px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* System Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      System Status
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {[
                        { service: 'Web Application', status: 'Operational', uptime: '99.97%' },
                        { service: 'Mobile Apps', status: 'Operational', uptime: '99.95%' },
                        { service: 'AI Services', status: 'Operational', uptime: '99.89%' },
                        { service: 'Database', status: 'Operational', uptime: '99.99%' },
                        { service: 'File Storage', status: 'Maintenance', uptime: '99.92%' },
                        { service: 'API Endpoints', status: 'Operational', uptime: '99.94%' }
                      ].map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              service.status === 'Operational' ? 'bg-green-500' : 
                              service.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium">{service.service}</p>
                              <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
                            </div>
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            service.status === 'Operational' ? 'bg-green-100 text-green-800' : 
                            service.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {service.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Modal */}
        {isContactModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contact Support</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input 
                        type="text"
                        placeholder="Brief description of your issue"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">Select category</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing Question</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">Select priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Method</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">Preferred contact</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="chat">Live Chat</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      placeholder="Please describe your issue in detail..." 
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => setIsContactModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmitTicket}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}

