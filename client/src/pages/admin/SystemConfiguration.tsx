import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Shield, 
  Database, 
  Mail, 
  Bell, 
  Users, 
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Smartphone,
  Clock,
  FileText,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { authService } from '@/lib/auth';

interface SystemConfig {
  general: {
    hospitalName: string;
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionTimeout: number;
    twoFactorAuth: boolean;
    loginAttempts: number;
    lockoutDuration: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    paymentAlerts: boolean;
    systemAlerts: boolean;
  };
 
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: number;
    lastBackup: string;
  };
}

const SystemConfiguration: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  
  const user = authService.getStoredUser();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL;

  const [localConfig, setLocalConfig] = useState<SystemConfig>({
    general: {
      hospitalName: '',
      timezone: 'UTC',
      language: 'en',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false
      },
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttempts: 5,
      lockoutDuration: 15
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      appointmentReminders: true,
      paymentAlerts: true,
      systemAlerts: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30,
      lastBackup: ''
    }
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin', 'system-config', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/system/config/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch system configuration');
      const data = await response.json();
      setLocalConfig(data); // Initialize local state
      return data;
    },
    enabled: !!user?.hospitalId
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<SystemConfig>) => {
      const response = await fetch(`${API_URL}/api/system/config/${user?.hospitalId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-config'] });
      setHasChanges(false);
    }
  });

  const runBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/system/backup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to run backup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-config'] });
    }
  });

  const handleChange = (path: string, value: any) => {
    setLocalConfig(prev => {
      const newConfig = {...prev};
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return newConfig;
    });
  };

  const handleSave = () => {
    updateConfigMutation.mutate(localConfig);
  };

  const ConfigSection = ({ title, description, icon: Icon, children }: any) => (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-gray-500" />
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
              <p className="text-gray-600 mt-1">Manage system settings and preferences</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unsaved changes
                </Badge>
              )}
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
           
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <ConfigSection 
              title="General Settings" 
              description="Basic system configuration"
              icon={Settings}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hospitalName">Hospital Name</Label>
                  <Input
                    id="hospitalName"
                    value={localConfig.general.hospitalName}
                    onChange={(e) => handleChange('general.hospitalName', e.target.value)}
                    placeholder="Enter hospital name"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={localConfig.general.timezone} onValueChange={(value) => handleChange('general.timezone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="CST">Central Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={localConfig.general.language} onValueChange={(value) => handleChange('general.language', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={localConfig.general.currency} onValueChange={(value) => handleChange('general.currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Display Settings" 
              description="Date and time formatting"
              icon={Clock}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={localConfig.general.dateFormat} onValueChange={(value) => handleChange('general.dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={localConfig.general.timeFormat} onValueChange={(value) => handleChange('general.timeFormat', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ConfigSection>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <ConfigSection 
              title="Password Policy" 
              description="Set password requirements"
              icon={Lock}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={localConfig.security.passwordPolicy.minLength}
                    onChange={(e) => handleChange('security.passwordPolicy.minLength', parseInt(e.target.value, 10))}
                    min="6"
                    max="32"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireUppercase"
                      checked={localConfig.security.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => handleChange('security.passwordPolicy.requireUppercase', checked)}
                    />
                    <Label htmlFor="requireUppercase">Require uppercase letters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireNumbers"
                      checked={localConfig.security.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => handleChange('security.passwordPolicy.requireNumbers', checked)}
                    />
                    <Label htmlFor="requireNumbers">Require numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireSymbols"
                      checked={localConfig.security.passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) => handleChange('security.passwordPolicy.requireSymbols', checked)}
                    />
                    <Label htmlFor="requireSymbols">Require symbols</Label>
                  </div>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Session & Access Control" 
              description="Configure session timeouts and access policies"
              icon={Shield}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={localConfig.security.sessionTimeout}
                    onChange={(e) => handleChange('security.sessionTimeout', parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={localConfig.security.loginAttempts}
                    onChange={(e) => handleChange('security.loginAttempts', parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="twoFactorAuth"
                  checked={localConfig.security.twoFactorAuth}
                  onCheckedChange={(checked) => handleChange('security.twoFactorAuth', checked)}
                />
                <Label htmlFor="twoFactorAuth">Enable Two-Factor Authentication</Label>
              </div>
            </ConfigSection>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <ConfigSection 
              title="Notification Channels" 
              description="Configure how notifications are delivered"
              icon={Bell}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="emailNotifications"
                    checked={localConfig.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleChange('notifications.emailNotifications', checked)}
                  />
                  <Mail className="w-4 h-4 text-gray-500" />
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="smsNotifications"
                    checked={localConfig.notifications.smsNotifications}
                    onCheckedChange={(checked) => handleChange('notifications.smsNotifications', checked)}
                  />
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="pushNotifications"
                    checked={localConfig.notifications.pushNotifications}
                    onCheckedChange={(checked) => handleChange('notifications.pushNotifications', checked)}
                  />
                  <Bell className="w-4 h-4 text-gray-500" />
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Notification Types" 
              description="Choose which events trigger notifications"
              icon={Activity}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="appointmentReminders"
                    checked={localConfig.notifications.appointmentReminders}
                    onCheckedChange={(checked) => handleChange('notifications.appointmentReminders', checked)}
                  />
                  <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="paymentAlerts"
                    checked={localConfig.notifications.paymentAlerts}
                    onCheckedChange={(checked) => handleChange('notifications.paymentAlerts', checked)}
                  />
                  <Label htmlFor="paymentAlerts">Payment Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="systemAlerts"
                    checked={localConfig.notifications.systemAlerts}
                    onCheckedChange={(checked) => handleChange('notifications.systemAlerts', checked)}
                  />
                  <Label htmlFor="systemAlerts">System Alerts</Label>
                </div>
              </div>
            </ConfigSection>
          </TabsContent>


          <TabsContent value="backup" className="space-y-6">
            <ConfigSection 
              title="Backup Settings" 
              description="Configure automatic backups and data retention"
              icon={Database}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="autoBackup"
                    checked={localConfig.backup.autoBackup}
                    onCheckedChange={(checked) => handleChange('backup.autoBackup', checked)}
                  />
                  <Label htmlFor="autoBackup">Enable Automatic Backups</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={localConfig.backup.backupFrequency} onValueChange={(value) => handleChange('backup.backupFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      value={localConfig.backup.retentionPeriod}
                      onChange={(e) => handleChange('backup.retentionPeriod', parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection 
              title="Backup Actions" 
              description="Manual backup operations"
              icon={RefreshCw}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Last Backup</h4>
                    <p className="text-sm text-gray-600">
                      {config?.backup?.lastBackup ? 
                        new Date(config.backup.lastBackup).toLocaleString() : 
                        'Never'
                      }
                    </p>
                  </div>
                  <Button 
                    onClick={() => runBackupMutation.mutate()}
                    disabled={runBackupMutation.isPending}
                  >
                    {runBackupMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    Run Backup Now
                  </Button>
                </div>
              </div>
            </ConfigSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SystemConfiguration; 