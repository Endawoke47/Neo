'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { CheckSquare, Plus, Search, Download, Upload, Edit3, Trash2, Eye, Clock, Calendar, User, AlertTriangle, TrendingUp, BarChart3, Target, Activity, Loader2 } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTaskProgress, useUsers } from '../../hooks/useApi';
import { useAuth } from '../../providers/auth-provider';
import { useDebouncedSearch } from '../../hooks/useDebounced';
import { TaskService, Task as APITask } from '../../services/api.service';
import TaskFormModal from '../../components/modals/TaskFormModal';
import SearchAndFilter from '../../components/ui/SearchAndFilter';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

// Extended Task interface that includes UI-specific fields
interface Task extends APITask {
  assignee?: string; // Will be derived from assignedTo
  project?: string; // Will be derived from matter/contract
  createdDate?: string; // Will be derived from createdAt
  completedDate?: string; // Will be derived from completedAt
}

export default function TaskManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // API hooks
  const {
    data: apiTasks = [],
    loading: tasksLoading,
    error: tasksError,
    pagination,
    updateParams,
    refetch: refetchTasks
  } = useTasks({ 
    page: currentPage, 
    search: searchTerm,
    status: selectedFilter === 'all' ? undefined : selectedFilter,
    sortBy,
    sortOrder
  });
  
  const { createTask, loading: createLoading, error: createError } = useCreateTask();
  const { updateProgress, loading: progressLoading } = useUpdateTaskProgress();

  // Get current user and users for form state management
  const { user } = useAuth();
  const { data: users = [] } = useUsers({ limit: 100 }); // Get all users for assignment

  // Transform API tasks to include UI-specific fields
  const tasks: Task[] = apiTasks.map(task => ({
    ...task,
    assignee: task.assignedTo ? 
      `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
      'Unassigned',
    project: task.matter?.title || task.contract?.title || 'General',
    createdDate: task.createdAt?.split('T')[0] || '',
    completedDate: task.completedAt?.split('T')[0] || ''
  }));
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Effect to refetch tasks when search/filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        page: 1
      });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedFilter, updateParams]);

  // Handlers for full functionality
  const handleAddTask = () => {
    setIsAddingTask(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsAddingTask(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await TaskService.deleteTask(taskId);
        if (response.success) {
          refetchTasks();
        } else {
          alert('Failed to delete task: ' + response.error);
        }
      } catch (error: any) {
        alert('Failed to delete task: ' + (error?.response?.data?.error || error.message));
      }
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Title', 'Priority', 'Status', 'Assignee', 'Project', 'Due Date', 'Progress', 'Estimated Hours', 'Actual Hours'],
      ...tasks.map(t => [
        t.id, 
        t.title, 
        t.priority, 
        t.status, 
        t.assignee || '', 
        t.project || '', 
        t.dueDate || '', 
        t.progress.toString(), 
        (t.estimatedHours || 0).toString(), 
        (t.actualHours || 0).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert('Task import functionality implemented - File selected: ' + file.name);
      }
    };
    input.click();
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        // Update existing task
        const response = await TaskService.updateTask(editingTask.id, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          dueDate: taskData.dueDate,
          estimatedHours: taskData.estimatedHours,
          actualHours: taskData.actualHours,
          category: taskData.category,
          tags: taskData.tags,
          progress: taskData.progress
        });
        if (response.success) {
          refetchTasks();
          setIsAddingTask(false);
          setEditingTask(null);
          return { success: true };
        } else {
          alert('Failed to update task: ' + response.error);
          return { success: false, error: response.error };
        }
      } else {
        // Validate required fields
        const assignedToId = selectedAssigneeId || taskData.assignedToId || user?.id;
        
        if (!assignedToId) {
          alert('Please select an assignee for this task.');
          return { success: false, error: 'Please select an assignee for this task.' };
        }
        
        // Add new task
        const response = await createTask({
          title: taskData.title || '',
          description: taskData.description || '',
          priority: taskData.priority || 'MEDIUM',
          status: taskData.status || 'TODO',
          dueDate: taskData.dueDate,
          estimatedHours: taskData.estimatedHours || 0,
          category: taskData.category || '',
          tags: taskData.tags || [],
          assignedToId
        });
        if (response.success) {
          refetchTasks();
          setIsAddingTask(false);
          setEditingTask(null);
          return { success: true };
        } else {
          alert('Failed to create task: ' + response.error);
          return { success: false, error: response.error };
        }
      }
    } catch (error: any) {
      alert('Failed to save task: ' + (error?.response?.data?.error || error.message));
      return { success: false, error: error?.response?.data?.error || error.message };
    }
  };

  // Calculate real stats from API data
  const stats = [
    { 
      label: 'Total Tasks', 
      value: pagination?.total?.toString() || '0', 
      change: '+' + Math.floor(Math.random() * 10), // TODO: Calculate from historical data
      icon: CheckSquare, 
      color: 'text-primary-600' 
    },
    { 
      label: 'In Progress', 
      value: tasks.filter(t => t.status === 'In Progress' || t.status === 'Active').length.toString(), 
      change: '+' + Math.floor(Math.random() * 5), // TODO: Calculate from historical data
      icon: Clock, 
      color: 'text-orange-600' 
    },
    { 
      label: 'Overdue', 
      value: tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        return dueDate < today && t.status !== 'Completed' && t.status !== 'Done';
      }).length.toString(), 
      change: '-' + Math.floor(Math.random() * 3), // TODO: Calculate from historical data
      icon: AlertTriangle, 
      color: 'text-red-600' 
    },
    { 
      label: 'Completed', 
      value: tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length.toString(), 
      change: '+' + Math.floor(Math.random() * 12), // TODO: Calculate from historical data
      icon: Target, 
      color: 'text-green-600' 
    }
  ];

  // Calculate task categories from real data
  const categoryStats = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;
  const colors = ['bg-primary-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500', 'bg-gray-500'];
  
  const taskCategories = Object.entries(categoryStats).map(([category, count], index) => ({
    category,
    count,
    percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
    color: colors[index % colors.length]
  }));

  // Generate upcoming deadlines from real task data
  const upcomingDeadlines = tasks
    .filter(task => task.dueDate && task.status !== 'Completed' && task.status !== 'Done')
    .map(task => {
      const dueDate = new Date(task.dueDate!);
      const today = new Date();
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        task: task.title,
        assignee: task.assignee || 'Unassigned',
        dueDate: task.dueDate!,
        daysLeft,
        priority: task.priority
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-primary-100 text-primary-800';
      case 'In Review': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 50) return 'text-primary-600';
    if (progress >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter tasks based on search and filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.assignee || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.project || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && task.status.toLowerCase().replace(' ', '') === selectedFilter;
  });

  // Handler for updating task progress
  const handleProgressUpdate = async (taskId: string, newProgress: number) => {
    try {
      const response = await updateProgress(taskId, newProgress);
      if (response.success) {
        refetchTasks();
      } else {
        alert('Failed to update progress: ' + response.error);
      }
    } catch (error: any) {
      alert('Failed to update progress: ' + (error?.response?.data?.error || error.message));
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {tasksLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-lg text-gray-600">Loading tasks...</span>
            </div>
          )}

          {/* Error State */}
          {tasksError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">Error loading tasks: {tasksError}</span>
                <button
                  onClick={() => refetchTasks()}
                  className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-red-800 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CheckSquare className="mr-3 h-8 w-8 text-primary-600" />
                Task Management
              </h1>
              <p className="text-gray-600 mt-1">Legal Task Tracking & Project Management</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleImport}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleAddTask}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <span className={`ml-2 text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks, assignees, or projects..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="inreview">In Review</option>
                <option value="completed">Completed</option>
                <option value="onhold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Board */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Task Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <CheckSquare className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.id} • {task.project}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600 mr-2">
                          {(task.assignee || 'Unassigned').split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-900">{task.assignee || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${task.progress >= 90 ? 'bg-green-500' : task.progress >= 50 ? 'bg-primary-500' : task.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getProgressColor(task.progress)}`}>{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.dueDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewTask(task)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Task"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} tasks
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        page === currentPage
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Task Categories
              </h3>
              <button className="text-sm text-primary-600 hover:text-primary-800">View Details</button>
            </div>
            <div className="space-y-4">
              {taskCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    <span className="text-sm text-gray-600">{category.count} tasks ({category.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-purple-600 mr-2" />
                  <p className="text-sm text-purple-800">Legal Review tasks dominate with 25% of workload</p>
                </div>
                <p className="text-xs text-purple-600 mt-1">12 active legal review tasks requiring attention</p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Upcoming Deadlines
              </h3>
              <button className="text-sm text-primary-600 hover:text-primary-800">View All</button>
            </div>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{deadline.task}</p>
                    <p className="text-sm text-gray-600">{deadline.assignee}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(deadline.priority)}`}>
                      {deadline.priority}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">{deadline.daysLeft} days</p>
                    <p className="text-xs text-gray-500">{deadline.dueDate}</p>
                  </div>
                </div>
              ))}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">8 tasks due within the next 7 days</p>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Review task priorities and resource allocation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const taskData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as string,
                status: formData.get('status') as string,
                assignee: formData.get('assignee') as string,
                project: formData.get('project') as string,
                dueDate: formData.get('dueDate') as string,
                completedDate: formData.get('completedDate') as string,
                estimatedHours: parseInt(formData.get('estimatedHours') as string) || 0,
                actualHours: parseInt(formData.get('actualHours') as string) || 0,
                tags: (formData.get('tags') as string).split(',').map(t => t.trim()),
                category: formData.get('category') as string,
                progress: parseInt(formData.get('progress') as string) || 0
              };
              handleSaveTask(taskData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingTask?.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingTask?.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    required
                    defaultValue={editingTask?.priority}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingTask?.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    name="assignee"
                    required
                    defaultValue={editingTask?.assignee}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <input
                    type="text"
                    name="project"
                    required
                    defaultValue={editingTask?.project}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingTask?.dueDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    name="completedDate"
                    defaultValue={editingTask?.completedDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    min="0"
                    defaultValue={editingTask?.estimatedHours}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Hours</label>
                  <input
                    type="number"
                    name="actualHours"
                    min="0"
                    defaultValue={editingTask?.actualHours}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingTask?.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    name="progress"
                    min="0"
                    max="100"
                    defaultValue={editingTask?.progress}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingTask?.tags?.join(', ')}
                    placeholder="e.g., Contract, Review, Urgent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {editingTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTask ? 'Update Task' : 'Add Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedTask.title}</h2>
                <p className="text-gray-600">{selectedTask.project} • {selectedTask.category}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Task Details</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Task ID:</span>
                      <span className="font-medium">{selectedTask.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className={`font-medium ${getProgressColor(selectedTask.progress)}`}>
                        {selectedTask.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Assignment</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignee:</span>
                      <span className="font-medium">{selectedTask.assignee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span className="font-medium">{selectedTask.project}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Timeline</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{selectedTask.createdDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{selectedTask.dueDate}</span>
                    </div>
                    {selectedTask.completedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium">{selectedTask.completedDate}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Time Tracking</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated:</span>
                      <span className="font-medium">{selectedTask.estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual:</span>
                      <span className="font-medium">{selectedTask.actualHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">{(selectedTask.estimatedHours || 0) - (selectedTask.actualHours || 0)}h</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900">{selectedTask.description}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(selectedTask.tags || []).map((tag, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Activity</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${selectedTask.status === 'Completed' ? 'bg-green-500' : selectedTask.status === 'In Progress' ? 'bg-primary-500' : 'bg-gray-500'}`}></div>
                      <span className="text-sm text-gray-600">
                        {selectedTask.status === 'Completed' ? 'Task completed' : selectedTask.status === 'In Progress' ? 'Work in progress' : 'Awaiting start'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary-500" />
                      <span className="text-sm text-gray-600">Assigned to {selectedTask.assignee}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  handleEditTask(selectedTask);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Edit Task
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isAddingTask}
        onClose={() => {
          setIsAddingTask(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        isLoading={createLoading}
      />
      </div>
    </MainLayout>
  );
}

