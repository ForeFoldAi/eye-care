import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Settings, 
  Save,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  Globe,
  Calendar,
  AlertCircle,
  CheckCircle,
  User,
  Shield,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface BranchFormData {
  // Basic Information
  branchName: string;
  hospitalId: string;
  branchType: 'main' | 'sub';
  branchCode?: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  
  // Location Details
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  googleMapLink?: string;
  
  // Operational Settings
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  maxDailyAppointments?: number;
  defaultLanguage?: string;
  
  // Branch Admin Setup
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone: string;
  
  // Status and Activation
  isActive: boolean;
  activationDate?: string;
}

const BranchForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = authService.getStoredUser();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL;

  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [hasMainBranch, setHasMainBranch] = useState(false);
  const [mainBranchInfo, setMainBranchInfo] = useState<{ id: string; name: string; email: string } | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    branchName: '',
    hospitalId: user?.hospitalId || '',
    branchType: 'sub',
    branchCode: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    country: '',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    googleMapLink: '',
    workingDays: [],
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    timezone: 'UTC',
    maxDailyAppointments: undefined,
    defaultLanguage: 'en',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    isActive: true,
    activationDate: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = useMemo(() => [
    {
      title: 'Basic Information',
      description: 'Essential branch details',
      icon: Building2,
      fields: ['branchName', 'hospitalId', 'branchType', 'branchCode', 'email', 'phoneNumber', 'alternatePhone']
    },
    {
      title: 'Location Details',
      description: 'Address and location',
      icon: MapPin,
      fields: ['country', 'state', 'city', 'addressLine1', 'addressLine2', 'postalCode', 'googleMapLink']
    },
    {
      title: 'Operational Settings',
      description: 'Working hours and settings',
      icon: Clock,
      fields: ['workingDays', 'workingHoursStart', 'workingHoursEnd', 'timezone', 'maxDailyAppointments', 'defaultLanguage']
    },
    {
      title: 'Branch Admin Setup',
      description: 'Sub-admin credentials',
      icon: Shield,
      fields: ['adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword', 'adminPhone']
    },
    {
      title: 'Review & Submit',
      description: 'Final review and activation',
      icon: CheckCircle,
      fields: ['isActive', 'activationDate']
    }
  ], []);

  const { data: hospitals, error: hospitalsError } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const token = authService.getToken();
      
      const response = await fetch(`${API_URL}/api/hospitals/my-hospitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch hospitals' }));
        throw new Error(errorData.message || 'Failed to fetch hospitals');
      }
      
      return response.json();
    }
  });

  // Check if main branch exists for the selected hospital
  const { data: mainBranchData } = useQuery({
    queryKey: ['main-branch', formData.hospitalId],
    queryFn: async () => {
      if (!formData.hospitalId) return null;
      
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/api/branches/check-main-branch/${formData.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check main branch status');
      }
      
      return response.json();
    },
    enabled: !!formData.hospitalId
  });

  // Update main branch status when data changes
  React.useEffect(() => {
    if (mainBranchData) {
      setHasMainBranch(mainBranchData.hasMainBranch);
      setMainBranchInfo(mainBranchData.mainBranch);
    }
  }, [mainBranchData]);

  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const requestData = {
        ...data,
        createdBy: user?.id,
        hospitalId: data.hospitalId || user?.hospitalId
      };
      
      const response = await fetch(`${API_URL}/api/branches`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create branch');
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: `Branch created successfully. Admin login: ${formData.adminEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      navigate({ to: '/admin/dashboard' });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const countries = useMemo(() => [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'IN', label: 'India' },
    { value: 'AU', label: 'Australia' },
  ], []);

  const timezones = useMemo(() => [
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Time (EST)' },
    { value: 'PST', label: 'Pacific Time (PST)' },
    { value: 'CST', label: 'Central Time (CST)' },
    { value: 'MST', label: 'Mountain Time (MST)' },
  ], []);

  const languages = useMemo(() => [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ], []);

  const weekDays = useMemo(() => [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ], []);

  const handleInputChange = useCallback((field: keyof BranchFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleWorkingDayChange = useCallback((day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      workingDays: checked 
        ? [...prev.workingDays, day]
        : prev.workingDays.filter(d => d !== day)
    }));
  }, []);

  const validateStep = useCallback((stepIndex: number) => {
    const newErrors: Record<string, string> = {};
    const stepFields = steps[stepIndex].fields;

    stepFields.forEach(field => {
      const value = formData[field as keyof BranchFormData];
      
      switch (field) {
        case 'branchName':
          if (!value || (value as string).trim() === '') newErrors.branchName = 'Branch name is required';
          break;
        case 'hospitalId':
          if (!value) newErrors.hospitalId = 'Hospital selection is required';
          break;
        case 'branchType':
          if (!value) newErrors.branchType = 'Branch type is required';
          break;
        case 'email':
        case 'adminEmail':
          if (!value || (value as string).trim() === '') {
            newErrors[field] = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
            newErrors[field] = 'Invalid email format';
          }
          break;
        case 'phoneNumber':
        case 'adminPhone':
          if (!value || (value as string).trim() === '') {
            newErrors[field] = 'Phone number is required';
          } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(value as string)) {
            newErrors[field] = 'Invalid phone number format';
          }
          break;
        case 'adminPassword':
          if (!value || (value as string).length < 8) {
            newErrors.adminPassword = 'Password must be at least 8 characters';
          } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value as string)) {
            newErrors.adminPassword = 'Password must contain uppercase, lowercase, and number';
          }
          break;
        case 'adminFirstName':
        case 'adminLastName':
          if (!value || (value as string).trim() === '') {
            newErrors[field] = 'This field is required';
          }
          break;
        case 'country':
        case 'state':
        case 'city':
        case 'addressLine1':
        case 'postalCode':
        case 'timezone':
          if (!value || (value as string).trim() === '') {
            newErrors[field] = 'This field is required';
          }
          break;
        case 'workingDays':
          if ((value as string[]).length === 0) {
            newErrors.workingDays = 'At least one working day is required';
          }
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [steps, formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [validateStep, currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate all steps, not just current step
    let allValid = true;
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        allValid = false;
      }
    }
    
    if (allValid) {
      createBranchMutation.mutate(formData);
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields in all steps.",
        variant: "destructive",
      });
    }
  }, [validateStep, currentStep, createBranchMutation, formData, errors, steps.length, toast]);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('adminPassword', password);
  }, [handleInputChange]);

  const StepIndicator = useMemo(() => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-300 shadow-lg
              ${index <= currentStep 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white shadow-blue-200' 
                : 'bg-white border-gray-200 text-gray-400 shadow-gray-100'
              }
              ${index === currentStep ? 'scale-110 ring-4 ring-blue-100' : ''}
            `}>
              {index < currentStep ? (
                <Check className="h-6 w-6" />
              ) : (
                <step.icon className="h-6 w-6" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                h-2 w-20 mx-4 transition-all duration-300 rounded-full
                ${index < currentStep 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                  : 'bg-gray-200'
                }
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          {steps[currentStep].title}
        </h2>
        <p className="text-gray-600 text-lg">{steps[currentStep].description}</p>
      </div>
      <div className="relative">
        <Progress 
          value={((currentStep + 1) / steps.length) * 100} 
          className="h-3 bg-gray-100 rounded-full overflow-hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
             style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  ), [steps, currentStep]);

  const EnhancedInput = useCallback((props: React.ComponentProps<typeof Input>) => (
    <Input
      {...props}
      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300"
    />
  ), []);



  const FormField = useCallback(({ label, required, error, children }: any) => (
    <div className="space-y-3">
      <Label className="text-base font-semibold text-gray-800 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-2 text-lg">*</span>}
      </Label>
      <div className="relative">
        {children}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  ), []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Branch Name" required error={errors.branchName}>
                <EnhancedInput
                  value={formData.branchName}
                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                  placeholder="e.g., City Eye Center"
                />
              </FormField>
              
              <FormField label="Hospital (Parent)" required error={errors.hospitalId}>
                <Select value={formData.hospitalId} onValueChange={(value) => handleInputChange('hospitalId', value)}>
                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    {hospitals?.map((hospital: any) => (
                      <SelectItem key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Branch Type" required error={errors.branchType}>
                <Select 
                  value={formData.branchType} 
                  onValueChange={(value) => handleInputChange('branchType', value)}
                  disabled={hasMainBranch}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
                    <SelectValue placeholder="Select branch type" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    <SelectItem value="main" disabled={hasMainBranch}>
                      Main Branch {hasMainBranch && `(Already exists: ${mainBranchInfo?.name})`}
                    </SelectItem>
                    <SelectItem value="sub">Sub Branch</SelectItem>
                  </SelectContent>
                </Select>
                {hasMainBranch && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Main branch already exists: <strong>{mainBranchInfo?.name}</strong> ({mainBranchInfo?.email})
                      </span>
                    </div>
                  </div>
                )}
              </FormField>
              
              <FormField label="Branch Code / ID" error={errors.branchCode}>
                <EnhancedInput
                  value={formData.branchCode}
                  onChange={(e) => handleInputChange('branchCode', e.target.value)}
                  placeholder="Optional unique identifier"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Email Address" required error={errors.email}>
                <EnhancedInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="branch@hospital.com"
                />
              </FormField>
              
              <FormField label="Phone Number" required error={errors.phoneNumber}>
                <EnhancedInput
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Alternate Phone" error={errors.alternatePhone}>
                <EnhancedInput
                  value={formData.alternatePhone}
                  onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                  placeholder="+1 (555) 987-6543"
                />
              </FormField>
            </div>


          </div>
        );

      case 1: // Location Details
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Country" required error={errors.country}>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="State / Province" required error={errors.state}>
                <EnhancedInput
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="e.g., California"
                />
              </FormField>
              
              <FormField label="City" required error={errors.city}>
                <EnhancedInput
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Los Angeles"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Address Line 1" required error={errors.addressLine1}>
                <EnhancedInput
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  placeholder="Street address, building info"
                />
              </FormField>
              
              <FormField label="Address Line 2" error={errors.addressLine2}>
                <EnhancedInput
                  value={formData.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  placeholder="Landmark, optional details"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="ZIP / Postal Code" required error={errors.postalCode}>
                <EnhancedInput
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="e.g., 90210"
                />
              </FormField>
              
              <FormField label="Google Map Link / GPS" error={errors.googleMapLink}>
                <EnhancedInput
                  value={formData.googleMapLink}
                  onChange={(e) => handleInputChange('googleMapLink', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </FormField>
            </div>
          </div>
        );

      case 2: // Operational Settings
        return (
          <div className="space-y-6">
            <FormField label="Working Days" required error={errors.workingDays}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weekDays.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.workingDays.includes(day)}
                      onCheckedChange={(checked) => handleWorkingDayChange(day, checked as boolean)}
                    />
                    <Label htmlFor={day} className="text-sm font-medium">
                      {day.substring(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Working Hours Start" required>
                <EnhancedInput
                  type="time"
                  value={formData.workingHoursStart}
                  onChange={(e) => handleInputChange('workingHoursStart', e.target.value)}
                />
              </FormField>
              
              <FormField label="Working Hours End" required>
                <EnhancedInput
                  type="time"
                  value={formData.workingHoursEnd}
                  onChange={(e) => handleInputChange('workingHoursEnd', e.target.value)}
                />
              </FormField>
              
              <FormField label="Timezone" required error={errors.timezone}>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Max Daily Appointments">
                <EnhancedInput
                  type="number"
                  value={formData.maxDailyAppointments || ''}
                  onChange={(e) => handleInputChange('maxDailyAppointments', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 50"
                />
              </FormField>
              
              <FormField label="Default Language">
                <Select value={formData.defaultLanguage} onValueChange={(value) => handleInputChange('defaultLanguage', value)}>
                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        );

      case 3: // Branch Admin Setup
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Branch Admin Account</h3>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                This admin will be able to log in as a sub-admin to manage this branch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="First Name" required error={errors.adminFirstName}>
                <EnhancedInput
                  value={formData.adminFirstName}
                  onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                  placeholder="John"
                />
              </FormField>
              
              <FormField label="Last Name" required error={errors.adminLastName}>
                <EnhancedInput
                  value={formData.adminLastName}
                  onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                  placeholder="Doe"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Admin Email" required error={errors.adminEmail}>
                <EnhancedInput
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  placeholder="admin@branch.com"
                />
              </FormField>
              
              <FormField label="Admin Phone" required error={errors.adminPhone}>
                <EnhancedInput
                  value={formData.adminPhone}
                  onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </FormField>
            </div>

            <FormField label="Admin Password" required error={errors.adminPassword}>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <EnhancedInput
                      type={showPassword ? 'text' : 'password'}
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      placeholder="Minimum 8 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    Generate
                  </Button>
                </div>
                <div className="text-xs text-gray-600">
                  Password must contain uppercase, lowercase, and number
                </div>
              </div>
            </FormField>
          </div>
        );

      case 4: // Review & Submit
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormField label="Status" required>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <span className="text-sm font-medium">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {formData.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </FormField>
              
              <FormField label="Activation Date">
                <EnhancedInput
                  type="date"
                  value={formData.activationDate || ''}
                  onChange={(e) => handleInputChange('activationDate', e.target.value)}
                />
              </FormField>
            </div>

            {/* Review Summary */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="font-semibold text-lg mb-4">Review Branch Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Branch Name:</span> {formData.branchName}</p>
                    <p><span className="text-gray-600">Branch Type:</span> <span className="capitalize font-medium">{formData.branchType}</span></p>
                    <p><span className="text-gray-600">Email:</span> {formData.email}</p>
                    <p><span className="text-gray-600">Phone:</span> {formData.phoneNumber}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">City:</span> {formData.city}, {formData.state}</p>
                    <p><span className="text-gray-600">Country:</span> {formData.country}</p>
                    <p><span className="text-gray-600">Address:</span> {formData.addressLine1}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Operations</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Working Days:</span> {formData.workingDays.join(', ')}</p>
                    <p><span className="text-gray-600">Hours:</span> {formData.workingHoursStart} - {formData.workingHoursEnd}</p>
                    <p><span className="text-gray-600">Timezone:</span> {formData.timezone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Branch Admin</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Name:</span> {formData.adminFirstName} {formData.adminLastName}</p>
                    <p><span className="text-gray-600">Email:</span> {formData.adminEmail}</p>
                    <p><span className="text-gray-600">Phone:</span> {formData.adminPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
                          <div className="flex items-center space-x-6">
              
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Create New Branch
                  </h1>
                  <p className="text-gray-600 mt-1 text-base">Set up a new branch with sub-admin access</p>
                </div>
              </div>
            
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-4 py-2 text-sm font-semibold shadow-md">
              <Building2 className="w-4 h-4 mr-2" />
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-10">
            {StepIndicator}
            
            <div className="mt-10">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-10 mt-10 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-8 py-3 text-base font-medium hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-3" />
                Previous
              </Button>

              <div className="flex space-x-4">
                {currentStep < steps.length - 1 ? (
                  <Button 
                    onClick={handleNext}
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Next
                    <ArrowRight className="h-5 w-5 ml-3" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={createBranchMutation.isPending}
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {createBranchMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Creating Branch...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-3" />
                        Create Branch & Admin
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BranchForm; 