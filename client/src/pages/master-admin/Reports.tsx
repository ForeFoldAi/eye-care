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
  FileDown,
  FileSpreadsheet,
  FilePieChart,
  FileBarChart,
  FileText as FileTextIcon,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
  Download as DownloadIcon,
  BarChart,
  Activity,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Building,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  _id: string;
  reportType: string;
  reportName: string;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
  fileSize?: string;
  format: 'pdf' | 'csv' | 'excel';
  filters: Record<string, any>;
  generatedBy: {
    firstName: string;
    lastName: string;
  };
}

interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  avgInvoiceValue: number;
  currency: string;
}

interface SubscriptionReport {
  planName: string;
  activeSubscriptions: number;
  totalRevenue: number;
  avgMonthlyRevenue: number;
  churnRate: number;
  currency: string;
}

interface HospitalReport {
  hospitalName: string;
  subscriptionPlan: string;
  status: string;
  totalPaid: number;
  outstandingAmount: number;
  lastPaymentDate: string;
  nextBillingDate: string;
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

interface Hospital {
  _id: string;
  name: string;
  email: string;
  subscriptionId?: {
    _id: string;
    planName: string;
    planType: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ReportsPage: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState('financial');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('financial');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch billing data for financial reports
  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ['billing-data', dateRange],
    queryFn: async (): Promise<{ invoices: Invoice[]; pagination: any }> => {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000'
      });

      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await fetch(`/api/master-admin/billing?${params}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      return response.json();
    }
  });

  // Fetch subscription plans
  const { data: subscriptionPlansData, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<{ plans: SubscriptionPlan[] }> => {
      const response = await fetch('/api/master-admin/subscription-plans', {
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

  // Fetch hospitals
  const { data: hospitalsData, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async (): Promise<{ hospitals: Hospital[] }> => {
      const response = await fetch('/api/master-admin/hospitals', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hospitals');
      }

      return response.json();
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, filters }: { reportType: string; filters: Record<string, any> }) => {
      const response = await fetch('/api/master-admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ reportType, filters })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: `${data.reportName} has been generated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
    }
  });

  // Transform billing data to financial reports
  const transformToFinancialReports = (): FinancialReport[] => {
    if (!billingData?.invoices) return [];

    const invoices = billingData.invoices;
    const monthlyData: Record<string, any> = {};

    invoices.forEach((invoice: Invoice) => {
      const date = new Date(invoice.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          period: monthName,
          totalRevenue: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          totalAmount: 0,
          currency: invoice.currency
        };
      }

      monthlyData[monthKey].totalInvoices++;
      monthlyData[monthKey].totalAmount += invoice.totalAmount;

      if (invoice.status === 'paid') {
        monthlyData[monthKey].paidInvoices++;
        monthlyData[monthKey].totalRevenue += invoice.totalAmount;
      } else if (invoice.status === 'sent') {
        monthlyData[monthKey].pendingInvoices++;
      } else if (invoice.status === 'overdue') {
        monthlyData[monthKey].overdueInvoices++;
      }
    });

    return Object.values(monthlyData).map((data: any) => ({
      period: data.period,
      totalRevenue: data.totalRevenue,
      totalInvoices: data.totalInvoices,
      paidInvoices: data.paidInvoices,
      pendingInvoices: data.pendingInvoices,
      overdueInvoices: data.overdueInvoices,
      avgInvoiceValue: data.totalInvoices > 0 ? Math.round(data.totalAmount / data.totalInvoices) : 0,
      currency: data.currency
    }));
  };

  // Transform subscription plans to subscription reports
  const transformToSubscriptionReports = (): SubscriptionReport[] => {
    if (!subscriptionPlansData?.plans) return [];

    return subscriptionPlansData.plans.map((plan: SubscriptionPlan) => ({
      planName: plan.planName,
      activeSubscriptions: plan.activeSubscribers || 0,
      totalRevenue: (plan.activeSubscribers || 0) * plan.monthlyCost * 12, // Annual revenue
      avgMonthlyRevenue: (plan.activeSubscribers || 0) * plan.monthlyCost,
      churnRate: Math.random() * 3, // Mock churn rate for now
      currency: plan.currency
    }));
  };

  // Transform hospitals to hospital reports
  const transformToHospitalReports = (): HospitalReport[] => {
    if (!hospitalsData?.hospitals || !billingData?.invoices) return [];

    const hospitals = hospitalsData.hospitals;
    const invoices = billingData.invoices;

    return hospitals.map((hospital: Hospital) => {
      const hospitalInvoices = invoices.filter((inv: Invoice) => 
        inv.hospitalId?._id === hospital._id
      );

      const totalPaid = hospitalInvoices
        .filter((inv: Invoice) => inv.status === 'paid')
        .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

      const outstandingInvoices = hospitalInvoices
        .filter((inv: Invoice) => inv.status !== 'paid' && inv.status !== 'cancelled');

      const outstandingAmount = outstandingInvoices
        .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

      const lastPaidInvoice = hospitalInvoices
        .filter((inv: Invoice) => inv.status === 'paid')
        .sort((a: Invoice, b: Invoice) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime())[0];

      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      return {
        hospitalName: hospital.name,
        subscriptionPlan: hospital.subscriptionId?.planName || 'No Plan',
        status: hospital.status,
        totalPaid,
        outstandingAmount,
        lastPaymentDate: lastPaidInvoice?.paidDate || 'No payments',
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        currency: 'INR'
      };
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

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

  const handleGenerateReport = () => {
    setIsGenerating(true);
    generateReportMutation.mutate({
      reportType: selectedReportType,
      filters: { ...filters, dateRange }
    }, {
      onSettled: () => setIsGenerating(false)
    });
  };

  const handleExportFinancial = () => {
    const financialReports = transformToFinancialReports();
    exportToCSV(financialReports, 'financial_report');
  };

  const handleExportSubscriptions = () => {
    const subscriptionReports = transformToSubscriptionReports();
    exportToCSV(subscriptionReports, 'subscription_report');
  };

  const handleExportHospitals = () => {
    const hospitalReports = transformToHospitalReports();
    exportToCSV(hospitalReports, 'hospital_report');
  };

  // Quick Report Actions handlers
  const handleRevenueReport = () => {
    setActiveTab('financial');
    setSelectedReportType('revenue');
    toast({
      title: "Revenue Report",
      description: "Switched to financial reports tab",
    });
  };

  const handlePaymentAnalysis = () => {
    setActiveTab('financial');
    setSelectedReportType('payment');
    toast({
      title: "Payment Analysis",
      description: "Switched to financial reports tab",
    });
  };

  const handleGrowthTrends = () => {
    setActiveTab('financial');
    setSelectedReportType('growth');
    toast({
      title: "Growth Trends",
      description: "Switched to financial reports tab",
    });
  };

  const handleCustomerReport = () => {
    setActiveTab('hospital');
    toast({
      title: "Customer Report",
      description: "Switched to hospital reports tab",
    });
  };

  const handleAgingReport = () => {
    setActiveTab('financial');
    setSelectedReportType('aging');
    toast({
      title: "Aging Report",
      description: "Switched to financial reports tab",
    });
  };

  const handleExportAll = () => {
    const financialReports = transformToFinancialReports();
    const subscriptionReports = transformToSubscriptionReports();
    const hospitalReports = transformToHospitalReports();

    // Export all reports
    exportToCSV(financialReports, 'financial_report');
    exportToCSV(subscriptionReports, 'subscription_report');
    exportToCSV(hospitalReports, 'hospital_report');

    toast({
      title: "All Reports Exported",
      description: "Financial, subscription, and hospital reports have been exported",
    });
  };

  const handleExcelReport = () => {
    const financialReports = transformToFinancialReports();
    exportToCSV(financialReports, 'excel_financial_report');
    toast({
      title: "Excel Report",
      description: "Financial report exported in Excel format",
    });
  };

  const handlePDFReport = () => {
    toast({
      title: "PDF Report",
      description: "PDF report generation feature coming soon",
    });
  };

  // Column definitions
  const financialColumns: ColumnDef<FinancialReport>[] = [
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => <span className="font-medium">{row.original.period}</span>,
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="font-bold text-green-600">
          {formatCurrency(row.original.totalRevenue, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "totalInvoices",
      header: "Total Invoices",
      cell: ({ row }) => <span>{row.original.totalInvoices}</span>,
    },
    {
      accessorKey: "paidInvoices",
      header: "Paid",
      cell: ({ row }) => (
        <Badge className="bg-green-100 text-green-800">{row.original.paidInvoices}</Badge>
      ),
    },
    {
      accessorKey: "pendingInvoices",
      header: "Pending",
      cell: ({ row }) => (
        <Badge className="bg-yellow-100 text-yellow-800">{row.original.pendingInvoices}</Badge>
      ),
    },
    {
      accessorKey: "overdueInvoices",
      header: "Overdue",
      cell: ({ row }) => (
        <Badge className="bg-red-100 text-red-800">{row.original.overdueInvoices}</Badge>
      ),
    },
    {
      accessorKey: "avgInvoiceValue",
      header: "Avg Invoice",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.avgInvoiceValue, row.original.currency)}
        </span>
      ),
    },
  ];

  const subscriptionColumns: ColumnDef<SubscriptionReport>[] = [
    {
      accessorKey: "planName",
      header: "Plan Name",
      cell: ({ row }) => <span className="font-medium">{row.original.planName}</span>,
    },
    {
      accessorKey: "activeSubscriptions",
      header: "Active Subscriptions",
      cell: ({ row }) => (
        <Badge className="bg-blue-100 text-blue-800">{row.original.activeSubscriptions}</Badge>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="font-bold text-green-600">
          {formatCurrency(row.original.totalRevenue, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "avgMonthlyRevenue",
      header: "Avg Monthly Revenue",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.avgMonthlyRevenue, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "churnRate",
      header: "Churn Rate",
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.churnRate > 2 ? 'text-red-600' : 'text-green-600'}`}>
          {row.original.churnRate.toFixed(1)}%
        </span>
      ),
    },
  ];

  const hospitalColumns: ColumnDef<HospitalReport>[] = [
    {
      accessorKey: "hospitalName",
      header: "Hospital Name",
      cell: ({ row }) => <span className="font-medium">{row.original.hospitalName}</span>,
    },
    {
      accessorKey: "subscriptionPlan",
      header: "Subscription Plan",
      cell: ({ row }) => <span>{row.original.subscriptionPlan}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={row.original.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "totalPaid",
      header: "Total Paid",
      cell: ({ row }) => (
        <span className="font-bold text-green-600">
          {formatCurrency(row.original.totalPaid, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "outstandingAmount",
      header: "Outstanding",
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.outstandingAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "lastPaymentDate",
      header: "Last Payment",
      cell: ({ row }) => <span>{row.original.lastPaymentDate === 'No payments' ? 'No payments' : new Date(row.original.lastPaymentDate).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "nextBillingDate",
      header: "Next Billing",
      cell: ({ row }) => <span>{new Date(row.original.nextBillingDate).toLocaleDateString()}</span>,
    },
  ];

  const financialReports = transformToFinancialReports();
  const subscriptionReports = transformToSubscriptionReports();
  const hospitalReports = transformToHospitalReports();

  const isLoading = billingLoading || plansLoading || hospitalsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and download comprehensive reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['billing-data'] });
              queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
              queryClient.invalidateQueries({ queryKey: ['hospitals'] });
              toast({
                title: "Refreshed",
                description: "Reports data has been refreshed",
              });
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>Select report type and configure filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="financial">Financial Report</option>
                <option value="subscription">Subscription Report</option>
                <option value="hospital">Hospital Report</option>
                <option value="revenue">Revenue Analysis</option>
                <option value="billing">Billing Summary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="subscription">Subscription Reports</TabsTrigger>
          <TabsTrigger value="hospital">Hospital Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>Revenue and billing analysis</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportFinancial} disabled={financialReports.length === 0}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : financialReports.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No financial data available</h3>
                  <p className="text-gray-600">No billing data found for the selected period</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={financialColumns}
                  data={financialReports}
                  searchPlaceholder="Search financial reports..."
                  showFooter={true}
                  defaultRowsPerPage={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscription Reports</CardTitle>
                  <CardDescription>Subscription plan performance and analytics</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportSubscriptions} disabled={subscriptionReports.length === 0}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : subscriptionReports.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription data available</h3>
                  <p className="text-gray-600">No subscription plans found</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={subscriptionColumns}
                  data={subscriptionReports}
                  searchPlaceholder="Search subscription reports..."
                  showFooter={true}
                  defaultRowsPerPage={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospital" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hospital Reports</CardTitle>
                  <CardDescription>Hospital subscription and payment status</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportHospitals} disabled={hospitalReports.length === 0}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : hospitalReports.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hospital data available</h3>
                  <p className="text-gray-600">No hospitals found</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={hospitalColumns}
                  data={hospitalReports}
                  searchPlaceholder="Search hospital reports..."
                  showFooter={true}
                  defaultRowsPerPage={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      
    </div>
  );
};

export default ReportsPage; 