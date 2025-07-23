import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  FileText, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  Search,
  Filter,
  Download,
  Activity,
  Database,
  Lock,
  Settings,
  Users,
  ChevronRight,
  Info,
  XCircle,
  Zap,
  Globe,
  Smartphone,
  Mail,
  IndianRupee
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authService } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  location?: string; // New: location/IP
  device?: string; // New: device/browser
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
  loginTime?: string;
  logoutTime?: string;
  screenTimeMinutes?: number;
  passwordChanged?: boolean;
  failedLogin?: boolean;
  accountLocked?: boolean;
  penaltyAmount?: number; // For monetary penalties
  // Add more fields as needed
}

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: 'HIPAA' | 'GDPR' | 'SOX' | 'PCI' | 'Internal';
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  lastReview: string;
  nextReview: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const AuditCompliance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [selectedCompliance, setSelectedCompliance] = useState<string>('all');
  const [logDetailDialogOpen, setLogDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [userTimelineDialogOpen, setUserTimelineDialogOpen] = useState(false);
  const [timelineUserId, setTimelineUserId] = useState<string | null>(null);
  
  const user = authService.getStoredUser();
  const API_URL = import.meta.env.VITE_API_URL;

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', user?.hospitalId, searchTerm, selectedAction, selectedUser, selectedSeverity, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        hospitalId: user?.hospitalId || '',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedAction !== 'all' && { action: selectedAction }),
        ...(selectedUser !== 'all' && { userId: selectedUser }),
        ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });
      
      const response = await fetch(`${API_URL}/api/audit/logs?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  const { data: complianceItems, isLoading: complianceLoading } = useQuery({
    queryKey: ['admin', 'compliance', user?.hospitalId, selectedCompliance],
    queryFn: async () => {
      const params = new URLSearchParams({
        hospitalId: user?.hospitalId || '',
        ...(selectedCompliance !== 'all' && { category: selectedCompliance }),
      });
      
      const response = await fetch(`${API_URL}/api/compliance/items?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch compliance items');
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  const { data: auditStats } = useQuery({
    queryKey: ['admin', 'audit-stats', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/audit/stats/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit statistics');
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  const exportAuditReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`${API_URL}/api/audit/export`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hospitalId: user?.hospitalId,
          format,
          filters: {
            searchTerm,
            action: selectedAction,
            user: selectedUser,
            severity: selectedSeverity,
            dateRange
          }
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-report-${Date.now()}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failure': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return User;
      case 'logout': return XCircle;
      case 'create': return Zap;
      case 'update': return Settings;
      case 'delete': return XCircle;
      case 'view': return Eye;
      case 'export': return Download;
      case 'backup': return Database;
      case 'config': return Settings;
      default: return Activity;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color = 'blue' }: any) => (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Filtering/sorting state
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtering/sorting logic
  const sortedLogs = React.useMemo(() => {
    if (!auditLogs) return [];
    let logs = [...auditLogs];
    if (sortField) {
      logs.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (sortField.includes('Time') && aVal && bVal) {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }
    return logs;
  }, [auditLogs, sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit & Compliance</h1>
              <p className="text-gray-600 mt-1">Monitor system activities and ensure compliance</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => exportAuditReport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => exportAuditReport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-6">
            {/* Audit Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Events"
                value={auditStats?.totalEvents || 0}
                icon={Activity}
                color="blue"
              />
              <MetricCard
                title="Critical Events"
                value={auditStats?.criticalEvents || 0}
                icon={AlertTriangle}
                color="red"
              />
              <MetricCard
                title="Failed Logins"
                value={auditStats?.failedLogins || 0}
                icon={Lock}
                color="orange"
              />
              <MetricCard
                title="Data Exports"
                value={auditStats?.dataExports || 0}
                icon={Download}
                color="green"
              />
            </div>

            {/* Filters */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search audit logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <DatePickerWithRange
                    value={dateRange}
                    onChange={setDateRange}
                    className="w-64"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => {setSortField('timestamp'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}} className="cursor-pointer">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead onClick={() => {setSortField('loginTime'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}} className="cursor-pointer">Login Time</TableHead>
                      <TableHead onClick={() => {setSortField('logoutTime'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}} className="cursor-pointer">Logout Time</TableHead>
                      <TableHead onClick={() => {setSortField('screenTimeMinutes'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}} className="cursor-pointer">Screen Time</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location/IP</TableHead>
                      <TableHead>Password Changed</TableHead>
                      <TableHead>Failed Login</TableHead>
                      <TableHead>Account Locked</TableHead>
                      <TableHead>Penalty</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs?.map((log: AuditLog) => {
                      const ActionIcon = getActionIcon(log.action);
                      let screenTime = log.screenTimeMinutes;
                      if (!screenTime && log.loginTime && log.logoutTime) {
                        const login = new Date(log.loginTime).getTime();
                        const logout = new Date(log.logoutTime).getTime();
                        if (!isNaN(login) && !isNaN(logout) && logout > login) {
                          screenTime = Math.round((logout - login) / 60000);
                        }
                      }
                      // Suspicious activity highlight
                      const suspicious = (screenTime && (screenTime < 1 || screenTime > 480)) || (log.failedLogin && log.status === 'failure');
                      return (
                        <TableRow key={log.id} className={suspicious ? 'bg-red-50' : ''}>
                          <TableCell className="font-medium">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {setTimelineUserId(log.userId); setUserTimelineDialogOpen(true);}}>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {log.userName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm underline">{log.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <ActionIcon className="h-4 w-4 text-gray-500" />
                              <span className="capitalize">{log.action}</span>
                            </div>
                          </TableCell>
                          <TableCell>{log.resource}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.loginTime ? new Date(log.loginTime).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {log.logoutTime ? new Date(log.logoutTime).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {screenTime !== undefined ? `${screenTime} min` : '-'}
                          </TableCell>
                          <TableCell>{log.device || '-'}</TableCell>
                          <TableCell>{log.location || log.ipAddress || '-'}</TableCell>
                          <TableCell>{log.passwordChanged ? <CheckCircle className="w-4 h-4 text-green-600" /> : '-'}</TableCell>
                          <TableCell>{log.failedLogin ? <XCircle className="w-4 h-4 text-red-600" /> : '-'}</TableCell>
                          <TableCell>{log.accountLocked ? <Lock className="w-4 h-4 text-orange-600" /> : '-'}</TableCell>
                          <TableCell>{typeof log.penaltyAmount === 'number' ? (<span className="flex items-center"><IndianRupee className="w-4 h-4 mr-1 text-green-600" />{log.penaltyAmount}</span>) : '-'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => {setSelectedLog(log); setLogDetailDialogOpen(true);}}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Compliant</p>
                      <p className="text-2xl font-bold text-green-600">
                        {complianceItems?.filter((item: ComplianceItem) => item.status === 'compliant').length || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Non-Compliant</p>
                      <p className="text-2xl font-bold text-red-600">
                        {complianceItems?.filter((item: ComplianceItem) => item.status === 'non_compliant').length || 0}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Partial</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {complianceItems?.filter((item: ComplianceItem) => item.status === 'partial').length || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Review</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {complianceItems?.filter((item: ComplianceItem) => item.status === 'pending').length || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Items */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Compliance Items</CardTitle>
                    <CardDescription>Track compliance with various regulations</CardDescription>
                  </div>
                  <Select value={selectedCompliance} onValueChange={setSelectedCompliance}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="HIPAA">HIPAA</SelectItem>
                      <SelectItem value="GDPR">GDPR</SelectItem>
                      <SelectItem value="SOX">SOX</SelectItem>
                      <SelectItem value="PCI">PCI</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceItems?.map((item: ComplianceItem) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Shield className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <span className="text-xs text-gray-500">
                              Last review: {new Date(item.lastReview).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge className={getComplianceStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Next review: {new Date(item.nextReview).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Security Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Multiple failed login attempts</p>
                        <p className="text-xs text-gray-600">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Info className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">Unusual access pattern detected</p>
                        <p className="text-xs text-gray-600">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Security scan completed</p>
                        <p className="text-xs text-gray-600">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Users</span>
                      <span className="text-sm font-medium">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Logins (24h)</span>
                      <span className="text-sm font-medium">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Failed Logins</span>
                      <span className="text-sm font-medium text-red-600">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Password Changes</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database Status</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Status</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Backup Status</span>
                      <Badge className="bg-green-100 text-green-800">Current</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SSL Certificate</span>
                      <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Audit Report</h3>
                      <p className="text-sm text-gray-600">Complete audit trail</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Compliance Report</h3>
                      <p className="text-sm text-gray-600">Regulatory compliance status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Security Report</h3>
                      <p className="text-sm text-gray-600">Security incidents and alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">User Activity Report</h3>
                      <p className="text-sm text-gray-600">User behavior analysis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Data Access Report</h3>
                      <p className="text-sm text-gray-600">Data access patterns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">System Performance</h3>
                      <p className="text-sm text-gray-600">System health metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Log Detail Modal */}
      <Dialog open={logDetailDialogOpen} onOpenChange={setLogDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Full details for this log entry</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-64">{JSON.stringify(selectedLog, null, 2)}</pre>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* User Timeline Modal */}
      <Dialog open={userTimelineDialogOpen} onOpenChange={setUserTimelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Session Timeline</DialogTitle>
            <DialogDescription>Session/activity timeline for this user</DialogDescription>
          </DialogHeader>
          {/* TODO: Fetch and display timeline for timelineUserId from backend */}
          <div className="py-4 text-gray-500">Timeline feature coming soon. (Integrate with backend user session/activity API.)</div>
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

export default AuditCompliance; 