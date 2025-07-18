/**
 * Enhanced Main Layout - A+++++ Performance
 * Preserves your existing design while adding performance optimizations
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  Briefcase,
  FileText,
  Scale,
  Building2,
  Users,
  BookOpen,
  Shield,
  ScrollText,
  Target,
  CheckCircle,
  Calculator,
  HelpCircle,
  Settings,
  Menu,
  Search,
  Bell,
  User
} from 'lucide-react';
import { LazyLoadWrapper } from '../performance/LazyLoadWrapper';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

interface EnhancedMainLayoutProps {
  children: React.ReactNode;
}

export default function EnhancedMainLayout({ children }: EnhancedMainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Memoize navigation to prevent unnecessary re-renders
  const navigation = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: pathname === '/dashboard' },
    { name: 'Clients', href: '/client-management', icon: Users, current: pathname === '/client-management' },
    { name: 'Matters', href: '/matter-management', icon: Briefcase, current: pathname === '/matter-management' },
    { name: 'Contracts', href: '/contract-management', icon: FileText, current: pathname === '/contract-management' },
    { name: 'Disputes', href: '/dispute-management', icon: Scale, current: pathname === '/dispute-management' },
    { name: 'Entities', href: '/entity-management', icon: Building2, current: pathname === '/entity-management' },
    { name: 'Knowledge Management', href: '/knowledge-management', icon: BookOpen, current: pathname === '/knowledge-management' },
    { name: 'Risk Management', href: '/risk-management', icon: Shield, current: pathname === '/risk-management' },
    { name: 'Policy Management', href: '/policy-management', icon: ScrollText, current: pathname === '/policy-management' },
    { name: 'Task Management', href: '/task-management', icon: Target, current: pathname === '/task-management' },
    { name: 'Licensing & Regulatory', href: '/licensing-regulatory', icon: CheckCircle, current: pathname === '/licensing-regulatory' },
    { name: 'Legal Spend', href: '/outsourcing-legal-spend', icon: Calculator, current: pathname === '/outsourcing-legal-spend' },
    { name: 'Help & Support', href: '/help-support', icon: HelpCircle, current: pathname === '/help-support' },
    { name: 'Settings', href: '/settings', icon: Settings, current: pathname === '/settings' },
  ], [pathname]);

  // Optimize sidebar toggle
  const handleSidebarToggle = React.useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Prefetch navigation links on hover
  const handleLinkHover = React.useCallback((href: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  // Navigation Item Component (memoized)
  const NavigationItem = React.memo(({ item, onClick }: { 
    item: typeof navigation[0], 
    onClick?: () => void 
  }) => (
    <Link
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => handleLinkHover(item.href)}
      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        item.current
          ? 'bg-primary-100 text-primary-700'
          : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-600'
      }`}
    >
      <item.icon className={`mr-3 h-5 w-5 ${item.current ? 'text-primary-600' : 'text-neutral-500'}`} />
      {item.name}
    </Link>
  ));

  NavigationItem.displayName = 'NavigationItem';

  // Logo Component (memoized)
  const Logo = React.memo(() => (
    <div className="flex items-center">
      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
        <span className="text-white font-bold text-sm">CF</span>
      </div>
      <h1 className="text-xl font-bold text-primary-700">CounselFlow</h1>
    </div>
  ));

  Logo.displayName = 'Logo';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Performance Monitor (only in development) */}
      <PerformanceMonitor enableDevMode={process.env.NODE_ENV === 'development'} />

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div 
            className="fixed inset-0 bg-neutral-800 bg-opacity-50" 
            onClick={handleSidebarClose} 
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-corporate-lg">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={handleSidebarClose}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
              <div className="flex flex-shrink-0 items-center px-6">
                <Logo />
              </div>
              <nav className="mt-8 flex-1 space-y-2 px-3">
                {navigation.map((item) => (
                  <NavigationItem key={item.name} item={item} onClick={handleSidebarClose} />
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-neutral-200 shadow-corporate">
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
            <div className="flex flex-shrink-0 items-center px-6">
              <Logo />
            </div>
            <nav className="mt-8 flex-1 space-y-2 px-3">
              {navigation.map((item) => (
                <NavigationItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top nav for mobile */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden shadow-corporate">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-neutral-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={handleSidebarToggle}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content with lazy loading */}
        <main className="flex-1 bg-neutral-50">
          <LazyLoadWrapper
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            }
          >
            {children}
          </LazyLoadWrapper>
        </main>
      </div>
    </div>
  );
}