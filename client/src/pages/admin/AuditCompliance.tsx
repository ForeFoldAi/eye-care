import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
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
  Info,
  XCircle,
  Zap,
  Globe,
  Smartphone,
  Mail,
  IndianRupee,
  RefreshCw
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

const AuditCompliance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [logDetailDialogOpen, setLogDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [userTimelineDialogOpen, setUserTimelineDialogOpen] = useState(false);
  const [timelineUserId, setTimelineUserId] = useState<string | null>(null);
  
  const user = authService.getStoredUser();
  const API_URL = import.meta.env.VITE_API_URL;



  const { data: auditLogs, isLoading: logsLoading, error: logsError } = useQuery({
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
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Audit Logs API Response:', data);
      console.log('Audit logs type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Ensure we return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('Unexpected audit logs response format:', data);
        return [];
      }
    },
    enabled: !!user?.hospitalId
  });



  const { data: auditStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin', 'audit-stats', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/audit/stats/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit stats: ${response.status}`);
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
    const logs = auditLogs && Array.isArray(auditLogs) ? [...auditLogs] : [];
    if (logs.length === 0) return [];
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

  // Show loading state
  if (logsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit and compliance data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (logsError || statsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {logsError?.message || statsError?.message || 'Failed to load audit and compliance data'}
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-red-600">
                    <p>User Role: {user?.role}</p>
                    <p>User Hospital ID: {user?.hospitalId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
                {sortedLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs Found</h3>
                    <p className="text-gray-600 mb-4">
                      No audit logs are available for the selected filters. 
                      Audit logs are automatically generated when users perform actions in the system.
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>• Try adjusting your search filters</p>
                      <p>• Check if users have performed any actions recently</p>
                      <p>• Verify that audit logging is enabled</p>
                    </div>
                  </div>
                ) : (
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
                        
                        // Format screen time display
                        const formatScreenTime = (minutes: number | undefined) => {
                          if (minutes === undefined || minutes === null) return '-';
                          if (minutes < 60) return `${minutes} min`;
                          const hours = Math.floor(minutes / 60);
                          const remainingMinutes = minutes % 60;
                          return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
                        };
                        
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
                              {formatScreenTime(screenTime)}
                            </TableCell>
                            <TableCell>{log.device || '-'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {log.location && log.location !== 'Unknown' ? 
                                    log.location.split(' (')[0] : 'Unknown Location'
                                  }
                                </div>
                                <div className="text-xs text-gray-500">
                                  {log.ipAddress && log.ipAddress !== 'Unknown' ? 
                                    log.ipAddress : 'No IP'
                                  }
                                </div>
                              </div>
                            </TableCell>
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
                )}
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
                  {auditStats?.securityAlerts && auditStats.securityAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {auditStats.securityAlerts.map((alert: any) => (
                        <div key={alert.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                          alert.severity === 'high' ? 'bg-red-50' : 
                          alert.severity === 'medium' ? 'bg-yellow-50' : 'bg-green-50'
                        }`}>
                          {alert.severity === 'high' ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : alert.severity === 'medium' ? (
                            <Info className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No security alerts at this time</p>
                    </div>
                  )}
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
                      <span className="text-sm font-medium">{auditStats?.activeUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Logins (24h)</span>
                      <span className="text-sm font-medium">{auditStats?.newLogins24h || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Failed Logins</span>
                      <span className="text-sm font-medium text-red-600">{auditStats?.failedLogins || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Password Changes</span>
                      <span className="text-sm font-medium">{auditStats?.passwordChanges || 0}</span>
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
                  {auditStats?.systemHealth ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Database Status</span>
                        <Badge className={`${
                          auditStats.systemHealth.database === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {auditStats.systemHealth.database || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">API Status</span>
                        <Badge className={`${
                          auditStats.systemHealth.api === 'healthy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {auditStats.systemHealth.api || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Backup Status</span>
                        <Badge className={`${
                          auditStats.systemHealth.backup === 'current' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {auditStats.systemHealth.backup || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">SSL Certificate</span>
                        <Badge className={`${
                          auditStats.systemHealth.ssl === 'valid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {auditStats.systemHealth.ssl || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Globe className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">System health data not available</p>
                    </div>
                  )}
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