import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  Save, 
  AlertCircle, 
  X,
  Check,
  Plus,
  Minus,
  Building2,
  Users,
  FileText,
  Shield,
  Zap,
  Star,
  DollarSign,
  Calendar,
  Clock,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const subscriptionSchema = z.object({
  // Basic Information
  planName: z.string().min(1, 'Plan name is required'),
  planType: z.string().min(1, 'Plan type is required'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  
  // Pricing
  monthlyCost: z.number().min(0, 'Monthly cost must be 0 or greater'),
  yearlyCost: z.number().min(0, 'Yearly cost must be 0 or greater'),
  currency: z.string().default('INR'),
  trialDays: z.number().min(0, 'Trial days must be 0 or greater').default(0),
  
  // Limits
  maxUsers: z.number().min(1, 'Max users must be at least 1'),
  maxBranches: z.number().min(1, 'Max branches must be at least 1'),
  maxPatients: z.number().min(0, 'Max patients must be 0 or greater'),
  maxStorage: z.number().min(1, 'Max storage must be at least 1 GB'),
  
  // Features
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  
  // Settings
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  autoRenew: z.boolean().default(true),
  
  // Billing
  billingCycle: z.string().min(1, 'Billing cycle is required'),
  gracePeriod: z.number().min(0, 'Grace period must be 0 or greater').default(7),
  
  // Additional
  setupFee: z.number().min(0, 'Setup fee must be 0 or greater').default(0),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

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

interface SubscriptionFormProps {
  subscription?: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

const availableFeatures = [
  // Core Healthcare Management
  'Patient Management',
  'Appointment Scheduling',
  'Prescription Management',
  'Payment Processing',
  'Receipt Generation',
  
  // Staff & User Management
  'Staff Management',
  'Role-Based Access Control',
  'Multi-Hospital Support',
  'Multi-Branch Support',
  'Department Management',
  
  // Medical Records
  'Electronic Health Records (EHR)',
  'Medical History Tracking',
  'Vital Signs Monitoring',
  'Allergy Management',
  'Medication History',
  
  // Analytics & Reporting
  'Analytics Dashboard',
  'Financial Reports',
  'Patient Statistics',
  'Staff Performance Reports',
  'Revenue Tracking',
  
  // Communication & Support
  'Real-Time Chat System',
  'In-App Notifications',
  'Support Ticket System',
  'Priority Support',
  
  // System Features
  'Multi-Tenant Architecture',
  'Data Backup & Recovery',
  'API Access',
  'Custom Integrations',
  'Advanced Security'
];

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ subscription, onSuccess, onCancel }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(subscription?.features || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    mode: 'onChange',
    defaultValues: {
      planName: subscription?.planName || '',
      planType: subscription?.planType || '',
      description: subscription?.description || '',
      monthlyCost: subscription?.monthlyCost || 0,
      yearlyCost: subscription?.yearlyCost || 0,
      currency: subscription?.currency || 'INR',
      trialDays: subscription?.trialDays || 0,
      maxUsers: subscription?.maxUsers || 10,
      maxBranches: subscription?.maxBranches || 1,
      maxPatients: subscription?.maxPatients || 1000,
      maxStorage: subscription?.maxStorage || 10,
      features: subscription?.features || [],
      isActive: subscription?.isActive ?? true,
      isPopular: subscription?.isPopular ?? false,
      isCustom: subscription?.isCustom ?? false,
      autoRenew: subscription?.autoRenew ?? true,
      billingCycle: subscription?.billingCycle || 'monthly',
      gracePeriod: subscription?.gracePeriod || 7,
      setupFee: subscription?.setupFee || 0,
      notes: subscription?.notes || ''
    }
  });

  // Update features when selectedFeatures changes
  useEffect(() => {
    setValue('features', selectedFeatures);
  }, [selectedFeatures, setValue]);

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription plan');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Subscription plan created successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'subscription-plans'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const response = await fetch(`${API_URL}/api/master-admin/subscription-plans/${subscription?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subscription plan');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Subscription plan updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'subscription-plans'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: SubscriptionFormData) => {
    if (subscription) {
      updateSubscriptionMutation.mutate(data);
    } else {
      createSubscriptionMutation.mutate(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: watch('currency') || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      <Card className="shadow-none border-0">
        <CardHeader className="border-b border-gray-200">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {subscription ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              {subscription ? 'Update subscription plan details' : 'Create a new subscription plan for hospitals'}
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <div className="flex items-center mb-6">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600">Plan details and description</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="planName">Plan Name *</Label>
                    <Input
                      id="planName"
                      {...register('planName')}
                      placeholder="e.g., Basic Plan, Premium Plan"
                      className={errors.planName ? 'border-red-500' : ''}
                    />
                    {errors.planName && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.planName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="planType">Plan Type *</Label>
                    <Select value={watch('planType')} onValueChange={(value) => setValue('planType', value)}>
                      <SelectTrigger className={errors.planType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.planType && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.planType.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe the plan features and benefits..."
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    {watch('description')?.length || 0}/500 characters
                  </p>
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div>
                <div className="flex items-center mb-6">
                  <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pricing & Billing</h3>
                    <p className="text-sm text-gray-600">Set pricing and billing options</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyCost">Monthly Cost *</Label>
                    <Input
                      id="monthlyCost"
                      type="number"
                      {...register('monthlyCost', { valueAsNumber: true })}
                      placeholder="5000"
                      min="0"
                      className={errors.monthlyCost ? 'border-red-500' : ''}
                    />
                    {errors.monthlyCost && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.monthlyCost.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearlyCost">Yearly Cost</Label>
                    <Input
                      id="yearlyCost"
                      type="number"
                      {...register('yearlyCost', { valueAsNumber: true })}
                      placeholder="50000"
                      min="0"
                      className={errors.yearlyCost ? 'border-red-500' : ''}
                    />
                    {errors.yearlyCost && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.yearlyCost.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={watch('currency')} onValueChange={(value) => setValue('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Trial Days</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      {...register('trialDays', { valueAsNumber: true })}
                      placeholder="30"
                      min="0"
                      className={errors.trialDays ? 'border-red-500' : ''}
                    />
                    {errors.trialDays && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.trialDays.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setupFee">Setup Fee</Label>
                    <Input
                      id="setupFee"
                      type="number"
                      {...register('setupFee', { valueAsNumber: true })}
                      placeholder="0"
                      min="0"
                      className={errors.setupFee ? 'border-red-500' : ''}
                    />
                    {errors.setupFee && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.setupFee.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle *</Label>
                    <Select value={watch('billingCycle')} onValueChange={(value) => setValue('billingCycle', value)}>
                      <SelectTrigger className={errors.billingCycle ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.billingCycle && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.billingCycle.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Preview */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-medium ml-2">{formatCurrency(watch('monthlyCost') || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Yearly:</span>
                      <span className="font-medium ml-2">{formatCurrency(watch('yearlyCost') || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Setup Fee:</span>
                      <span className="font-medium ml-2">{formatCurrency(watch('setupFee') || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Limits */}
              <div>
                <div className="flex items-center mb-6">
                  <Settings className="w-6 h-6 text-purple-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Usage Limits</h3>
                    <p className="text-sm text-gray-600">Set usage limits for the plan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Max Users *</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      {...register('maxUsers', { valueAsNumber: true })}
                      placeholder="10"
                      min="1"
                      className={errors.maxUsers ? 'border-red-500' : ''}
                    />
                    {errors.maxUsers && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.maxUsers.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBranches">Max Branches *</Label>
                    <Input
                      id="maxBranches"
                      type="number"
                      {...register('maxBranches', { valueAsNumber: true })}
                      placeholder="1"
                      min="1"
                      className={errors.maxBranches ? 'border-red-500' : ''}
                    />
                    {errors.maxBranches && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.maxBranches.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPatients">Max Patients</Label>
                    <Input
                      id="maxPatients"
                      type="number"
                      {...register('maxPatients', { valueAsNumber: true })}
                      placeholder="1000"
                      min="0"
                      className={errors.maxPatients ? 'border-red-500' : ''}
                    />
                    {errors.maxPatients && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.maxPatients.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStorage">Max Storage (GB) *</Label>
                    <Input
                      id="maxStorage"
                      type="number"
                      {...register('maxStorage', { valueAsNumber: true })}
                      placeholder="10"
                      min="1"
                      className={errors.maxStorage ? 'border-red-500' : ''}
                    />
                    {errors.maxStorage && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.maxStorage.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <div className="flex items-center mb-6">
                  <Zap className="w-6 h-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Features</h3>
                    <p className="text-sm text-gray-600">Select features included in this plan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={feature}
                        checked={selectedFeatures.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                      />
                      <Label htmlFor={feature} className="text-sm font-medium cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>

                {errors.features && (
                  <p className="text-sm text-red-500 flex items-center mt-2">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.features.message}
                  </p>
                )}

                <div className="mt-4">
                  <Badge variant="secondary" className="text-sm">
                    {selectedFeatures.length} features selected
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div>
                <div className="flex items-center mb-6">
                  <Shield className="w-6 h-6 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Plan Settings</h3>
                    <p className="text-sm text-gray-600">Configure plan behavior and status</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Active Plan</p>
                        <p className="text-sm text-gray-600">Make this plan available for new subscriptions</p>
                      </div>
                    </div>
                    <Switch
                      checked={watch('isActive')}
                      onCheckedChange={(checked) => setValue('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">Popular Plan</p>
                        <p className="text-sm text-gray-600">Mark as recommended plan</p>
                      </div>
                    </div>
                    <Switch
                      checked={watch('isPopular')}
                      onCheckedChange={(checked) => setValue('isPopular', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Auto Renew</p>
                        <p className="text-sm text-gray-600">Enable automatic renewal for subscriptions</p>
                      </div>
                    </div>
                    <Switch
                      checked={watch('autoRenew')}
                      onCheckedChange={(checked) => setValue('autoRenew', checked)}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    {...register('gracePeriod', { valueAsNumber: true })}
                    placeholder="7"
                    min="0"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of days after expiry before suspending the account
                  </p>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Any additional notes or special instructions..."
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {watch('notes')?.length || 0}/1000 characters
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-8 border-t border-gray-200 mt-8">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {subscription ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {subscription ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default SubscriptionForm; 