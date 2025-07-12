# CounselFlow Ultimate - Corporate Theme Implementation Guide

## Overview
This guide ensures consistent application of the modern, corporate conservative teal/turquoise/white theme across all modules and pages.

## Core Theme Colors

### Primary Palette (Teal)
- **primary-50**: `#f0fdfa` - Very light backgrounds, subtle highlights
- **primary-100**: `#ccfbf1` - Light backgrounds, active states
- **primary-200**: `#99f6e4` - Borders, dividers
- **primary-300**: `#5eead4` - Subtle accents
- **primary-400**: `#2dd4bf` - Interactive elements
- **primary-500**: `#14b8a6` - Main brand color
- **primary-600**: `#0d9488` - Primary buttons, main actions
- **primary-700**: `#0f766e` - Dark accents, headings
- **primary-800**: `#115e59` - Very dark elements
- **primary-900**: `#134e4a` - Darkest elements

### Secondary Palette (Turquoise)
- **secondary-500**: `#06b6d4` - Main secondary color
- **secondary-600**: `#0891b2` - Secondary buttons
- **secondary-100**: `#cffafe` - Light backgrounds

### Status Colors
- **success-100/600**: Green for positive states
- **warning-100/600**: Yellow/orange for warnings
- **error-100/600**: Red for errors/high priority
- **neutral-100/600**: Gray for neutral states

## Component Styling Patterns

### Page Headers
```tsx
<h1 className="text-3xl font-bold text-neutral-900 flex items-center">
  <Icon className="mr-3 h-8 w-8 text-primary-600" />
  Page Title
</h1>
<p className="text-neutral-600 mt-2">Page description</p>
```

### Primary Buttons
```tsx
<button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
  <Icon className="w-4 h-4 mr-2" />
  Action Text
</button>
```

### Secondary Buttons
```tsx
<button className="flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors">
  <Icon className="w-4 h-4 mr-2" />
  Action Text
</button>
```

### Cards
```tsx
<div className="bg-white rounded-lg border border-neutral-200 shadow-corporate hover:shadow-corporate-md transition-shadow">
  <div className="px-6 py-4 border-b border-neutral-100">
    <h3 className="text-lg font-semibold text-neutral-900">Card Title</h3>
    <p className="text-sm text-neutral-600 mt-1">Card description</p>
  </div>
  <div className="px-6 py-4">
    Card content
  </div>
</div>
```

### Status Badges
```tsx
// Active/Success
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-800">
  Active
</span>

// Warning/Pending
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 text-warning-800">
  Pending
</span>

// Error/High Priority
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-error-100 text-error-800">
  High Priority
</span>
```

### Statistics Cards
```tsx
<div className="bg-white rounded-lg border border-neutral-200 shadow-corporate hover:shadow-corporate-md transition-shadow p-6">
  <div className="flex items-center">
    <div className="flex-shrink-0">
      <div className="p-3 rounded-lg bg-primary-100">
        <Icon className="h-6 w-6 text-primary-600" />
      </div>
    </div>
    <div className="ml-4 w-0 flex-1">
      <dl>
        <dt className="text-sm font-medium text-neutral-500">Metric Label</dt>
        <dd className="flex items-baseline">
          <div className="text-2xl font-bold text-neutral-900">Value</div>
          <div className="ml-2 flex items-baseline text-sm font-semibold text-success-600">
            <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
            <span className="ml-1">+12%</span>
          </div>
        </dd>
      </dl>
    </div>
  </div>
</div>
```

### Form Elements
```tsx
// Input Fields
<input className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-500" />

// Select Dropdowns
<select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 bg-white">
  <option>Option</option>
</select>
```

### Table Styling
```tsx
<div className="bg-white rounded-lg border border-neutral-200 shadow-corporate overflow-hidden">
  <div className="px-6 py-4 border-b border-neutral-100">
    <h3 className="text-lg font-semibold text-neutral-900">Table Title</h3>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Column Header
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-neutral-200">
        <tr className="hover:bg-neutral-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
            Cell Content
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

## Navigation Styling

### Sidebar Navigation
```tsx
<nav className="mt-8 flex-1 space-y-2 px-3">
  <Link className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors bg-primary-100 text-primary-700 border-r-2 border-primary-500">
    <Icon className="mr-3 h-5 w-5 text-primary-600" />
    Active Item
  </Link>
  <Link className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-neutral-600 hover:bg-primary-50 hover:text-primary-600">
    <Icon className="mr-3 h-5 w-5 text-neutral-500" />
    Inactive Item
  </Link>
</nav>
```

## Page-Specific Implementations

### All Pages Must Include:
1. **MainLayout wrapper** with consistent sidebar
2. **Corporate color palette** throughout
3. **Consistent typography** (neutral-900 for headings, neutral-600 for descriptions)
4. **Proper spacing** (py-6 for main content, consistent margins)
5. **Hover effects** with corporate shadow styles
6. **Status indicators** using corporate status colors

### Priority Update Order:
1. ✅ MainLayout (Complete)
2. ✅ Dashboard (Complete)
3. ✅ Entity Management (Complete)
4. ✅ Matter Management (Complete)
5. Contract Management
6. Dispute Management
7. Risk Management
8. Policy Management
9. Task Management
10. Knowledge Management
11. Licensing & Regulatory
12. Outsourcing Legal Spend
13. Settings
14. Help & Support

## Quality Assurance Checklist

For each page, ensure:
- [ ] Uses MainLayout wrapper
- [ ] Headers use text-neutral-900 and primary-600 icons
- [ ] Buttons use primary-600 for main actions
- [ ] Status badges use corporate status colors
- [ ] Cards use corporate shadow and border styling
- [ ] Tables use neutral-50 headers and hover effects
- [ ] Forms use primary-500 focus states
- [ ] Consistent spacing and typography
- [ ] No blue/gray color remnants from old theme

## Browser Testing
Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Ensure consistent rendering across all browsers and screen sizes.
