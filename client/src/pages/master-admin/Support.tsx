import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { 
  Ticket, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Search,
  Filter,
  Plus,
  Reply,
  Archive,
  Tag,
  Mail,
  Phone,
  Video,
  FileText,
  Download,
  RefreshCw,
  MoreHorizontal,
  Star,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock3,
  AlertTriangle,
  Info,
  HelpCircle,
  BookOpen,
  Headphones,
  Settings,
  Users as UsersIcon,
  BarChart3,
  TrendingUp,
  MessageCircle,
  Zap,
  Building2,
  Loader2,
  X,
  Check,
  MessageSquare as MessageSquareIcon,
  UserPlus,
  Shield,
  Activity,
  Code,
  CreditCard,
  Save,
  Bell,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface SupportTicket {
  _id: string;
  ticketId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'training' | 'integration' | 'general';
  hospitalId?: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  slaTarget: string;
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  ticketsThisWeek: number;
  ticketsLastWeek: number;
  avgResponseTime: string;
  satisfactionScore: number;
  satisfactionCount: number;
  categoryDistribution: Array<{ _id: string; count: number }>;
  priorityDistribution: Array<{ _id: string; count: number }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium',
    tags: [] as string[]
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support statistics
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async (): Promise<{ success: boolean; stats: SupportStats }> => {
      const response = await fetch('/api/support/stats/overview', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support statistics');
      }

      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch detailed analytics
  const { data: detailedAnalytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['support-detailed-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/support/analytics/detailed', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch detailed analytics');
      }

      return response.json();
    }
  });

  // Fetch knowledge base statistics
  const { data: kbStats, isLoading: kbLoading, error: kbError } = useQuery({
    queryKey: ['knowledge-base-stats'],
    queryFn: async () => {
      const response = await fetch('/api/support/knowledge-base/stats', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch knowledge base statistics');
      }

      return response.json();
    }
  });

  // Fetch knowledge base articles
  const { data: kbArticles, isLoading: kbArticlesLoading, error: kbArticlesError } = useQuery({
    queryKey: ['knowledge-base-articles'],
    queryFn: async () => {
      const response = await fetch('/api/knowledge-base/articles', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch knowledge base articles');
      }

      return response.json();
    }
  });

  // Fetch support tickets
  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useQuery({
    queryKey: ['support-tickets', currentPage, searchQuery, filterStatus, filterPriority, filterCategory],
    queryFn: async (): Promise<{ success: boolean; tickets: SupportTicket[]; pagination: PaginationInfo }> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await fetch(`/api/support?${params}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      return response.json();
    }
  });

  // Mutations for ticket actions
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const response = await fetch(`/api/support/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      toast({
        title: "Status Updated",
        description: "Ticket status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status",
        variant: "destructive"
      });
    }
  });

  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assignedTo }: { ticketId: string; assignedTo: string }) => {
      const response = await fetch(`/api/support/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ assignedTo })
      });

      if (!response.ok) {
        throw new Error('Failed to assign ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({
        title: "Ticket Assigned",
        description: "Ticket has been assigned successfully",
      });
      setShowAssignModal(false);
      setAssignTo('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign ticket",
        variant: "destructive"
      });
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      toast({
        title: "Ticket Created",
        description: "Support ticket has been created successfully",
      });
      setShowNewTicketModal(false);
      setNewTicketData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium',
        tags: []
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive"
      });
    }
  });

  const stats = statsData?.stats || {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: '0 hours',
    satisfactionScore: 0,
    ticketsThisWeek: 0,
    ticketsLastWeek: 0,
    satisfactionCount: 0,
    categoryDistribution: [],
    priorityDistribution: []
  };

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'waiting_for_customer': return 'bg-orange-100 text-orange-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-3 h-3" />;
      case 'high': return <AlertTriangle className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <Info className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    refetchTickets();
    toast({
      title: "Refreshed",
      description: "Support data has been refreshed",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleReplyToTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowReplyModal(true);
  };

  const handleAssignTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowAssignModal(true);
  };

  const handleUpdateStatus = (ticketId: string, status: string) => {
    updateTicketStatusMutation.mutate({ ticketId, status });
  };

  const handleAssignTicketSubmit = () => {
    if (selectedTicket && assignTo) {
      assignTicketMutation.mutate({ ticketId: selectedTicket._id, assignedTo: assignTo });
    }
  };

  const handleCreateTicket = () => {
    if (newTicketData.subject && newTicketData.description && newTicketData.category) {
      createTicketMutation.mutate(newTicketData);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
    }
  };

  const handleNewTicketChange = (field: string, value: string | string[]) => {
    setNewTicketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (statsError || ticketsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Support Data</h3>
          <p className="text-gray-600 mb-4">
            {statsError?.message || ticketsError?.message || 'Failed to load support data'}
          </p>
          <Button onClick={() => window.location.reload()}>
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
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and customer inquiries</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={handleRefresh}
            disabled={ticketsLoading}
          >
            {ticketsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh</span>
          </Button>
          <Button 
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600"
            onClick={() => setShowNewTicketModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Tickets</p>
                <p className="text-2xl font-bold text-blue-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalTickets}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Open Tickets</p>
                <p className="text-2xl font-bold text-red-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.openTickets}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolved</p>
                <p className="text-2xl font-bold text-green-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.resolvedTickets}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Response</p>
                <p className="text-2xl font-bold text-purple-900">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.avgResponseTime}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto border-0">
            <TabsTrigger 
              value="tickets" 
              className="flex items-center space-x-2 px-6 py-4 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
            >
              <Ticket className="w-4 h-4" />
              <span>Tickets</span>
              {tickets.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                  {tickets.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center space-x-2 px-6 py-4 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="flex items-center space-x-2 px-6 py-4 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              <span>Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center space-x-2 px-6 py-4 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tickets, hospitals, or customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_customer">Waiting for Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => {
                      setFilterPriority(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="training">Training</option>
                    <option value="integration">Integration</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="space-y-4">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading tickets...</span>
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-600">
                    {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No support tickets have been created yet'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)} flex items-center justify-center`}>
                            {getPriorityIcon(ticket.priority)}
                          </div>
                          <span className="text-sm text-gray-500">#{ticket.ticketId}</span>
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {ticket.subject}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            {ticket.hospitalId && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-4 h-4" />
                                <span>{ticket.hospitalId.name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>
                                {ticket.assignedTo 
                                  ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                                  : 'Unassigned'
                                }
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>
                                {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>Created: {formatDate(ticket.createdAt)}</span>
                            <span>Updated: {formatDate(ticket.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleReplyToTicket(ticket)}
                        >
                          <Reply className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReplyToTicket(ticket)}>
                              <Reply className="w-4 h-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignTicket(ticket)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ticket._id, 'in_progress')}>
                              <Activity className="w-4 h-4 mr-2" />
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ticket._id, 'resolved')}>
                              <Check className="w-4 h-4 mr-2" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ticket._id, 'closed')}>
                              <Archive className="w-4 h-4 mr-2" />
                              Close Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} tickets
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Advanced Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Ticket Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading trends...</span>
                  </div>
                ) : analyticsError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-600">Failed to load ticket trends</p>
                  </div>
                ) : detailedAnalytics?.analytics ? (
                  <div className="space-y-6">
                    {/* Weekly Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">This Week</span>
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.ticketsThisWeek}
                        </p>
                        <p className="text-xs text-blue-600">tickets created</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">Last Week</span>
                          <BarChart3 className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {stats.ticketsLastWeek}
                        </p>
                        <p className="text-xs text-green-600">tickets created</p>
                      </div>
                    </div>

                    {/* Trend Visualization */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Weekly Growth</span>
                        <span className={`text-sm font-medium ${
                          stats.ticketsThisWeek > stats.ticketsLastWeek ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stats.ticketsLastWeek > 0 
                            ? `${Math.round(((stats.ticketsThisWeek - stats.ticketsLastWeek) / stats.ticketsLastWeek) * 100)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            stats.ticketsThisWeek > stats.ticketsLastWeek ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(
                              stats.ticketsLastWeek > 0 
                                ? (stats.ticketsThisWeek / stats.ticketsLastWeek) * 100 
                                : 0, 
                              100
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No trend data available</p>
                    <p className="text-sm text-gray-500">Create some tickets to see trends</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response Time Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Response Time Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading response times...</span>
                  </div>
                ) : analyticsError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-600">Failed to load response time data</p>
                  </div>
                ) : detailedAnalytics?.analytics?.responseTimeByPriority ? (
                  <div className="space-y-6">
                    {/* Average Response Time */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Average Response Time</span>
                        <span className="text-sm font-medium">
                          {stats.avgResponseTime}
                        </span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Target: 4 hours</p>
                    </div>

                    {/* Priority Response Times */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {detailedAnalytics.analytics.responseTimeByPriority.map((item: any) => {
                        const hours = Math.round((item.avgResponseTime / (1000 * 60 * 60)) * 10) / 10;
                        const colorMap: any = {
                          critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', value: 'text-red-900' },
                          high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', value: 'text-orange-900' },
                          medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', value: 'text-yellow-900' },
                          low: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', value: 'text-green-900' }
                        };
                        const colors = colorMap[item._id] || colorMap.medium;
                        
                        return (
                          <div key={item._id} className={`${colors.bg} p-3 rounded-lg`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                              <span className={`font-medium ${colors.text} capitalize`}>{item._id}</span>
                            </div>
                            <p className={`${colors.value} font-semibold`}>{hours} hours</p>
                            <p className={`text-xs ${colors.text}`}>Target: {item._id === 'critical' ? '2' : item._id === 'high' ? '4' : item._id === 'medium' ? '8' : '24'} hours</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No response time data available</p>
                    <p className="text-sm text-gray-500">Resolve some tickets to see response times</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Category Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading categories...</span>
                  </div>
                ) : stats.categoryDistribution && stats.categoryDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {stats.categoryDistribution.map((category: any) => {
                      const percentage = Math.round((category.count / stats.totalTickets) * 100);
                      const colorMap: any = {
                        technical: 'bg-blue-500',
                        billing: 'bg-green-500',
                        feature_request: 'bg-purple-500',
                        bug_report: 'bg-red-500',
                        training: 'bg-yellow-500',
                        integration: 'bg-indigo-500',
                        general: 'bg-gray-500'
                      };
                      
                      return (
                        <div key={category._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${colorMap[category._id] || 'bg-gray-500'}`}></div>
                            <span className="text-sm capitalize">{category._id.replace('_', ' ')}</span>
                          </div>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No category data available</p>
                    <p className="text-sm text-gray-500">Create tickets with categories to see distribution</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Satisfaction Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Customer Satisfaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading satisfaction...</span>
                  </div>
                ) : stats.satisfactionCount > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {stats.satisfactionScore}/5
                      </div>
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-5 h-5 ${
                              star <= Math.floor(stats.satisfactionScore) 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">Based on {stats.satisfactionCount} responses</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No satisfaction data available</p>
                    <p className="text-sm text-gray-500">Customer ratings will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading metrics...</span>
                  </div>
                ) : detailedAnalytics?.analytics?.performanceMetrics ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">First Response Rate</span>
                        <span className="text-sm font-medium text-green-600">
                          {Math.round(detailedAnalytics.analytics.performanceMetrics.firstResponseRate * 100)}%
                        </span>
                      </div>
                      <Progress value={detailedAnalytics.analytics.performanceMetrics.firstResponseRate * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Resolution Rate</span>
                        <span className="text-sm font-medium text-blue-600">
                          {Math.round(detailedAnalytics.analytics.performanceMetrics.resolutionRate * 100)}%
                        </span>
                      </div>
                      <Progress value={detailedAnalytics.analytics.performanceMetrics.resolutionRate * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">SLA Compliance</span>
                        <span className="text-sm font-medium text-purple-600">
                          {Math.round(detailedAnalytics.analytics.performanceMetrics.slaCompliance * 100)}%
                        </span>
                      </div>
                      <Progress value={detailedAnalytics.analytics.performanceMetrics.slaCompliance * 100} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No performance data available</p>
                    <p className="text-sm text-gray-500">Performance metrics will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          {/* Knowledge Base Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
              <p className="text-gray-600 mt-1">Manage help articles and documentation for customers</p>
            </div>
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
              <Plus className="w-4 h-4" />
              <span>Add Article</span>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search articles, categories, or keywords..."
                    className="pl-10"
                  />
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="all">All Categories</option>
                  <option value="getting-started">Getting Started</option>
                  <option value="features">Features</option>
                  <option value="troubleshooting">Troubleshooting</option>
                  <option value="api">API Documentation</option>
                  <option value="billing">Billing & Payments</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kbLoading ? (
              // Loading state for categories
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : kbError ? (
              // Error state
              <div className="col-span-full text-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Error loading knowledge base</h3>
                <p className="text-gray-600 mb-6">{kbError.message}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : kbStats?.stats?.categories && kbStats.stats.categories.length > 0 ? (
              // Real data from MongoDB
              kbStats.stats.categories.map((category: any, index: number) => {
                const iconMap: any = {
                  'Getting Started': BookOpen,
                  'Features & How-to': Settings,
                  'Troubleshooting': AlertTriangle,
                  'API Documentation': Code,
                  'Billing & Payments': CreditCard,
                  'Security & Privacy': Shield
                };
                const IconComponent = iconMap[category.name] || BookOpen;
                
                const colorMap: any = {
                  'Getting Started': { bg: 'bg-blue-100', icon: 'text-blue-600', hover: 'group-hover:bg-blue-200' },
                  'Features & How-to': { bg: 'bg-green-100', icon: 'text-green-600', hover: 'group-hover:bg-green-200' },
                  'Troubleshooting': { bg: 'bg-red-100', icon: 'text-red-600', hover: 'group-hover:bg-red-200' },
                  'API Documentation': { bg: 'bg-purple-100', icon: 'text-purple-600', hover: 'group-hover:bg-purple-200' },
                  'Billing & Payments': { bg: 'bg-yellow-100', icon: 'text-yellow-600', hover: 'group-hover:bg-yellow-200' },
                  'Security & Privacy': { bg: 'bg-indigo-100', icon: 'text-indigo-600', hover: 'group-hover:bg-indigo-200' }
                };
                const colors = colorMap[category.name] || colorMap['Getting Started'];
                
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.hover} transition-colors`}>
                          <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {category.name === 'Getting Started' && 'Essential guides to get you up and running quickly'}
                            {category.name === 'Features & How-to' && 'Detailed guides for all platform features'}
                            {category.name === 'Troubleshooting' && 'Solutions for common issues and problems'}
                            {category.name === 'API Documentation' && 'Complete API reference and integration guides'}
                            {category.name === 'Billing & Payments' && 'Information about billing, invoices, and payments'}
                            {category.name === 'Security & Privacy' && 'Security best practices and privacy information'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{category.count} articles</span>
                            <Button variant="ghost" size="sm" className={`${colors.icon} hover:${colors.icon.replace('text-', 'text-').replace('-600', '-700')}`} onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                              View All
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              // Empty state
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No knowledge base categories found</h3>
                <p className="text-gray-600 mb-6">Create your first knowledge base category to get started</p>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              </div>
            )}
          </div>

          {/* Knowledge Base Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Knowledge Base Articles</span>
              </CardTitle>
              <CardDescription>
                Browse and manage help articles for customers and staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kbArticlesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : kbArticlesError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-gray-600">Failed to load knowledge base articles</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : kbArticles?.articles && kbArticles.articles.length > 0 ? (
                <div className="space-y-4">
                  {kbArticles.articles.map((article: any) => {
                    const iconMap: any = {
                      'How to Set Up Your First Hospital': Building2,
                      'Managing User Permissions and Roles': UsersIcon,
                      'Troubleshooting Login Issues': AlertTriangle,
                      'API Authentication Guide': Code,
                      'Understanding Your Bill and Payment Options': CreditCard,
                      'Security Best Practices for Healthcare Data': Shield
                    };
                    const IconComponent = iconMap[article.title] || FileText;
                    
                    const categoryMap: any = {
                      'getting-started': { name: 'Getting Started', color: 'bg-blue-100 text-blue-700' },
                      'features': { name: 'Features & How-to', color: 'bg-green-100 text-green-700' },
                      'troubleshooting': { name: 'Troubleshooting', color: 'bg-red-100 text-red-700' },
                      'api': { name: 'API Documentation', color: 'bg-purple-100 text-purple-700' },
                      'billing': { name: 'Billing & Payments', color: 'bg-yellow-100 text-yellow-700' },
                      'security': { name: 'Security & Privacy', color: 'bg-indigo-100 text-indigo-700' }
                    };
                    const category = categoryMap[article.category] || { name: 'General', color: 'bg-gray-100 text-gray-700' };
                    
                    return (
                      <div key={article._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <IconComponent className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{article.title}</h4>
                            <Badge className={`text-xs ${category.color}`}>
                              {category.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {article.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>By {article.author.firstName} {article.author.lastName}</span>
                            <span>•</span>
                            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{article.rating}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No knowledge base articles available</p>
                  <p className="text-sm text-gray-500">Create your first article to get started</p>
                  <Button className="mt-4" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Article
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Most Popular Articles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kbArticlesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : kbArticlesError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-gray-600">Failed to load popular articles</p>
                </div>
              ) : kbArticles?.articles && kbArticles.articles.length > 0 ? (
                <div className="space-y-4">
                  {kbArticles.articles
                    .sort((a: any, b: any) => b.views - a.views)
                    .slice(0, 3)
                    .map((article: any, index: number) => {
                      const iconMap: any = {
                        'How to Set Up Your First Hospital': Building2,
                        'Managing User Permissions and Roles': UsersIcon,
                        'Troubleshooting Login Issues': AlertTriangle,
                        'API Authentication Guide': Code,
                        'Understanding Your Bill and Payment Options': CreditCard,
                        'Security Best Practices for Healthcare Data': Shield
                      };
                      const IconComponent = iconMap[article.title] || FileText;
                      
                      return (
                        <div key={article._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{article.title}</h4>
                            <p className="text-sm text-gray-500">#{index + 1} Most Popular</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{article.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span>{article.rating}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/master-admin/knowledge-base' })}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No popular articles available</p>
                  <p className="text-sm text-gray-500">Articles will appear here as they gain views</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Base Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {kbLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : kbStats?.stats?.totalArticles || 0}
                </p>
                <p className="text-sm text-blue-700">Total Articles</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {kbLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : kbStats?.stats?.totalViews ? `${(kbStats.stats.totalViews / 1000).toFixed(1)}K` : '0'}
                </p>
                <p className="text-sm text-green-700">Total Views</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {kbLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : kbStats?.stats?.avgRating || '0'}
                </p>
                <p className="text-sm text-purple-700">Avg Rating</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {kbLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : kbStats?.stats?.successRate ? `${Math.round(kbStats.stats.successRate * 100)}%` : '0%'}
                </p>
                <p className="text-sm text-orange-700">Success Rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Settings Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Support Settings</h2>
              <p className="text-gray-600 mt-1">Configure support system preferences and automation rules</p>
            </div>
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600" onClick={() => navigate({ to: '/master-admin/settings' })}>
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </Button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Response Time SLA</span>
                </CardTitle>
                <CardDescription>
                  Set target response times for different ticket priorities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-700">Critical Priority</span>
                    </div>
                    <Input type="text" defaultValue="2 hours" className="w-24 text-center" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-orange-700">High Priority</span>
                    </div>
                    <Input type="text" defaultValue="4 hours" className="w-24 text-center" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-700">Medium Priority</span>
                    </div>
                    <Input type="text" defaultValue="8 hours" className="w-24 text-center" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">Low Priority</span>
                    </div>
                    <Input type="text" defaultValue="24 hours" className="w-24 text-center" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto-Assignment Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Auto-Assignment Rules</span>
                </CardTitle>
                <CardDescription>
                  Configure automatic ticket assignment and routing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Auto-Assignment</p>
                      <p className="text-sm text-gray-600">Automatically assign tickets to available agents</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-assign" className="rounded" defaultChecked />
                      <label htmlFor="auto-assign" className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Round-Robin Assignment</p>
                      <p className="text-sm text-gray-600">Distribute tickets evenly among agents</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="round-robin" className="rounded" defaultChecked />
                      <label htmlFor="round-robin" className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Skill-Based Assignment</p>
                      <p className="text-sm text-gray-600">Assign based on agent expertise</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="skill-based" className="rounded" />
                      <label htmlFor="skill-based" className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Load Balancing</p>
                      <p className="text-sm text-gray-600">Consider current workload</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="load-balancing" className="rounded" defaultChecked />
                      <label htmlFor="load-balancing" className="text-sm">Active</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure email and in-app notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Ticket Alerts</p>
                      <p className="text-sm text-gray-600">Notify when new tickets are created</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="new-ticket" className="rounded" defaultChecked />
                      <label htmlFor="new-ticket" className="text-sm">Email</label>
                      <input type="checkbox" id="new-ticket-app" className="rounded" defaultChecked />
                      <label htmlFor="new-ticket-app" className="text-sm">In-App</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SLA Breach Alerts</p>
                      <p className="text-sm text-gray-600">Alert when tickets exceed SLA time</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sla-breach" className="rounded" defaultChecked />
                      <label htmlFor="sla-breach" className="text-sm">Email</label>
                      <input type="checkbox" id="sla-breach-app" className="rounded" defaultChecked />
                      <label htmlFor="sla-breach-app" className="text-sm">In-App</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Customer Replies</p>
                      <p className="text-sm text-gray-600">Notify when customers respond</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="customer-reply" className="rounded" defaultChecked />
                      <label htmlFor="customer-reply" className="text-sm">Email</label>
                      <input type="checkbox" id="customer-reply-app" className="rounded" defaultChecked />
                      <label htmlFor="customer-reply-app" className="text-sm">In-App</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Reports</p>
                      <p className="text-sm text-gray-600">Send daily support summary</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="daily-reports" className="rounded" />
                      <label htmlFor="daily-reports" className="text-sm">Email</label>
                      <input type="checkbox" id="daily-reports-app" className="rounded" />
                      <label htmlFor="daily-reports-app" className="text-sm">In-App</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5" />
                  <span>Team Management</span>
                </CardTitle>
                <CardDescription>
                  Manage support team members and roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ticketsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : ticketsError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-600">Failed to load team data</p>
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-4">
                    {/* Get unique assigned agents from tickets */}
                    {(() => {
                      const agents = new Map();
                      tickets.forEach(ticket => {
                        if (ticket.assignedTo) {
                          const agentId = ticket.assignedTo._id;
                          if (!agents.has(agentId)) {
                            agents.set(agentId, {
                              ...ticket.assignedTo,
                              ticketsAssigned: tickets.filter(t => t.assignedTo?._id === agentId).length,
                              ticketsResolved: tickets.filter(t => t.assignedTo?._id === agentId && ['resolved', 'closed'].includes(t.status)).length
                            });
                          }
                        }
                      });
                      
                      const agentList = Array.from(agents.values());
                      
                      if (agentList.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">No team members assigned</p>
                            <p className="text-sm text-gray-500">Assign tickets to see team members here</p>
                          </div>
                        );
                      }
                      
                      return agentList.map((agent: any) => {
                        const status = agent.ticketsResolved > 0 ? 'Online' : 'Busy';
                        const statusColor = status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
                        
                        return (
                          <div key={agent._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {agent.firstName[0]}{agent.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{agent.firstName} {agent.lastName}</p>
                                <p className="text-sm text-gray-600">Support Agent</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={statusColor}>{status}</Badge>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No team data available</p>
                    <p className="text-sm text-gray-500">Create tickets and assign them to see team members</p>
                  </div>
                )}
                
                <Button variant="outline" className="w-full" onClick={() => navigate({ to: '/master-admin/users' })}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automation Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Automation Rules</span>
                </CardTitle>
                <CardDescription>
                  Set up automated workflows and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Close Resolved</p>
                      <p className="text-sm text-gray-600">Close tickets after 7 days of resolution</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-close" className="rounded" defaultChecked />
                      <label htmlFor="auto-close" className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Escalation Rules</p>
                      <p className="text-sm text-gray-600">Escalate tickets after SLA breach</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="escalation" className="rounded" defaultChecked />
                      <label htmlFor="escalation" className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Customer Satisfaction</p>
                      <p className="text-sm text-gray-600">Send satisfaction survey after resolution</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="satisfaction" className="rounded" defaultChecked />
                      <label htmlFor="satisfaction" className="text-sm">Active</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Knowledge Base Suggestions</p>
                      <p className="text-sm text-gray-600">Suggest articles based on ticket content</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="kb-suggestions" className="rounded" />
                      <label htmlFor="kb-suggestions" className="text-sm">Active</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="w-5 h-5" />
                  <span>Integrations</span>
                </CardTitle>
                <CardDescription>
                  Connect with external tools and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Slack Integration</p>
                        <p className="text-sm text-gray-600">Send notifications to Slack</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Email Integration</p>
                        <p className="text-sm text-gray-600">Create tickets from emails</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Zapier</p>
                        <p className="text-sm text-gray-600">Automate workflows</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Connected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Analytics</p>
                        <p className="text-sm text-gray-600">Google Analytics integration</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Modal */}
      <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Ticket className="w-5 h-5" />
              <span>Ticket Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedTicket.subject}</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Ticket Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket ID:</span>
                        <span className="font-medium">#{selectedTicket.ticketId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{formatDate(selectedTicket.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updated:</span>
                        <span>{formatDate(selectedTicket.updatedAt)}</span>
                      </div>
                      {selectedTicket.hospitalId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hospital:</span>
                          <span>{selectedTicket.hospitalId.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">People</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Created by:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {selectedTicket.createdBy.firstName[0]}{selectedTicket.createdBy.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedTicket.createdBy.firstName} {selectedTicket.createdBy.lastName}</span>
                        </div>
                      </div>
                      {selectedTicket.assignedTo && (
                        <div>
                          <span className="text-gray-600">Assigned to:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {selectedTicket.assignedTo.firstName[0]}{selectedTicket.assignedTo.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{selectedTicket.assignedTo.firstName} {selectedTicket.assignedTo.lastName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowTicketDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowTicketDetails(false);
                  handleReplyToTicket(selectedTicket);
                }}>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
            <DialogDescription>
              Send a response to {selectedTicket?.createdBy.firstName} {selectedTicket?.createdBy.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your response..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowReplyModal(false);
                setReplyMessage('');
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle reply logic here
                toast({
                  title: "Reply Sent",
                  description: "Your reply has been sent successfully",
                });
                setShowReplyModal(false);
                setReplyMessage('');
              }}>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Assign this ticket to a support agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign to</label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent1">John Doe (Technical)</SelectItem>
                  <SelectItem value="agent2">Jane Smith (Billing)</SelectItem>
                  <SelectItem value="agent3">Mike Johnson (General)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowAssignModal(false);
                setAssignTo('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignTicketSubmit}
                disabled={!assignTo || assignTicketMutation.isPending}
              >
                {assignTicketMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Ticket Modal */}
      <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for a customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Brief description of the issue"
                value={newTicketData.subject}
                onChange={(e) => handleNewTicketChange('subject', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Detailed description of the issue..."
                value={newTicketData.description}
                onChange={(e) => handleNewTicketChange('description', e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newTicketData.category} onValueChange={(value) => handleNewTicketChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTicketData.priority} onValueChange={(value) => handleNewTicketChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTicket}
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportPage; 