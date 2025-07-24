import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ColumnDef } from '@tanstack/react-table';
import { 
   
  CreditCard, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Send,
  Printer,
  Copy,
  ExternalLink,
  Star,
  Shield,
  Zap,
  Target,
  PieChart,
  BarChart3,
  LineChart,
  Loader2,
  IndianRupee,
  FileDown
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface BillingStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  currency: string;
}

interface Invoice {
  _id: string;
  invoiceId: string;
  hospitalId: {
    _id: string;
    name: string;
    email: string;
  };
  subscriptionId: {
    _id: string;
    planName: string;
    planType: string;
  };
  amount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  _id: string;
  hospitalId: {
    _id: string;
    name: string;
    email: string;
  };
  subscriptionId: {
    _id: string;
    planName: string;
    planType: string;
  };
  invoiceId?: {
    _id: string;
    invoiceId: string;
  };
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'online';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  receiptNumber: string;
  transactionId?: string;
  processedBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPlan {
  _id: string;
  planName: string;
  planType: string;
  monthlyCost: number;
  yearlyCost: number;
  currency: string;
  maxUsers: number;
  maxBranches: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  activeSubscribers?: number;
}

const BillingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch billing statistics
  const { data: billingStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['billing-stats'],
    queryFn: async (): Promise<BillingStats> => {
      const response = await fetch(`${API_URL}/api/master-admin/revenue-analytics`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing statistics');
      }

      const data = await response.json();
      return {
        totalRevenue: data.totalRevenue || 0,
        pendingAmount: data.pendingAmount || 0,
        overdueAmount: data.overdueAmount || 0,
        thisMonthRevenue: data.thisMonthRevenue || 0,
        lastMonthRevenue: data.lastMonthRevenue || 0,
        currency: 'INR'
      };
    }
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['billing-invoices', currentPage, limit, selectedStatus, searchTerm],
    queryFn: async (): Promise<{ invoices: Invoice[]; pagination: any }> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      });

      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/api/master-admin/billing?${params}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      return response.json();
    }
  });

  // Fetch subscription payments (using billing data as fallback)
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['billing-subscription-payments'],
    queryFn: async (): Promise<Payment[]> => {
      try {
        // Try to fetch from subscription payments endpoint first
        const response = await fetch(`${API_URL}/api/master-admin/subscription-payments`, {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });

        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.log('Subscription payments endpoint not available, using billing data');
      }

      // Fallback: Use billing data to create payment records
      const billingResponse = await fetch(`${API_URL}/api/master-admin/billing?status=paid&limit=100`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!billingResponse.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const billingData = await billingResponse.json();
      
      // Transform billing data to payment format
      return billingData.invoices?.map((invoice: any) => ({
        _id: invoice._id,
        hospitalId: invoice.hospitalId,
        subscriptionId: invoice.subscriptionId,
        invoiceId: {
          _id: invoice._id,
          invoiceId: invoice.invoiceId
        },
        amount: invoice.totalAmount,
        method: invoice.paymentMethod || 'online',
        status: invoice.status,
        receiptNumber: `RCP${invoice.invoiceId}`,
        transactionId: invoice.transactionId,
        processedBy: {
          firstName: 'System',
          lastName: 'Admin'
        },
        createdAt: invoice.paidDate || invoice.createdAt,
        updatedAt: invoice.updatedAt
      })) || [];
    }
  });

  // Fetch subscription plans
  const { data: subscriptionPlansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<{ plans: SubscriptionPlan[] }> => {
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }

      return response.json();
    }
  });

  // Mark invoice as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentMethod, transactionId }: { invoiceId: string; paymentMethod: string; transactionId?: string }) => {
      const response = await fetch(`${API_URL}/api/master-admin/billing/${invoiceId}/mark-paid`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ paymentMethod, transactionId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: "Success",
        description: "Invoice marked as paid successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark invoice as paid",
        variant: "destructive"
      });
    }
  });

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
      case 'sent':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'cash':
        return <IndianRupee className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4" />;
      case 'online':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <IndianRupee className="w-4 h-4" />;
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
    queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['billing-subscription-payments'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    toast({
      title: "Refreshed",
      description: "Billing data has been refreshed",
    });
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    markAsPaidMutation.mutate({ 
      invoiceId, 
      paymentMethod: 'card',
      transactionId: `TXN${Date.now()}`
    });
  };

  // Payment action handlers
  const handleViewPayment = (payment: Payment) => {
    toast({
      title: "Payment Details",
      description: `Receipt: ${payment.receiptNumber} - Amount: ${formatCurrency(payment.amount, 'INR')}`,
    });
  };

  const handleDownloadReceipt = (payment: Payment) => {
    toast({
      title: "Download Receipt",
      description: `Downloading receipt for ${payment.receiptNumber}`,
    });
    // Here you would implement actual download logic
  };

  const handlePrintReceipt = (payment: Payment) => {
    toast({
      title: "Print Receipt",
      description: `Printing receipt for ${payment.receiptNumber}`,
    });
    // Here you would implement actual print logic
  };

  const handleRefundPayment = (payment: Payment) => {
    toast({
      title: "Refund Payment",
      description: `Processing refund for ${payment.receiptNumber}`,
    });
    // Here you would implement actual refund logic
  };

  // Invoice action handlers
  const handleViewInvoice = (invoice: Invoice) => {
    toast({
      title: "Invoice Details",
      description: `Invoice: ${invoice.invoiceId} - Amount: ${formatCurrency(invoice.totalAmount, invoice.currency)}`,
    });
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast({
      title: "Download Invoice",
      description: `Downloading invoice ${invoice.invoiceId}`,
    });
    // Here you would implement actual download logic
  };

  const handleSendInvoice = (invoice: Invoice) => {
    toast({
      title: "Send Invoice",
      description: `Sending invoice ${invoice.invoiceId} to ${invoice.hospitalId.email}`,
    });
    // Here you would implement actual send logic
  };

  // Export functionality
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              return `"${value.join(', ')}"`;
            } else {
              return `"${JSON.stringify(value)}"`;
            }
          }
          // Handle strings with commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${filename} has been exported successfully`,
    });
  };

  const handleExportInvoices = () => {
    const exportData = invoicesData?.invoices.map(invoice => ({
      'Invoice ID': invoice.invoiceId,
      'Hospital Name': invoice.hospitalId.name,
      'Hospital Email': invoice.hospitalId.email,
      'Plan Name': invoice.subscriptionId.planName,
      'Plan Type': invoice.subscriptionId.planType,
      'Amount': invoice.totalAmount,
      'Currency': invoice.currency,
      'Status': invoice.status,
      'Due Date': new Date(invoice.dueDate).toLocaleDateString(),
      'Created Date': new Date(invoice.createdAt).toLocaleDateString(),
      'Description': invoice.description
    })) || [];
    exportToCSV(exportData, 'invoices');
  };

  const handleExportPayments = () => {
    const exportData = (paymentsData ?? []).map(payment => ({
      'Receipt Number': payment.receiptNumber,
      'Hospital Name': payment.hospitalId.name,
      'Hospital Email': payment.hospitalId.email,
      'Subscription Plan': payment.subscriptionId.planName,
      'Plan Type': payment.subscriptionId.planType,
      'Invoice ID': payment.invoiceId ? payment.invoiceId.invoiceId : 'N/A',
      'Amount': payment.amount,
      'Payment Method': payment.method.replace('_', ' '),
      'Status': payment.status,
      'Transaction ID': payment.transactionId || 'N/A',
      'Processed By': `${payment.processedBy.firstName} ${payment.processedBy.lastName}`,
      'Payment Date': new Date(payment.createdAt).toLocaleDateString(),
      'Payment Time': new Date(payment.createdAt).toLocaleTimeString()
    }));
    exportToCSV(exportData, 'subscription_payments');
  };

  // Invoice columns definition
  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceId",
      header: "Invoice ID",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{row.original.invoiceId}</span>
        </div>
      ),
    },
    {
      accessorKey: "hospitalId.name",
      header: "Hospital",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.hospitalId?.name || 'N/A'}</p>
          <p className="text-sm text-gray-500">{row.original.hospitalId?.email || 'N/A'}</p>
        </div>
      ),
    },
    {
      accessorKey: "subscriptionId.planName",
      header: "Plan",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.subscriptionId?.planName || 'N/A'}</p>
          <p className="text-sm text-gray-500">{row.original.subscriptionId?.planType || 'N/A'}</p>
        </div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-bold">
          {formatCurrency(row.original.totalAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{new Date(row.original.dueDate).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">
            {new Date(row.original.dueDate) < new Date() ? 'Overdue' : 'Due'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            title="View Details"
            onClick={() => handleViewInvoice(row.original)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Download Invoice"
            onClick={() => handleDownloadInvoice(row.original)}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            title="Send Invoice"
            onClick={() => handleSendInvoice(row.original)}
          >
            <Send className="w-4 h-4" />
          </Button>
          {row.original.status !== 'paid' && row.original.status !== 'cancelled' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleMarkAsPaid(row.original._id)}
              disabled={markAsPaidMutation.isPending}
              title="Mark as Paid"
            >
              {markAsPaidMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Payment columns definition
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: "receiptNumber",
      header: "Receipt No.",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            {getPaymentMethodIcon(row.original.method)}
          </div>
          <span className="font-medium">{row.original.receiptNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "hospitalId.name",
      header: "Hospital",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.hospitalId.name}</p>
          <p className="text-sm text-gray-500">{row.original.hospitalId.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "subscriptionId.planName",
      header: "Subscription",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.subscriptionId.planName}</p>
          <p className="text-sm text-gray-500">{row.original.subscriptionId.planType}</p>
        </div>
      ),
    },
    {
      accessorKey: "invoiceId",
      header: "Invoice",
      cell: ({ row }) => (
        row.original.invoiceId ? (
          <span className="font-medium text-blue-600">{row.original.invoiceId.invoiceId}</span>
        ) : (
          <span className="text-gray-500">No invoice</span>
        )
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-bold">
          {formatCurrency(row.original.amount, 'INR')}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {getPaymentMethodIcon(row.original.method)}
          <span className="capitalize">{row.original.method.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{new Date(row.original.createdAt).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">
            {new Date(row.original.createdAt).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        row.original.status === 'completed' ? (
          <Badge className="bg-green-100 text-green-800">Completed</Badge>
        ) : row.original.status === 'pending' ? (
          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
        ) : row.original.status === 'failed' ? (
          <Badge className="bg-red-100 text-red-800">Failed</Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>
        )
      ),
    },

  ];

  const invoices = invoicesData?.invoices || [];
  const payments = paymentsData || [];
  const subscriptionPlans = subscriptionPlansData?.plans || [];
  const pagination = invoicesData?.pagination;

  const stats = billingStats || {
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    currency: 'INR'
  };

  if (statsError || invoicesError || paymentsError || plansError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Billing Data</h3>
          <p className="text-gray-600 mb-4">
            {statsError?.message || invoicesError?.message || paymentsError?.message || plansError?.message || 'Failed to load billing data'}
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-gray-600 mt-1">Manage invoices, payments, and subscriptions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={statsLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
        </div>
      </div>

      {/* Billing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.totalRevenue, stats.currency)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12.3% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.pendingAmount, stats.currency)}
                </p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {invoices.filter(inv => inv.status === 'sent').length} invoices pending
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.overdueAmount, stats.currency)}
                </p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {invoices.filter(inv => inv.status === 'overdue').length} invoices overdue
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.thisMonthRevenue, stats.currency)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.3% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Invoice Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage and track all invoices</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportInvoices}
                  disabled={invoicesLoading || invoices.length === 0}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Invoices
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No invoices have been created yet'
                    }
                  </p>
                </div>
              ) : (
                <EnhancedTable
                  columns={invoiceColumns}
                  data={invoices}
                  searchPlaceholder="Search invoices..."
                  filterOptions={[
                    {
                      label: "Status",
                      value: "status",
                      options: [
                        { label: "All", value: "all" },
                        { label: "Paid", value: "paid" },
                        { label: "Sent", value: "sent" },
                        { label: "Overdue", value: "overdue" },
                        { label: "Draft", value: "draft" },
                        { label: "Cancelled", value: "cancelled" },
                      ],
                    },
                  ]}
                  showFooter={true}
                  defaultRowsPerPage={10}
                  footerProps={{
                    showFirstLastButtons: true,
                    labelRowsPerPage: "Invoices per page:",
                    labelDisplayedRows: ({ from, to, count }) =>
                      `Showing ${from} to ${to} of ${count} invoices`,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscription Payments</CardTitle>
                  <CardDescription>Track all subscription payment transactions</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportPayments}
                  disabled={paymentsLoading || payments.length === 0}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Payments
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-600">No payment transactions have been recorded yet</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={paymentColumns}
                  data={payments}
                  searchPlaceholder="Search payments..."
                  filterOptions={[
                    {
                      label: "Status",
                      value: "status",
                      options: [
                        { label: "All", value: "all" },
                        { label: "Completed", value: "completed" },
                        { label: "Pending", value: "pending" },
                        { label: "Refunded", value: "refunded" },
                      ],
                    },
                    {
                      label: "Method",
                      value: "method",
                      options: [
                        { label: "All", value: "all" },
                        { label: "Cash", value: "cash" },
                        { label: "Card", value: "card" },
                        { label: "Insurance", value: "insurance" },
                      ],
                    },
                  ]}
                  showFooter={true}
                  defaultRowsPerPage={10}
                  footerProps={{
                    showFirstLastButtons: true,
                    labelRowsPerPage: "Payments per page:",
                    labelDisplayedRows: ({ from, to, count }) =>
                      `Showing ${from} to ${to} of ${count} payments`,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : subscriptionPlans.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription plans found</h3>
              <p className="text-gray-600">No subscription plans have been created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card key={plan._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.planName}
                      <Badge variant="secondary">{plan.activeSubscribers || 0} active</Badge>
                    </CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold text-gray-900">{formatCurrency(plan.monthlyCost, plan.currency)}</span>
                      <span className="text-gray-600">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                    <Button className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      View Subscribers
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and download financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Reports Available</h3>
                <p className="text-gray-600 mb-6">
                  Access comprehensive reporting and analytics in the dedicated Reports section
                </p>
                <Button asChild>
                  <a href="/master-admin/reports">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Go to Reports
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingPage; 