import React, { useState } from 'react';
import SubscriptionForm from './SubscriptionForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  IndianRupee,
  Users,
  Building2,
  RefreshCw,
  Download,
  FileText,
  Settings,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Shield,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  HelpCircle,
  AlertCircle,
  CheckSquare,
  Square,
  Minus,
  Plus as PlusIcon,
  BarChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { authService } from '@/lib/auth';

interface Subscription {
  _id: string;
  hospitalId: {
    _id: string;
    name: string;
    email: string;
  };
  planName: string;
  planType: 'trial' | 'basic' | 'premium' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'expired' | 'cancelled' | 'trial';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  monthlyCost: number;
  currency: string;
  features: string[];
  maxUsers: number;
  maxBranches: number;
  maxPatients: number;
  autoRenew: boolean;
  paymentMethod: 'monthly' | 'yearly' | 'quarterly';
  nextBillingDate: string;
  lastPaymentDate?: string;
  totalPaid: number;
  outstandingAmount: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPlan {
  _id: string;
  planName: string;
  planType: string;
  description?: string;
  monthlyCost: number;
  yearlyCost: number;
  currency: string;
  trialDays: number;
  maxUsers: number;
  maxBranches: number;
  maxPatients: number;
  maxStorage: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  isCustom: boolean;
  autoRenew: boolean;
  billingCycle: string;
  gracePeriod: number;
  setupFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStats {
  totalPlans: number;
  activePlans: number;
  popularPlans: number;
  plansByType: Array<{
    _id: string;
    count: number;
    avgMonthlyCost: number;
    avgYearlyCost: number;
  }>;
}

const SubscriptionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionPlan | null>(null);
  const [viewingSubscription, setViewingSubscription] = useState<SubscriptionPlan | null>(null);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);
  const [showFeatureConfig, setShowFeatureConfig] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL;

  // Export functionality
  const exportToCSV = () => {
    if (!subscriptionPlansData?.plans?.length) {
      return;
    }

    const headers = [
      'Plan Name',
      'Plan Type',
      'Description',
      'Monthly Cost',
      'Yearly Cost',
      'Currency',
      'Trial Days',
      'Max Users',
      'Max Branches',
      'Max Patients',
      'Max Storage',
      'Features',
      'Status',
      'Popular',
      'Custom',
      'Auto Renew',
      'Billing Cycle',
      'Grace Period',
      'Setup Fee',
      'Created Date'
    ];

    const csvData = subscriptionPlansData.plans.map((plan: SubscriptionPlan) => [
      plan.planName,
      plan.planType,
      plan.description || '',
      plan.monthlyCost,
      plan.yearlyCost,
      plan.currency,
      plan.trialDays,
      plan.maxUsers,
      plan.maxBranches,
      plan.maxPatients,
      plan.maxStorage,
      plan.features.join('; '),
      plan.isActive ? 'Active' : 'Inactive',
      plan.isPopular ? 'Yes' : 'No',
      plan.isCustom ? 'Yes' : 'No',
      plan.autoRenew ? 'Yes' : 'No',
      plan.billingCycle,
      plan.gracePeriod,
      plan.setupFee,
      new Date(plan.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map((field: string) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscription_plans_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!subscriptionPlansData?.plans?.length) {
      return;
    }

    const headers = [
      'Plan Name',
      'Plan Type',
      'Description',
      'Monthly Cost',
      'Yearly Cost',
      'Currency',
      'Trial Days',
      'Max Users',
      'Max Branches',
      'Max Patients',
      'Max Storage',
      'Features',
      'Status',
      'Popular',
      'Custom',
      'Auto Renew',
      'Billing Cycle',
      'Grace Period',
      'Setup Fee',
      'Created Date'
    ];

    const excelData = subscriptionPlansData.plans.map((plan: SubscriptionPlan) => [
      plan.planName,
      plan.planType,
      plan.description || '',
      plan.monthlyCost,
      plan.yearlyCost,
      plan.currency,
      plan.trialDays,
      plan.maxUsers,
      plan.maxBranches,
      plan.maxPatients,
      plan.maxStorage,
      plan.features.join('; '),
      plan.isActive ? 'Active' : 'Inactive',
      plan.isPopular ? 'Yes' : 'No',
      plan.isCustom ? 'Yes' : 'No',
      plan.autoRenew ? 'Yes' : 'No',
      plan.billingCycle,
      plan.gracePeriod,
      plan.setupFee,
      new Date(plan.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...excelData]
      .map(row => row.map((field: string) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscription_plans_export_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle viewing subscription details
  const handleViewSubscription = (plan: SubscriptionPlan) => {
    setViewingSubscription(plan);
    setShowSubscriptionDetails(true);
  };

  // Handle closing subscription details
  const handleCloseSubscriptionDetails = () => {
    setViewingSubscription(null);
    setShowSubscriptionDetails(false);
  };

  // Fetch subscription plans
  const { data: subscriptionPlansData, isLoading, error } = useQuery({
    queryKey: ['master-admin', 'subscription-plans', page, limit, statusFilter, planTypeFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' ? 'true' : 'false' }),
        ...(planTypeFilter !== 'all' && { planType: planTypeFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error('Failed to fetch subscription plans');
      }
      const data = await response.json();
      console.log('Subscription plans data:', data);
      return data;
    }
  });

  // Fetch subscription plan statistics
  const { data: stats } = useQuery({
    queryKey: ['master-admin', 'subscription-plan-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans/stats/overview`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subscription plan statistics');
      const data = await response.json();
      return data as SubscriptionStats;
    }
  });

  // Fetch subscribers for a specific plan
  const { data: subscribersData, isLoading: subscribersLoading, error: subscribersError } = useQuery({
    queryKey: ['master-admin', 'plan-subscribers', viewingSubscription?._id],
    queryFn: async () => {
      if (!viewingSubscription?._id) return null;
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans/${viewingSubscription._id}/subscribers`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      const data = await response.json();
      return data;
    },
    enabled: !!viewingSubscription?._id && showSubscribers
  });

  // Fetch analytics for a specific plan
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['master-admin', 'plan-analytics', viewingSubscription?._id],
    queryFn: async () => {
      if (!viewingSubscription?._id) return null;
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans/${viewingSubscription._id}/analytics`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      return data;
    },
    enabled: !!viewingSubscription?._id && showAnalytics
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`${API_URL}/api/master-admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'subscription-stats'] });
      setIsEditDialogOpen(false);
    }
  });

  // Delete subscription plan mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete subscription plan');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'subscription-plan-stats'] });
      setShowDeleteConfirm(false);
      setDeletingPlan(null);
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
    }
  });

  // Action handlers
  const handleConfigureFeatures = (plan: SubscriptionPlan) => {
    setViewingSubscription(plan);
    setShowFeatureConfig(true);
  };

  const handleViewSubscribers = (plan: SubscriptionPlan) => {
    setViewingSubscription(plan);
    setShowSubscribers(true);
  };

  const handleViewAnalytics = (plan: SubscriptionPlan) => {
    setViewingSubscription(plan);
    setShowAnalytics(true);
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setDeletingPlan(plan);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingPlan) {
      deleteSubscriptionMutation.mutate(deletingPlan._id);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingPlan(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'trial': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic': return 'bg-green-100 text-green-800 border-green-200';
      case 'trial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'custom': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', '₹ '); // Ensure proper spacing with rupee symbol
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isOverdue = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  const handleEditSubscription = (plan: SubscriptionPlan) => {
    setEditingSubscription(plan);
    setShowSubscriptionForm(true);
  };

  const handleCreateSubscription = () => {
    console.log('Create subscription button clicked');
    setEditingSubscription(null);
    setShowSubscriptionForm(true);
  };

  const handleSubscriptionFormSuccess = () => {
    setShowSubscriptionForm(false);
    setEditingSubscription(null);
  };

  const handleSubscriptionFormCancel = () => {
    setShowSubscriptionForm(false);
    setEditingSubscription(null);
  };

  const handleUpdateSubscription = (data: any) => {
    if (selectedSubscription) {
      updateSubscriptionMutation.mutate({
        id: selectedSubscription._id,
        data
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Plan Management</h1>
              <p className="text-gray-600 mt-1">Manage subscription plan templates for hospitals</p>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                onClick={handleCreateSubscription}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Subscription Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Plans</CardTitle>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalPlans || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Plans</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
                          <div className="text-2xl font-bold text-gray-900">{stats?.activePlans || 0}</div>
            <p className="text-xs text-blue-600 mt-1">
              {stats?.popularPlans || 0} popular
            </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Plan Types</CardTitle>
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
                          <div className="text-2xl font-bold text-gray-900">
              {stats?.plansByType?.length || 0} types
            </div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Popular Plans</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
                          <div className="text-2xl font-bold text-gray-900">
              {stats?.popularPlans || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Popular plans
            </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search hospitals or plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Plan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
                      <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage all subscription plan templates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading subscription plans</h3>
                <p className="text-gray-600 mb-6">{error.message}</p>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptionPlansData?.plans?.map((plan: SubscriptionPlan) => (
                  <div key={plan._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{plan.planName}</h3>
                          <Badge variant="outline" className={getStatusColor(plan.isActive ? 'active' : 'inactive')}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className={getPlanTypeColor(plan.planType)}>
                            {plan.planType}
                          </Badge>
                          {plan.isPopular && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Monthly:</span> {formatCurrency(plan.monthlyCost, plan.currency)}
                          </div>
                          <div>
                            <span className="font-medium">Yearly:</span> {formatCurrency(plan.yearlyCost, plan.currency)}
                          </div>
                          <div>
                            <span className="font-medium">Users:</span> {plan.maxUsers}
                          </div>
                          <div>
                            <span className="font-medium">Branches:</span> {plan.maxBranches}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 5).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {plan.features.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{plan.features.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSubscription(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSubscription(plan)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewSubscription(plan)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSubscription(plan)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleConfigureFeatures(plan)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Configure Features
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewSubscribers(plan)}>
                              <Users className="w-4 h-4 mr-2" />
                              View Subscribers
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAnalytics(plan)}>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeletePlan(plan)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}

                {subscriptionPlansData?.plans?.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
                    <p className="text-gray-600 mb-6">Get started by creating a new subscription.</p>
                    <Button onClick={handleCreateSubscription}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Subscription Plan
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {subscriptionPlansData?.pagination && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((subscriptionPlansData.pagination.page - 1) * subscriptionPlansData.pagination.limit) + 1} to{' '}
                  {Math.min(subscriptionPlansData.pagination.page * subscriptionPlansData.pagination.limit, subscriptionPlansData.pagination.total)} of{' '}
                  {subscriptionPlansData.pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= subscriptionPlansData.pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Form Modal */}
      {showSubscriptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleSubscriptionFormCancel}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <SubscriptionForm
              subscription={editingSubscription || undefined}
              onSuccess={handleSubscriptionFormSuccess}
              onCancel={handleSubscriptionFormCancel}
            />
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {showSubscriptionDetails && viewingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Subscription Plan Details</h2>
                <p className="text-gray-600 mt-1">Comprehensive view of plan information and features</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseSubscriptionDetails}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Plan Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{viewingSubscription.planName}</h3>
                  <p className="text-gray-600 mt-1">{viewingSubscription.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(viewingSubscription.isActive ? 'active' : 'inactive')}>
                    {viewingSubscription.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className={getPlanTypeColor(viewingSubscription.planType)}>
                    {viewingSubscription.planType}
                  </Badge>
                  {viewingSubscription.isPopular && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
              </div>

              {/* Pricing Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Cost:</span>
                      <span className="font-semibold">{formatCurrency(viewingSubscription.monthlyCost, viewingSubscription.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Yearly Cost:</span>
                      <span className="font-semibold">{formatCurrency(viewingSubscription.yearlyCost, viewingSubscription.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Setup Fee:</span>
                      <span className="font-semibold">{formatCurrency(viewingSubscription.setupFee, viewingSubscription.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trial Days:</span>
                      <span className="font-semibold">{viewingSubscription.trialDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Grace Period:</span>
                      <span className="font-semibold">{viewingSubscription.gracePeriod} days</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Limits & Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Max Users:</span>
                      <span className="font-semibold">{viewingSubscription.maxUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Max Branches:</span>
                      <span className="font-semibold">{viewingSubscription.maxBranches}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Max Patients:</span>
                      <span className="font-semibold">{viewingSubscription.maxPatients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Max Storage:</span>
                      <span className="font-semibold">{viewingSubscription.maxStorage} GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Auto Renew:</span>
                      <span className="font-semibold">{viewingSubscription.autoRenew ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {viewingSubscription.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Billing Cycle:</span>
                      <p className="text-sm text-gray-900">{viewingSubscription.billingCycle}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Custom Plan:</span>
                      <p className="text-sm text-gray-900">{viewingSubscription.isCustom ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <p className="text-sm text-gray-900">{formatDate(viewingSubscription.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                      <p className="text-sm text-gray-900">{formatDate(viewingSubscription.updatedAt)}</p>
                    </div>
                  </div>
                  {viewingSubscription.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Notes:</span>
                      <p className="text-sm text-gray-900 mt-1">{viewingSubscription.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end p-6 border-t space-x-3">
              <Button variant="outline" onClick={handleCloseSubscriptionDetails}>
                Close
              </Button>
              <Button onClick={() => {
                handleCloseSubscriptionDetails();
                handleEditSubscription(viewingSubscription);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Configuration Modal */}
      {showFeatureConfig && viewingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configure Features for {viewingSubscription.planName}</h2>
                <p className="text-gray-600 mt-1">Manage the features included in this plan.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFeatureConfig(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingSubscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{feature}</span>
                    <input
                      type="checkbox"
                      checked={viewingSubscription.features.includes(feature)}
                      onChange={(e) => {
                        const newFeatures = [...viewingSubscription.features];
                        if (e.target.checked) {
                          newFeatures.push(feature);
                        } else {
                          newFeatures.splice(newFeatures.indexOf(feature), 1);
                        }
                        updateSubscriptionMutation.mutate({
                          id: viewingSubscription._id,
                          data: { features: newFeatures }
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end p-6 border-t space-x-3">
              <Button variant="outline" onClick={() => setShowFeatureConfig(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowFeatureConfig(false)}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscribers Modal */}
      {showSubscribers && viewingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Subscribers for {viewingSubscription.planName}</h2>
                <p className="text-gray-600 mt-1">List of hospitals currently subscribed to this plan.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSubscribers(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {subscribersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading subscribers...</span>
                </div>
              ) : subscribersError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading subscribers</h3>
                  <p className="text-gray-600 mb-4">{subscribersError.message}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : subscribersData?.subscribers?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscribersData.subscribers.map((subscriber: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-lg font-semibold text-gray-900">{subscriber.hospitalName}</h4>
                      <p className="text-sm text-gray-600">Email: {subscriber.email}</p>
                      <Badge variant="outline" className={getStatusColor(subscriber.status)}>
                        {subscriber.status}
                      </Badge>
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <p>Start: {formatDate(subscriber.startDate)}</p>
                        <p>Next Billing: {formatDate(subscriber.nextBillingDate)}</p>
                        <p>Total Paid: {formatCurrency(subscriber.totalPaid, subscriber.currency)}</p>
                        {subscriber.outstandingAmount > 0 && (
                          <p className="text-red-600">Outstanding: {formatCurrency(subscriber.outstandingAmount, subscriber.currency)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers found</h3>
                  <p className="text-gray-600">This plan currently has no active subscribers.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t space-x-3">
              <Button variant="outline" onClick={() => setShowSubscribers(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && viewingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics for {viewingSubscription.planName}</h2>
                <p className="text-gray-600 mt-1">Comprehensive analytics and performance metrics for this subscription plan</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-8">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-600 text-lg">Loading analytics data...</span>
                </div>
              ) : analyticsError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Error loading analytics</h3>
                  <p className="text-gray-600 mb-6">{analyticsError.message}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : analyticsData ? (
                <>
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Total Revenue</p>
                          <p className="text-3xl font-bold text-blue-900 mt-1">
                            {formatCurrency(analyticsData.totalRevenue || 0, analyticsData.currency || 'INR')}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500 rounded-lg">
                          <IndianRupee className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-sm text-blue-600 mt-2">
                        From {analyticsData.totalSubscriptions || 0} total subscriptions
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Active Subscriptions</p>
                          <p className="text-3xl font-bold text-green-900 mt-1">
                            {analyticsData.activeSubscriptions || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-green-500 rounded-lg">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        Including {analyticsData.activeTrials || 0} active trials
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700">Avg Monthly Cost</p>
                          <p className="text-3xl font-bold text-purple-900 mt-1">
                            {formatCurrency(analyticsData.avgMonthlyCost || 0, analyticsData.currency || 'INR')}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-500 rounded-lg">
                          <BarChart className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-sm text-purple-600 mt-2">
                        Average across all subscriptions
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-700">Retention Rate</p>
                          <p className="text-3xl font-bold text-orange-900 mt-1">
                            {analyticsData.customerRetention || 0}%
                          </p>
                        </div>
                        <div className="p-3 bg-orange-500 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-sm text-orange-600 mt-2">
                        Customer retention rate
                      </p>
                    </div>
                  </div>

                  {/* Detailed Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subscription Status Breakdown */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Active</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{analyticsData.activeSubscriptions || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Trial</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{analyticsData.activeTrials || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Inactive</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {(analyticsData.totalSubscriptions || 0) - (analyticsData.activeSubscriptions || 0) - (analyticsData.activeTrials || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Plan Performance */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Performance</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Monthly Revenue</span>
                            <span>{formatCurrency(analyticsData.totalRevenue || 0, analyticsData.currency || 'INR')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((analyticsData.totalRevenue || 0) / 100000 * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Customer Retention</span>
                            <span>{analyticsData.customerRetention || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${analyticsData.customerRetention || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Active Rate</span>
                            <span>{analyticsData.totalSubscriptions ? Math.round(((analyticsData.activeSubscriptions || 0) / analyticsData.totalSubscriptions) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${analyticsData.totalSubscriptions ? ((analyticsData.activeSubscriptions || 0) / analyticsData.totalSubscriptions) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Revenue trend charts will be displayed here</p>
                        <p className="text-sm text-gray-400">Interactive charts coming soon</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No analytics data available</h3>
                  <p className="text-gray-600 mb-4">Analytics data will appear once there are active subscriptions for this plan.</p>
                  <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-gray-600">
                      <strong>Tip:</strong> Analytics are generated based on actual subscription data. 
                      Create some subscriptions to this plan to see detailed analytics.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t space-x-3">
              <Button variant="outline" onClick={() => setShowAnalytics(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowAnalytics(false);
                handleViewSubscribers(viewingSubscription);
              }}>
                <Users className="w-4 h-4 mr-2" />
                View Subscribers
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Are you sure you want to delete this plan?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone. This will permanently delete the plan and all associated subscriptions.</p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={cancelDelete}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage; 