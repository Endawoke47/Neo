'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleGetStarted = () => {
    setShowSignupModal(true);
  };

  const handleStartTrial = () => {
    setShowSignupModal(true);
  };

  // Handle Real Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple demo login - in real app, you'd validate against your backend
    if (loginForm.email && loginForm.password) {
      // Store user data in localStorage (in real app, use proper auth tokens)
      const userData = {
        name: loginForm.email.split('@')[0], // Use email prefix as name for demo
        email: loginForm.email
      };
      localStorage.setItem('counselflow_user', JSON.stringify(userData));
      
      // Close modal and redirect to dashboard
      setShowLoginModal(false);
      router.push('/dashboard');
    } else {
      alert('Please fill in all fields');
    }
    
    setIsLoading(false);
  };

  // Handle Real Signup Form Submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple demo signup - in real app, you'd create account in your backend
    if (signupForm.name && signupForm.email && signupForm.password) {
      // Store user data in localStorage (in real app, use proper auth tokens)
      const userData = {
        name: signupForm.name,
        email: signupForm.email
      };
      localStorage.setItem('counselflow_user', JSON.stringify(userData));
      
      // Close modal and redirect to dashboard
      setShowSignupModal(false);
      router.push('/dashboard');
    } else {
      alert('Please fill in all fields');
    }
    
    setIsLoading(false);
  };

  const handleWatchDemo = () => {
    alert('🎬 Demo coming soon! This would open a product demo video.');
  };

  const handleScheduleDemo = () => {
    alert('📅 Schedule Demo: This would open a calendar booking system.');
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      {/* Navigation */}
      <nav className="bg-white shadow-corporate border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CF</span>
                  </div>
                  <h1 className="text-2xl font-bold text-primary-700 cursor-pointer" onClick={() => window.location.reload()}>
                    CounselFlow
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogin}
                className="text-neutral-600 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-corporate"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Welcome to{' '}
            <span className="text-primary-600">CounselFlow</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            The ultimate legal practice management system designed to streamline your workflow and enhance client service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartTrial}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-corporate-md"
            >
              Start Free Trial
            </button>
            <button 
              onClick={handleWatchDemo}
              className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Watch Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
            Everything you need to manage your legal practice
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Client Management */}
            <div className="bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-shadow cursor-pointer border border-primary-100" onClick={() => alert('⚖️ Client Management: Create detailed client profiles, manage contact information, and track case progress.')}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Client Management</h3>
              <p className="text-neutral-600">
                Comprehensive client profiles, contact information, case details, and secure notes in one centralized system.
              </p>
            </div>

            {/* Matter Management */}
            <div className="bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-shadow cursor-pointer border border-secondary-100" onClick={() => alert('� Matter Management: Track cases, deadlines, and legal proceedings efficiently.')}>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Matter Management</h3>
              <p className="text-neutral-600">
                Intelligent case tracking with deadline management, court calendars, and automated legal reminders.
              </p>
            </div>

            {/* Document Management */}
            <div className="bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-shadow cursor-pointer border border-primary-100" onClick={() => alert('� Document Management: Organize legal documents, contracts, and case files securely.')}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Document Management</h3>
              <p className="text-neutral-600">
                Secure document storage, version control, template library, and collaboration tools for legal teams.
              </p>
            </div>

            {/* Analytics & Reporting */}
            <div className="bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-shadow cursor-pointer border border-secondary-100" onClick={() => alert('📊 Legal Analytics: View comprehensive reports, billing insights, and practice metrics.')}>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Legal Analytics</h3>
              <p className="text-neutral-600">
                Comprehensive reports, billing insights, case analytics, and practice performance metrics to grow your firm.
              </p>
            </div>

            {/* Security & Compliance */}
            <div className="bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-shadow cursor-pointer border border-primary-100" onClick={() => alert('🔒 Security & Compliance: Enterprise-grade security, encryption, and regulatory compliance features.')}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Security & Compliance</h3>
              <p className="text-neutral-600">
                Bank-level security, encrypted data storage, and full regulatory compliance to protect sensitive legal information.
              </p>
            </div>

            {/* Mobile Access */}
            <div className="bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-shadow cursor-pointer border border-secondary-100" onClick={() => alert('📱 Mobile Ready: Access your practice from any device with our responsive design.')}>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Mobile Ready</h3>
              <p className="text-neutral-600">
                Access your legal practice from anywhere with our responsive design that works perfectly on all devices.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-center shadow-corporate-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your legal practice?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of legal professionals who have streamlined their workflow and improved client service with CounselFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartTrial}
              className="bg-white text-primary-600 hover:bg-neutral-50 px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-corporate"
            >
              Start Your Free Trial
            </button>
            <button 
              onClick={handleScheduleDemo}
              className="border-2 border-white text-white hover:bg-primary-700 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <h3 className="text-2xl font-bold">CounselFlow</h3>
            </div>
            <p className="text-neutral-400 mb-6">
              Empowering legal professionals with innovative practice management solutions.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-neutral-400">
              <a href="#" className="hover:text-primary-400 transition-colors" onClick={(e) => { e.preventDefault(); alert('📋 Privacy Policy: Our commitment to protecting your data.'); }}>Privacy Policy</a>
              <a href="#" className="hover:text-primary-400 transition-colors" onClick={(e) => { e.preventDefault(); alert('📜 Terms of Service: Platform usage terms and conditions.'); }}>Terms of Service</a>
              <a href="#" className="hover:text-primary-400 transition-colors" onClick={(e) => { e.preventDefault(); alert('🆘 Support: Get help with any questions or issues.'); }}>Support</a>
              <a href="#" className="hover:text-primary-400 transition-colors" onClick={(e) => { e.preventDefault(); alert('📞 Contact: Reach out to our team for more information.'); }}>Contact</a>
            </div>
            <p className="text-neutral-500 text-sm mt-6">
              © 2025 CounselFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModals}>
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-corporate-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Login</h2>
              <button onClick={closeModals} className="text-neutral-400 hover:text-neutral-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your password" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center shadow-corporate"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              <p className="mt-4 text-sm text-neutral-600 text-center">
                Demo: Use any email and password to login
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModals}>
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-corporate-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Get Started</h2>
              <button onClick={closeModals} className="text-neutral-400 hover:text-neutral-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSignupSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your full name" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Create a password" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center shadow-corporate"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </button>
              <p className="mt-4 text-sm text-neutral-600 text-center">
                Demo: Fill in any details to create account
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
