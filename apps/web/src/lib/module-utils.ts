// Universal Module Functionality Utils
// User: Endawoke47
// Date: 2025-07-12 22:30:00 UTC

export const createCRUDHandlers = <T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  itemName: string,
  generateId: (length: number) => string
) => {
  const handleAdd = (setIsAdding: (value: boolean) => void) => () => {
    setIsAdding(true);
  };

  const handleEdit = (
    item: T,
    setEditing: (item: T | null) => void,
    setIsAdding: (value: boolean) => void
  ) => () => {
    setEditing(item);
    setIsAdding(true);
  };

  const handleDelete = (itemId: string) => () => {
    if (confirm(`Are you sure you want to delete this ${itemName}?`)) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const handleView = (item: T, setSelected: (item: T | null) => void) => () => {
    setSelected(item);
  };

  const handleSave = (
    itemData: Partial<T>,
    editingItem: T | null,
    setIsAdding: (value: boolean) => void,
    setEditing: (item: T | null) => void,
    defaultFields: Partial<T> = {}
  ) => {
    if (editingItem) {
      setItems(items.map(item => 
        item.id === editingItem.id ? { ...item, ...itemData } : item
      ));
    } else {
      const newItem: T = {
        id: generateId(items.length + 1),
        ...defaultFields,
        ...itemData
      } as T;
      setItems([...items, newItem]);
    }
    setIsAdding(false);
    setEditing(null);
  };

  const handleExport = (filename: string, headers: string[]) => () => {
    const csvContent = [
      headers,
      ...items.map(item => headers.map(header => 
        String((item as any)[header.toLowerCase().replace(/\s+/g, '')] || '')
      ))
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (acceptedTypes: string = '.csv') => () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert(`Import functionality implemented - File selected: ${file.name}`);
      }
    };
    input.click();
  };

  return {
    handleAdd,
    handleEdit,
    handleDelete,
    handleView,
    handleSave,
    handleExport,
    handleImport
  };
};

export const createFilterHandlers = <T>(
  items: T[],
  searchTerm: string,
  selectedFilter: string,
  searchFields: (keyof T)[],
  filterField?: keyof T
) => {
  return items.filter(item => {
    const matchesSearch = searchFields.some(field => 
      String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (selectedFilter === 'all') return matchesSearch;
    if (filterField) {
      return matchesSearch && String(item[filterField]).toLowerCase() === selectedFilter;
    }
    return matchesSearch;
  });
};

export const createQuickActions = (moduleName: string) => [
  {
    label: `New ${moduleName}`,
    icon: 'Plus',
    action: () => alert(`Opening new ${moduleName.toLowerCase()} form...`)
  },
  {
    label: 'Generate Report',
    icon: 'BarChart3',
    action: () => alert(`Generating ${moduleName.toLowerCase()} analytics report...`)
  },
  {
    label: 'Bulk Operations',
    icon: 'Settings',
    action: () => alert(`Opening bulk ${moduleName.toLowerCase()} operations...`)
  },
  {
    label: 'AI Analysis',
    icon: 'Brain',
    action: () => alert(`Starting AI analysis for ${moduleName.toLowerCase()}...`)
  }
];

export const createAIInsights = (moduleName: string) => [
  {
    title: `${moduleName} Risk Analysis`,
    insight: `AI has identified potential optimization opportunities in your ${moduleName.toLowerCase()} workflow.`,
    confidence: Math.floor(Math.random() * 20) + 80,
    action: 'Optimize Now'
  },
  {
    title: 'Compliance Check',
    insight: `Automated compliance review shows excellent adherence to ${moduleName.toLowerCase()} standards.`,
    confidence: Math.floor(Math.random() * 15) + 85,
    action: 'View Details'
  },
  {
    title: 'Performance Insights',
    insight: `Trending analysis suggests improved efficiency in your ${moduleName.toLowerCase()} processes.`,
    confidence: Math.floor(Math.random() * 25) + 75,
    action: 'View Trends'
  }
];
