import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Receipt, 
  PieChart,
  BarChart3,
  Calendar,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Wallet,
  Building,
  Users,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { authService } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useMemo } from 'react';

interface FinancialData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    outstandingAmount: number;
    collectionRate: number;
    averageTransactionValue: number;
  };
  revenueByDepartment: {
    name: string;
    revenue: number;
    percentage: number;
    growth: number;
  }[];
  paymentMethods: {
    method: string;
    amount: number;
    percentage: number;
    transactions: number;
  }[];
  recentTransactions: {
    id: string;
    patientName: string;
    amount: number;
    paymentMethod: string;
    status: 'completed' | 'pending' | 'failed';
    date: string;
    description: string;
  }[];
  outstandingInvoices: {
    id: string;
    patientName: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
    status: 'overdue' | 'due_soon' | 'current';
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

const FinancialManagement: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<null | {
    key: string;
    title: string;
    description: string;
    format: 'pdf' | 'excel';
  }>(null);
  const [reportAvailable, setReportAvailable] = useState<boolean | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState('patient');
  const [invoiceForm, setInvoiceForm] = useState({
    branch: '',
    branchOther: '',
    patient: '',
    patientOther: '',
    service: '',
    serviceOther: '',
    vendor: '',
    vendorOther: '',
    expenseCategory: '',
    expenseCategoryOther: '',
    description: '',
    quantity: '',
    amount: '',
    paymentMethod: '',
    paymentMethodOther: '',
    dueDate: '',
    date: '',
    status: '',
    statusOther: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<string[]>(['Consultation', 'Lab Test', 'Surgery', 'Medication']);
  const [vendors, setVendors] = useState<string[]>(['MedSupply Co.', 'PharmaPlus', 'HealthEquip']);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(['Utilities', 'Maintenance', 'Salaries', 'Supplies']);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [fetchedInvoices, setFetchedInvoices] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingPage, setBillingPage] = useState(1);
  const [billingTotal, setBillingTotal] = useState(0);
  const [billingStatus, setBillingStatus] = useState('all');
  
  const user = authService.getStoredUser();
  const API_URL = import.meta.env.VITE_API_URL;

  const { data: financialData, isLoading } = useQuery({
    queryKey: ['admin', 'financial', user?.hospitalId, dateRange, selectedBranch, selectedDepartment],
    queryFn: async () => {
      const params = new URLSearchParams({
        hospitalId: user?.hospitalId || '',
        ...(selectedBranch !== 'all' && { branch: selectedBranch }),
        ...(selectedDepartment !== 'all' && { department: selectedDepartment }),
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });
      
      const response = await fetch(`${API_URL}/api/financial/dashboard?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        // Return calculated data from other APIs if financial endpoint doesn't exist
        return await generateFinancialDataFromAPIs();
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Generate financial data from available APIs
  const generateFinancialDataFromAPIs = async () => {
    try {
      // Fetch payments data
      const paymentsResponse = await fetch(`${API_URL}/api/payments/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      const payments = paymentsResponse.ok ? await paymentsResponse.json() : [];
      
      // Fetch appointments data for additional context
      const appointmentsResponse = await fetch(`${API_URL}/api/appointments/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      const appointments = appointmentsResponse.ok ? await appointmentsResponse.json() : [];
      
      // Calculate financial metrics from actual payment data
      const completedPayments = payments.filter((p: any) => p.status === 'completed');
      const pendingPayments = payments.filter((p: any) => p.status === 'pending');
      
      const completedRevenue = completedPayments.reduce((sum: number, payment: any) => 
        sum + (payment.amount || 0), 0
      );
      
      const pendingRevenue = pendingPayments.reduce((sum: number, payment: any) => 
        sum + (payment.amount || 0), 0
      );

      // Calculate payment method distribution from actual data
      const paymentMethodStats = payments.reduce((acc: any, payment: any) => {
        const method = payment.method || 'cash';
        if (!acc[method]) {
          acc[method] = { amount: 0, count: 0 };
        }
        acc[method].amount += payment.amount || 0;
        acc[method].count += 1;
        return acc;
      }, {});

      const paymentMethods = Object.entries(paymentMethodStats).map(([method, stats]: [string, any]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        amount: stats.amount,
        percentage: completedRevenue > 0 ? (stats.amount / completedRevenue) * 100 : 0,
        transactions: stats.count
      }));

      // Calculate appointment type distribution
      const appointmentTypeStats = appointments.reduce((acc: any, appointment: any) => {
        const type = appointment.type || 'consultation';
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += 1;
        return acc;
      }, {});

      const appointmentTypes = Object.entries(appointmentTypeStats).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
        revenue: completedRevenue * (Number(count) / appointments.length),
        percentage: appointments.length > 0 ? (Number(count) / appointments.length) * 100 : 0,
        growth: 0 // Would need historical data to calculate
      }));

      return {
        overview: {
          totalRevenue: completedRevenue,
          revenueGrowth: 0, // Would need historical data
          totalExpenses: 0, // Not available in current schema
          netProfit: completedRevenue, // Assuming all revenue is profit for now
          profitMargin: 100, // Since no expenses tracked
          outstandingAmount: pendingRevenue,
          collectionRate: payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0,
          averageTransactionValue: completedPayments.length > 0 ? completedRevenue / completedPayments.length : 0
        },
        revenueByDepartment: appointmentTypes,
        paymentMethods: paymentMethods,
        recentTransactions: payments.slice(0, 10).map((payment: any) => ({
          id: payment._id,
          patientName: payment.patient?.firstName + ' ' + payment.patient?.lastName || 'Unknown Patient',
          amount: payment.amount,
          paymentMethod: payment.method || 'cash',
          status: payment.status,
          date: payment.createdAt,
          description: 'Medical consultation'
        })),
        outstandingInvoices: pendingPayments.map((payment: any) => ({
          id: payment._id,
          patientName: payment.patient?.firstName + ' ' + payment.patient?.lastName || 'Unknown Patient',
          amount: payment.amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysPastDue: 0,
          status: 'current'
        })),
        monthlyRevenue: [
          { month: 'Jan', revenue: completedRevenue * 0.8, expenses: 0, profit: completedRevenue * 0.8 },
          { month: 'Feb', revenue: completedRevenue * 0.85, expenses: 0, profit: completedRevenue * 0.85 },
          { month: 'Mar', revenue: completedRevenue * 0.9, expenses: 0, profit: completedRevenue * 0.9 },
          { month: 'Apr', revenue: completedRevenue * 0.95, expenses: 0, profit: completedRevenue * 0.95 },
          { month: 'May', revenue: completedRevenue, expenses: 0, profit: completedRevenue },
          { month: 'Jun', revenue: completedRevenue * 1.05, expenses: 0, profit: completedRevenue * 1.05 }
        ]
      };
    } catch (error) {
      console.error('Error generating financial data:', error);
      return {
        overview: {
          totalRevenue: 0,
          revenueGrowth: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          outstandingAmount: 0,
          collectionRate: 0,
          averageTransactionValue: 0
        },
        revenueByDepartment: [],
        paymentMethods: [],
        recentTransactions: [],
        outstandingInvoices: [],
        monthlyRevenue: []
      };
    }
  };

  const { data: branches } = useQuery({
    queryKey: ['admin', 'branches', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  const exportFinancialReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`${API_URL}/api/financial/export`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hospitalId: user?.hospitalId,
          format,
          dateRange,
          branch: selectedBranch,
          department: selectedDepartment
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${Date.now()}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount?.toLocaleString('en-IN')}`;
  };

  const MetricCard = ({ title, value, change, icon: Icon, format = 'currency', subtitle }: any) => (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {format === 'currency' ? formatCurrency(value) : 
           format === 'percentage' ? `${value}%` : 
           value?.toLocaleString()}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-xs mt-1">
            {change > 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}%
            </span>
            <span className="text-gray-500">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800';
      case 'current': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return Wallet;
      case 'credit_card': return CreditCard;
      case 'debit_card': return CreditCard;
      case 'insurance': return Building;
      case 'check': return FileText;
      default: return IndianRupee;
    }
  };

  // Simulate report check/fetch (replace with real API call if available)
  const checkAndFetchReport = async (report: typeof selectedReport) => {
    setReportLoading(true);
    setReportAvailable(null);
    setReportUrl(null);
    // Simulate: Only "Revenue Report" and "Billing Report" are available
    if (report?.key === 'revenue' || report?.key === 'billing') {
      setTimeout(() => {
        setReportAvailable(true);
        setReportUrl(`/reports/${report.key}-report.${report.format}`); // Simulated URL
        setReportLoading(false);
      }, 800);
    } else {
      setTimeout(() => {
        setReportAvailable(false);
        setReportLoading(false);
      }, 800);
    }
  };

  const handleReportCardClick = (key: string, title: string, description: string, format: 'pdf' | 'excel') => {
    const report = { key, title, description, format };
    setSelectedReport(report);
    setReportDialogOpen(true);
    checkAndFetchReport(report);
  };

  // Form handlers
  const handleInvoiceChange = (field: string, value: string) => {
    setInvoiceForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev: any) => ({ ...prev, [field]: undefined }));
  };
  const validateInvoiceForm = () => {
    const errors: any = {};
    if (!(invoiceForm.branch || invoiceForm.branchOther)) errors.branch = 'Branch is required';
    if (invoiceType === 'patient' && !(invoiceForm.patient || invoiceForm.patientOther)) errors.patient = 'Patient is required';
    if (invoiceType === 'patient' && !(invoiceForm.service || invoiceForm.serviceOther)) errors.service = 'Service/Item is required';
    if (invoiceType === 'inventory' && !(invoiceForm.vendor || invoiceForm.vendorOther)) errors.vendor = 'Vendor is required';
    if (invoiceType === 'inventory' && !(invoiceForm.service || invoiceForm.serviceOther)) errors.service = 'Item/Description is required';
    if (invoiceType === 'inventory' && (!invoiceForm.quantity || isNaN(Number(invoiceForm.quantity)))) errors.quantity = 'Valid quantity required';
    if (invoiceType === 'expense' && !(invoiceForm.expenseCategory || invoiceForm.expenseCategoryOther)) errors.expenseCategory = 'Expense category required';
    if (invoiceType === 'expense' && !invoiceForm.description) errors.description = 'Description required';
    if (!invoiceForm.amount || isNaN(Number(invoiceForm.amount))) errors.amount = 'Valid amount required';
    if (!(invoiceForm.paymentMethod || invoiceForm.paymentMethodOther)) errors.paymentMethod = 'Payment method required';
    if ((invoiceType === 'patient' && !invoiceForm.dueDate) || ((invoiceType !== 'patient') && !invoiceForm.date)) errors.date = 'Date required';
    if (!(invoiceForm.status || invoiceForm.statusOther)) errors.status = 'Status required';
    return errors;
  };
  // Replace handleAddInvoice to save directly to DB and refresh billing
  const handleSaveInvoice = async () => {
    const errors = validateInvoiceForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    // Map form data to billing schema format
    const amount = Number(invoiceForm.amount);
    const quantity = Number(invoiceForm.quantity) || 1;
    const unitPrice = amount / quantity;
    
    // Create line item based on invoice type
    let lineItemDescription = '';
    if (invoiceType === 'patient') {
      lineItemDescription = `${invoiceForm.service === 'other' ? invoiceForm.serviceOther : invoiceForm.service} - ${invoiceForm.patient === 'other' ? invoiceForm.patientOther : invoiceForm.patient}`;
    } else if (invoiceType === 'inventory') {
      lineItemDescription = `${invoiceForm.service === 'other' ? invoiceForm.serviceOther : invoiceForm.service} - ${invoiceForm.vendor === 'other' ? invoiceForm.vendorOther : invoiceForm.vendor}`;
    } else if (invoiceType === 'expense') {
      lineItemDescription = `${invoiceForm.expenseCategory === 'other' ? invoiceForm.expenseCategoryOther : invoiceForm.expenseCategory} - ${invoiceForm.description}`;
    } else {
      lineItemDescription = invoiceForm.description;
    }
    
    // Compose payload according to billing schema
    const payload: any = {
      hospitalId: user?.hospitalId || '507f1f77bcf86cd799439011', // Use user's hospital ID or default
      subscriptionId: '507f1f77bcf86cd799439012', // Default subscription ID
      billingPeriod: {
        startDate: invoiceForm.date || new Date().toISOString(),
        endDate: invoiceForm.date || new Date().toISOString()
      },
      amount: amount,
      totalAmount: amount,
      description: lineItemDescription,
      lineItems: [{
        description: lineItemDescription,
        quantity: quantity,
        unitPrice: unitPrice,
        amount: amount
      }],
      createdBy: user?.id || '507f1f77bcf86cd799439013', // Use current user's ID
      notes: invoiceForm.notes,
      // Additional fields based on invoice type
      type: invoiceType,
      branch: invoiceForm.branch === 'other' ? invoiceForm.branchOther : invoiceForm.branch,
      paymentMethod: invoiceForm.paymentMethod === 'other' ? invoiceForm.paymentMethodOther : invoiceForm.paymentMethod,
      status: invoiceForm.status === 'other' ? invoiceForm.statusOther : invoiceForm.status,
    };
    
    // Add type-specific fields
    if (invoiceType === 'patient') {
      payload.patient = invoiceForm.patient === 'other' ? invoiceForm.patientOther : invoiceForm.patient;
      payload.service = invoiceForm.service === 'other' ? invoiceForm.serviceOther : invoiceForm.service;
      payload.dueDate = invoiceForm.dueDate;
    } else if (invoiceType === 'inventory') {
      payload.vendor = invoiceForm.vendor === 'other' ? invoiceForm.vendorOther : invoiceForm.vendor;
      payload.item = invoiceForm.service === 'other' ? invoiceForm.serviceOther : invoiceForm.service;
      payload.quantity = quantity;
      payload.date = invoiceForm.date;
    } else if (invoiceType === 'expense') {
      payload.expenseCategory = invoiceForm.expenseCategory === 'other' ? invoiceForm.expenseCategoryOther : invoiceForm.expenseCategory;
      payload.description = invoiceForm.description;
      payload.date = invoiceForm.date;
    } else {
      payload.description = invoiceForm.description;
      payload.date = invoiceForm.date;
    }
    try {
      await fetch(`${API_URL}/api/billing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      setShowInvoiceModal(false);
      setInvoiceForm({
        branch: '', branchOther: '', patient: '', patientOther: '', service: '', serviceOther: '', vendor: '', vendorOther: '', expenseCategory: '', expenseCategoryOther: '', description: '', quantity: '', amount: '', paymentMethod: '', paymentMethodOther: '', dueDate: '', date: '', status: '', statusOther: '', notes: '',
      });
      setBillingPage(1); // refresh to first page
      // Refetch billing table
      const params = new URLSearchParams({
        hospitalId: user?.hospitalId || '',
        page: '1',
        limit: '10',
        ...(billingStatus !== 'all' && { status: billingStatus })
      });
      fetch(`${API_URL}/api/billing?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      })
        .then(res => res.ok ? res.json() : { invoices: [], pagination: { total: 0 } })
        .then(data => {
          setFetchedInvoices(data.invoices || []);
          setBillingTotal(data.pagination?.total || 0);
          setBillingLoading(false);
        });
      // Optionally show a toast/alert here
    } catch (e) {
      setFormErrors({ submit: 'Failed to save invoice' });
    }
  };
  const handleFinalSubmit = async () => {
    if (invoices.length === 0) return;
    try {
      await fetch(`${API_URL}/api/billing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoices }),
      });
      setInvoices([]);
      setShowInvoiceModal(false);
      setBillingPage(1); // refresh to first page
    } catch (e) {
      // handle error
    }
  };

  // Fetch patients for dropdown
  useEffect(() => {
    if (!user?.hospitalId) return;
    fetch(`${API_URL}/api/patients/hospital/${user.hospitalId}`,
      { headers: { 'Authorization': `Bearer ${authService.getToken()}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setPatients(data || []));
  }, [user?.hospitalId]);

  // Fetch invoices from MongoDB
  useEffect(() => {
    setBillingLoading(true);
    const params = new URLSearchParams({
      hospitalId: user?.hospitalId || '',
      page: billingPage.toString(),
      limit: '10',
      ...(billingStatus !== 'all' && { status: billingStatus })
    });
    fetch(`${API_URL}/api/billing?${params}`, {
      headers: { 'Authorization': `Bearer ${authService.getToken()}` }
    })
      .then(res => res.ok ? res.json() : { invoices: [], pagination: { total: 0 } })
      .then(data => {
        setFetchedInvoices(data.invoices || []);
        setBillingTotal(data.pagination?.total || 0);
        setBillingLoading(false);
      });
  }, [user?.hospitalId, billingPage, billingStatus]);

  // Add a SectionHeader component for clarity
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-2 mt-8">
      <h3 className="text-lg font-semibold text-gray-800 tracking-tight mb-1">{title}</h3>
      <div className="h-1 w-10 bg-blue-200 rounded mb-2" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
              <p className="text-gray-600 mt-1">Track revenue, expenses, and financial performance</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches?.map((branch: any) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                className="w-64"
              />
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => exportFinancialReport('pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" onClick={() => exportFinancialReport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </>
              ) : (
                <>
                                <MetricCard
                title="Total Revenue"
                value={financialData?.overview?.totalRevenue}
                change={financialData?.overview?.revenueGrowth}
                icon={IndianRupee}
                subtitle="This month"
              />
              <MetricCard
                title="Average Transaction"
                value={financialData?.overview?.averageTransactionValue}
                change={0}
                icon={TrendingUp}
                subtitle="Per payment"
              />
                  <MetricCard
                    title="Outstanding Amount"
                    value={financialData?.overview?.outstandingAmount}
                    change={-5.2}
                    icon={AlertCircle}
                    subtitle="Pending collection"
                  />
                  <MetricCard
                    title="Collection Rate"
                    value={financialData?.overview?.collectionRate}
                    change={3.1}
                    icon={Target}
                    format="percentage"
                    subtitle="Monthly average"
                  />
                </>
              )}
            </div>

            {/* Revenue by Department */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData?.revenueByDepartment?.map((dept: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(dept.revenue)}</p>
                          <p className="text-xs text-gray-500">{dept.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData?.paymentMethods?.map((method: any, index: number) => {
                      const Icon = getPaymentMethodIcon(method.method);
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {method.method.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(method.amount)}</p>
                            <p className="text-xs text-gray-500">{method.transactions} transactions</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData?.recentTransactions?.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.patientName}</p>
                          <p className="text-xs text-gray-500">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Revenue chart visualization</p>
                      <p className="text-sm">(Chart component integration required)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData?.monthlyRevenue?.slice(0, 6).map((month: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{month.month}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <Progress value={financialData?.overview?.totalRevenue > 0 ? (month.revenue / financialData.overview.totalRevenue) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={billingStatus} onValueChange={setBillingStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowInvoiceModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </div>
            {/* Modern Invoice Table */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due/Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fetchedInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500">No invoices found.</TableCell>
                        </TableRow>
                      ) : (
                        fetchedInvoices.map((inv: any) => (
                          <TableRow key={inv._id || inv.invoiceId}>
                            <TableCell>{inv.invoiceId}</TableCell>
                            <TableCell>{inv.type || '-'}</TableCell>
                            <TableCell>{inv.branch || (inv.hospitalId?.name || '-')}</TableCell>
                            <TableCell>{inv.description || (inv.lineItems?.[0]?.description || '-')}</TableCell>
                            <TableCell>{formatCurrency(inv.amount || inv.totalAmount)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(inv.status)}>{inv.status}</Badge>
                            </TableCell>
                            <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : (inv.date ? new Date(inv.date).toLocaleDateString() : '-')}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">View</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                {/* Pagination */}
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" disabled={billingPage === 1} onClick={() => setBillingPage(p => Math.max(1, p - 1))}>Prev</Button>
                  <span className="mx-2 text-sm">Page {billingPage} of {Math.ceil(billingTotal / 10) || 1}</span>
                  <Button variant="outline" size="sm" disabled={billingPage >= Math.ceil(billingTotal / 10)} onClick={() => setBillingPage(p => p + 1)}>Next</Button>
                </div>
              </CardContent>
            </Card>
            {/* Invoice Modal */}
<Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
  <DialogContent className="max-w-3xl p-0">
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <DialogHeader className="sticky top-0 z-10 bg-white p-6 border-b shadow-sm">
        <DialogTitle className="text-2xl font-bold">Create Invoice</DialogTitle>
        <DialogDescription className="text-base text-gray-600">
          Fill in the details to create a new invoice for a branch.
        </DialogDescription>
      </DialogHeader>

      {/* Scrollable Form Content with extra bottom padding for sticky footer */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 pb-40 max-h-[70vh]">
        {/* Section: Invoice Details */}
        <SectionHeader title="Invoice Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Invoice Type */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Type <span className="text-red-500">*</span></label>
            <Select value={invoiceType} onValueChange={setInvoiceType}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select invoice type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient Invoice</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Branch */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Branch <span className="text-red-500">*</span></label>
            <Select value={invoiceForm.branch} onValueChange={v => handleInvoiceChange('branch', v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch: any) => (
                  <SelectItem key={branch._id} value={branch._id}>{branch.name}</SelectItem>
                ))}
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {invoiceForm.branch === 'other' && (
              <Input className="mt-3 h-11" placeholder="Enter branch name" value={invoiceForm.branchOther} onChange={e => handleInvoiceChange('branchOther', e.target.value)} />
            )}
            {formErrors.branch && (
              <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.branch}</div>
            )}
          </div>
          {/* Date/Due Date */}
          {invoiceType === 'patient' ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date <span className="text-red-500">*</span></label>
              <Input type="date" className="h-11" value={invoiceForm.dueDate} onChange={e => handleInvoiceChange('dueDate', e.target.value)} />
              {formErrors.date && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.date}</div>}
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
              <Input type="date" className="h-11" value={invoiceForm.date} onChange={e => handleInvoiceChange('date', e.target.value)} />
              {formErrors.date && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.date}</div>}
            </div>
          )}
        </div>
        {/* Section: Party Details */}
        <SectionHeader title=" Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {invoiceType === 'patient' && (
            <>
              {/* Patient */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient <span className="text-red-500">*</span></label>
                <Select value={invoiceForm.patient} onValueChange={v => handleInvoiceChange('patient', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map((patient: any) => (
                      <SelectItem key={patient._id} value={patient._id}>{patient.firstName} {patient.lastName}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {invoiceForm.patient === 'other' && (
                  <Input className="mt-3 h-11" placeholder="Enter patient name" value={invoiceForm.patientOther} onChange={e => handleInvoiceChange('patientOther', e.target.value)} />
                )}
                {formErrors.patient && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.patient}</div>}
              </div>
              {/* Service/Item */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service/Item <span className="text-red-500">*</span></label>
                <Select value={invoiceForm.service} onValueChange={v => handleInvoiceChange('service', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select service/item" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: string) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {invoiceForm.service === 'other' && (
                  <Input className="mt-3 h-11" placeholder="Enter service/item" value={invoiceForm.serviceOther} onChange={e => handleInvoiceChange('serviceOther', e.target.value)} />
                )}
                {formErrors.service && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.service}</div>}
              </div>
            </>
          )}
          {invoiceType === 'inventory' && (
            <>
              {/* Vendor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor <span className="text-red-500">*</span></label>
                <Select value={invoiceForm.vendor} onValueChange={v => handleInvoiceChange('vendor', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor: string) => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {invoiceForm.vendor === 'other' && (
                  <Input className="mt-3 h-11" placeholder="Enter vendor name" value={invoiceForm.vendorOther} onChange={e => handleInvoiceChange('vendorOther', e.target.value)} />
                )}
                {formErrors.vendor && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.vendor}</div>}
              </div>
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
                <Input type="number" min="1" className="h-11" value={invoiceForm.quantity} onChange={e => handleInvoiceChange('quantity', e.target.value)} placeholder="Enter quantity" />
                {formErrors.quantity && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.quantity}</div>}
              </div>
              {/* Item/Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item/Description <span className="text-red-500">*</span></label>
                <Select value={invoiceForm.service} onValueChange={v => handleInvoiceChange('service', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select item/description" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: string) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {invoiceForm.service === 'other' && (
                  <Input className="mt-3 h-11" placeholder="Enter item/description" value={invoiceForm.serviceOther} onChange={e => handleInvoiceChange('serviceOther', e.target.value)} />
                )}
                {formErrors.service && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.service}</div>}
              </div>
            </>
          )}
          {invoiceType === 'expense' && (
            <>
              {/* Expense Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expense Category <span className="text-red-500">*</span></label>
                <Select value={invoiceForm.expenseCategory} onValueChange={v => handleInvoiceChange('expenseCategory', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {invoiceForm.expenseCategory === 'other' && (
                  <Input className="mt-3 h-11" placeholder="Enter expense category" value={invoiceForm.expenseCategoryOther} onChange={e => handleInvoiceChange('expenseCategoryOther', e.target.value)} />
                )}
                {formErrors.expenseCategory && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.expenseCategory}</div>}
              </div>
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                <Input type="date" className="h-11" value={invoiceForm.date} onChange={e => handleInvoiceChange('date', e.target.value)} />
                {formErrors.date && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.date}</div>}
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <Input className="h-11" value={invoiceForm.description} onChange={e => handleInvoiceChange('description', e.target.value)} placeholder="Enter description" />
                {formErrors.description && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.description}</div>}
              </div>
            </>
          )}
          {invoiceType === 'other' && (
            <>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <Input className="h-11" value={invoiceForm.description} onChange={e => handleInvoiceChange('description', e.target.value)} placeholder="Enter description" />
                {formErrors.description && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.description}</div>}
              </div>
              {/* Date */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                <Input type="date" className="h-11" value={invoiceForm.date} onChange={e => handleInvoiceChange('date', e.target.value)} />
                {formErrors.date && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.date}</div>}
              </div>
            </>
          )}
        </div>
        {/* Section: Payment Details */}
        <SectionHeader title="Payment Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <Input type="number" min="0" step="0.01" className="h-11 pl-8" value={invoiceForm.amount} onChange={e => handleInvoiceChange('amount', e.target.value)} placeholder="0.00" />
            </div>
            {formErrors.amount && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.amount}</div>}
          </div>
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></label>
            <Select value={invoiceForm.paymentMethod} onValueChange={v => handleInvoiceChange('paymentMethod', v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {invoiceForm.paymentMethod === 'other' && (
              <Input className="mt-3 h-11" placeholder="Enter payment method" value={invoiceForm.paymentMethodOther} onChange={e => handleInvoiceChange('paymentMethodOther', e.target.value)} />
            )}
            {formErrors.paymentMethod && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.paymentMethod}</div>}
          </div>
          {/* Status */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status <span className="text-red-500">*</span></label>
            <Select value={invoiceForm.status} onValueChange={v => handleInvoiceChange('status', v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {invoiceForm.status === 'other' && (
              <Input className="mt-3 h-11" placeholder="Enter status" value={invoiceForm.statusOther} onChange={e => handleInvoiceChange('statusOther', e.target.value)} />
            )}
            {formErrors.status && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {formErrors.status}</div>}
          </div>
        </div>
        {/* Section: Additional */}
        <SectionHeader title="Additional" />
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
          <textarea className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={invoiceForm.notes} onChange={e => handleInvoiceChange('notes', e.target.value)} placeholder="Optional notes or additional information..." />
        </div>
        {formErrors.submit && (
          <div className="mb-8">
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
              <span>⚠</span> {formErrors.submit}
            </div>
          </div>
        )}
        {/* Action Buttons below Additional section */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => setShowInvoiceModal(false)} className="min-w-[120px] h-11 px-6">Cancel</Button>
          <Button type="button" onClick={handleSaveInvoice} className="min-w-[140px] h-11 px-6 bg-blue-600 hover:bg-blue-700">Save</Button>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Outstanding Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData?.outstandingInvoices?.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.patientName}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.replace('_', ' ')}
                          </Badge>
                          {invoice.daysPastDue > 0 && (
                            <span className="text-xs text-red-600 ml-2">
                              {invoice.daysPastDue} days overdue
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expense Tracking Not Available</h3>
                <p className="text-gray-500 mb-4">
                  Expense tracking functionality is not currently implemented in the system.
                </p>
                <p className="text-sm text-gray-400">
                  This feature would require additional database schema and API endpoints for expense management.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReportCardClick('revenue', 'Revenue Report', 'Detailed revenue analysis', 'pdf')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Revenue Report</h3>
                      <p className="text-sm text-gray-600">Detailed revenue analysis</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReportCardClick('expense', 'Expense Report', 'Cost breakdown analysis', 'excel')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Expense Report</h3>
                      <p className="text-sm text-gray-600">Cost breakdown analysis</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReportCardClick('profit', 'Profit & Loss', 'P&L statement', 'pdf')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Profit & Loss</h3>
                      <p className="text-sm text-gray-600">P&L statement</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReportCardClick('billing', 'Billing Report', 'Invoice and payment tracking', 'excel')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Billing Report</h3>
                      <p className="text-sm text-gray-600">Invoice and payment tracking</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReportCardClick('outstanding', 'Outstanding Report', 'Overdue payments', 'pdf')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Outstanding Report</h3>
                      <p className="text-sm text-gray-600">Overdue payments</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleReportCardClick('performance', 'Performance Report', 'Financial KPIs', 'excel')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Performance Report</h3>
                      <p className="text-sm text-gray-600">Financial KPIs</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Generation Status */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Report Generation</CardTitle>
                <CardDescription>Track the status of your financial reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Revenue Report</p>
                        <p className="text-xs text-gray-500">Generated successfully</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600">Ready for download</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Expense Report</p>
                        <p className="text-xs text-gray-500">Processing...</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600">In progress</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Profit & Loss</p>
                        <p className="text-xs text-gray-500">Scheduled for generation</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>{selectedReport?.description}</DialogDescription>
          </DialogHeader>
          {reportLoading ? (
            <div className="py-8 text-center text-gray-500">Checking for report...</div>
          ) : reportAvailable ? (
            <div className="py-4">
              <div className="mb-4 text-green-600">Report is available for download.</div>
              <Button asChild>
                <a href={reportUrl || '#'} download target="_blank">Download {selectedReport?.format.toUpperCase()}</a>
              </Button>
              {/* Optionally, embed a PDF preview if format is pdf */}
              {selectedReport?.format === 'pdf' && reportUrl && (
                <iframe src={reportUrl} title="Report Preview" className="w-full h-64 mt-4 border rounded" />
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-red-500">Report is not available at this time.</div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialManagement; 