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
      <nav className="bg-white/95 backdrop-blur-sm shadow-corporate border-b border-primary-100 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button 
                  type="button"
                  className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
                  onClick={() => window.location.reload()}
                  aria-label="Reload page"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-corporate">
                    <span className="text-white font-bold text-sm">CF</span>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-secondary-600 transition-all duration-300">
                    CounselFlow
                  </h1>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogin}
                className="text-neutral-600 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-primary-50"
              >
                Login
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-corporate transform hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <main className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200/30 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-300/20 rounded-lg animate-bounce"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-primary-300/25 rounded-full animate-float delay-300"></div>
          <div className="absolute bottom-20 right-10 w-18 h-18 bg-secondary-200/30 rounded-lg animate-bounce delay-500"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(13, 148, 136, 0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* CF Logo with throbbing animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-corporate-lg animate-throb">
                  <span className="text-white font-bold text-2xl">CF</span>
                </div>
                {/* Throbbing ripple effects */}
                <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary-300 animate-ping"></div>
                <div className="absolute inset-0 w-20 h-20 rounded-full border border-secondary-300 animate-ping delay-300"></div>
                <div className="absolute inset-0 w-20 h-20 rounded-full border border-primary-400 animate-ping delay-500"></div>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6 animate-fade-in-up">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 animate-gradient">CounselFlow</span>
            </h1>
            
            <div className="relative">
              <p className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto animate-fade-in-up delay-200">
                The ultimate legal practice management system designed to streamline your workflow and enhance client service.
              </p>
              
              {/* Decorative elements */}
              <div className="absolute -left-4 top-4 w-8 h-8 bg-primary-300/20 rounded-full animate-float"></div>
              <div className="absolute -right-6 bottom-2 w-6 h-6 bg-secondary-300/20 rounded-lg animate-float delay-500"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-400">
              <button 
                onClick={handleStartTrial}
                className="group relative bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-corporate-lg hover:shadow-xl transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Free Trial
                </span>
              </button>
              
              <button 
                onClick={handleWatchDemo}
                className="group border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm bg-white/50"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </span>
              </button>
            </div>

            {/* Trust indicators with animation */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-neutral-600 animate-fade-in-up delay-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                <span className="text-sm font-medium">GDPR Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-400"></div>
                <span className="text-sm font-medium">Bank-Level Security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 animate-fade-in-up">
              Everything you need to manage your legal practice
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto rounded-full animate-scale-in delay-200"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Client Management */}
            <button 
              type="button"
              className="group bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-all duration-300 border border-primary-100 transform hover:-translate-y-2 animate-fade-in-up delay-200 text-left focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => alert('⚖️ Client Management: Create detailed client profiles, manage contact information, and track case progress.')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-primary-600 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">Client Management</h3>
              <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                Comprehensive client profiles, contact information, case details, and secure notes in one centralized system.
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-primary-500 to-transparent rounded-full"></div>
              </div>
            </button>

            {/* Matter Management */}
            <button 
              type="button"
              className="group bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-all duration-300 border border-secondary-100 transform hover:-translate-y-2 animate-fade-in-up delay-300 text-left focus:outline-none focus:ring-2 focus:ring-secondary-500"
              onClick={() => alert('📅 Matter Management: Track cases, deadlines, and legal proceedings efficiently.')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-secondary-600 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-secondary-600 transition-colors">Matter Management</h3>
              <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                Intelligent case tracking with deadline management, court calendars, and automated legal reminders.
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-secondary-500 to-transparent rounded-full"></div>
              </div>
            </button>

            {/* Document Management */}
            <button 
              type="button"
              className="group bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-all duration-300 border border-primary-100 transform hover:-translate-y-2 animate-fade-in-up delay-400 text-left focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => alert('📄 Document Management: Organize legal documents, contracts, and case files securely.')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-primary-600 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">Document Management</h3>
              <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                Secure document storage, version control, template library, and collaboration tools for legal teams.
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-primary-500 to-transparent rounded-full"></div>
              </div>
            </button>

            {/* Analytics & Reporting */}
            <button 
              type="button"
              className="group bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-all duration-300 border border-secondary-100 transform hover:-translate-y-2 animate-fade-in-up delay-500 text-left focus:outline-none focus:ring-2 focus:ring-secondary-500"
              onClick={() => alert('📊 Legal Analytics: View comprehensive reports, billing insights, and practice metrics.')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-secondary-600 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-secondary-600 transition-colors">Legal Analytics</h3>
              <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                Comprehensive reports, billing insights, case analytics, and practice performance metrics to grow your firm.
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-secondary-500 to-transparent rounded-full"></div>
              </div>
            </button>

            {/* Security & Compliance */}
            <button 
              type="button"
              className="group bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-all duration-300 border border-primary-100 transform hover:-translate-y-2 animate-fade-in-up delay-600 text-left focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => alert('🔒 Security & Compliance: Enterprise-grade security, encryption, and regulatory compliance features.')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-primary-600 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">Security & Compliance</h3>
              <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                Bank-level security, encrypted data storage, and full regulatory compliance to protect sensitive legal information.
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-primary-500 to-transparent rounded-full"></div>
              </div>
            </button>

            {/* Mobile Access */}
            <button 
              type="button"
              className="group bg-white rounded-xl shadow-corporate-md p-6 hover:shadow-corporate-lg transition-all duration-300 border border-secondary-100 transform hover:-translate-y-2 animate-fade-in-up delay-700 text-left focus:outline-none focus:ring-2 focus:ring-secondary-500"
              onClick={() => alert('📱 Mobile Ready: Access your practice from any device with our responsive design.')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-secondary-600 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-secondary-600 transition-colors">Mobile Ready</h3>
              <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                Access your legal practice from anywhere with our responsive design that works perfectly on all devices.
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-gradient-to-r from-secondary-500 to-transparent rounded-full"></div>
              </div>
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
          <div className="relative bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-center shadow-corporate-lg overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 bg-white rounded-full animate-float"></div>
              <div className="absolute bottom-8 right-8 w-24 h-24 bg-white rounded-lg animate-float delay-300"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full animate-bounce delay-500"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-scale-in">
                Ready to transform your legal practice?
              </h2>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-200">
                Join thousands of legal professionals who have streamlined their workflow and improved client service with CounselFlow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
                <button 
                  onClick={handleStartTrial}
                  className="group bg-white text-primary-600 hover:bg-neutral-50 px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 shadow-corporate transform hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Your Free Trial
                  </span>
                </button>
                <button 
                  onClick={handleScheduleDemo}
                  className="group border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule a Demo
                  </span>
                </button>
              </div>
            </div>
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
              <button 
                type="button"
                className="hover:text-primary-400 transition-colors focus:outline-none focus:text-primary-400"
                onClick={() => alert('📋 Privacy Policy: Our commitment to protecting your data.')}
              >
                Privacy Policy
              </button>
              <button 
                type="button"
                className="hover:text-primary-400 transition-colors focus:outline-none focus:text-primary-400"
                onClick={() => alert('📜 Terms of Service: Platform usage terms and conditions.')}
              >
                Terms of Service
              </button>
              <button 
                type="button"
                className="hover:text-primary-400 transition-colors focus:outline-none focus:text-primary-400"
                onClick={() => alert('🆘 Support: Get help with any questions or issues.')}
              >
                Support
              </button>
              <button 
                type="button"
                className="hover:text-primary-400 transition-colors focus:outline-none focus:text-primary-400"
                onClick={() => alert('📞 Contact: Reach out to our team for more information.')}
              >
                Contact
              </button>
            </div>
            <p className="text-neutral-500 text-sm mt-6">
              © 2025 CounselFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black bg-opacity-50 cursor-default"
            onClick={closeModals}
            aria-label="Close modal"
          />
          <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-corporate-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 id="login-title" className="text-2xl font-bold text-neutral-900">Login</h2>
              <button 
                type="button"
                onClick={closeModals} 
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                aria-label="Close login modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <label htmlFor="login-email" className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input 
                  id="login-email"
                  type="email" 
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="mb-6">
                <label htmlFor="login-password" className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                <input 
                  id="login-password"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black bg-opacity-50 cursor-default"
            onClick={closeModals}
            aria-label="Close modal"
          />
          <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-corporate-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 id="signup-title" className="text-2xl font-bold text-neutral-900">Get Started</h2>
              <button 
                type="button"
                onClick={closeModals} 
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                aria-label="Close signup modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSignupSubmit}>
              <div className="mb-4">
                <label htmlFor="signup-name" className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input 
                  id="signup-name"
                  type="text" 
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your full name" 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="signup-email" className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input 
                  id="signup-email"
                  type="email" 
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="mb-6">
                <label htmlFor="signup-password" className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                <input 
                  id="signup-password"
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
