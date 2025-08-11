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
  dayType: string; // full day or half day
  workingDaySettings: {
    [day: string]: {
      isWorking: boolean;
      dayType: 'full' | 'half';
      startTime?: string;
      endTime?: string;
    };
  };
  
  // Bank Details
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankBranchCode?: string;
  
  // Branch Admin Setup
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
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
  const [formData, setFormData] = useState<BranchFormData>({
    branchName: '',
    hospitalId: user?.hospitalId || '',
    branchCode: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    country: 'IN',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    googleMapLink: '',
    workingDays: [],
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    timezone: 'IST',
    dayType: 'full',
    workingDaySettings: {
      Monday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Tuesday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Wednesday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Thursday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Friday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Saturday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Sunday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' }
    },
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    bankBranchCode: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
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
      fields: ['branchName', 'hospitalId', 'branchCode', 'email', 'phoneNumber', 'alternatePhone']
    },
    {
      title: 'Location & Operations',
      description: 'Address, location and operational settings',
      icon: MapPin,
      fields: ['country', 'state', 'city', 'addressLine1', 'addressLine2', 'postalCode', 'googleMapLink', 'workingDays', 'workingHoursStart', 'workingHoursEnd', 'timezone', 'dayType', 'workingDaySettings']
    },
    {
      title: 'Bank Details',
      description: 'Payment and banking information',
      icon: Building2,
      fields: ['bankName', 'accountNumber', 'accountHolderName', 'ifscCode', 'bankBranchCode']
    },
    {
      title: 'Branch Admin Setup',
      description: 'Sub-admin credentials',
      icon: Shield,
      fields: ['adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword', 'confirmPassword', 'adminPhone']
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



  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      // Prepare the request data with all form fields
      const requestData = {
        // Basic Information
        branchName: data.branchName,
        hospitalId: data.hospitalId || user?.hospitalId,
        branchCode: data.branchCode,
        email: data.email,
        phoneNumber: data.phoneNumber,
        alternatePhone: data.alternatePhone,
        
        // Location Details
        country: data.country,
        state: data.state,
        city: data.city,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        postalCode: data.postalCode,
        googleMapLink: data.googleMapLink,
        
        // Operational Settings
        workingDays: data.workingDays,
        workingHoursStart: data.workingHoursStart,
        workingHoursEnd: data.workingHoursEnd,
        timezone: data.timezone,
        workingDaySettings: data.workingDaySettings,
        
        // Bank Details
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolderName: data.accountHolderName,
        ifscCode: data.ifscCode,
        bankBranchCode: data.bankBranchCode,
        
        // Branch Admin Setup
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        adminPhone: data.adminPhone,
        
        // Status and Activation
        isActive: data.isActive,
        activationDate: data.activationDate,
        
        // System fields
        createdBy: user?.id
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
    { value: 'IN', label: 'India' },
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
  ], []);

  const timezones = useMemo(() => [
    { value: 'IST', label: 'Indian Standard Time (IST)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Time (EST)' },
    { value: 'PST', label: 'Pacific Time (PST)' },
    { value: 'CST', label: 'Central Time (CST)' },
    { value: 'MST', label: 'Mountain Time (MST)' },
  ], []);

  const dayTypes = useMemo(() => [
    { value: 'full', label: 'Full Day' },
    { value: 'half', label: 'Half Day' },
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
        : prev.workingDays.filter(d => d !== day),
      workingDaySettings: {
        ...prev.workingDaySettings,
        [day]: {
          ...prev.workingDaySettings[day],
          isWorking: checked
        }
      }
    }));
  }, []);

  const handleDayTypeChange = useCallback((day: string, dayType: 'full' | 'half') => {
    setFormData(prev => ({
      ...prev,
      workingDaySettings: {
        ...prev.workingDaySettings,
        [day]: {
          ...prev.workingDaySettings[day],
          dayType,
          startTime: dayType === 'half' ? '09:00' : prev.workingDaySettings[day].startTime,
          endTime: dayType === 'half' ? '13:00' : prev.workingDaySettings[day].endTime
        }
      }
    }));
  }, []);

  const handleDayTimeChange = useCallback((day: string, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingDaySettings: {
        ...prev.workingDaySettings,
        [day]: {
          ...prev.workingDaySettings[day],
          [field]: value
        }
      }
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
        case 'confirmPassword':
          if (!value || (value as string).trim() === '') {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (value !== formData.adminPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
        case 'workingDaySettings':
          const workingDays = Object.values(formData.workingDaySettings).filter(day => day.isWorking);
          if (workingDays.length === 0) {
            newErrors.workingDays = 'At least one working day is required';
          }
          // Validate that each working day has valid times
          workingDays.forEach(day => {
            if (!day.startTime || !day.endTime) {
              newErrors.workingDays = 'All working days must have start and end times';
            } else if (day.startTime >= day.endTime) {
              newErrors.workingDays = 'Start time must be before end time';
            }
          });
          break;
        case 'bankName':
        case 'accountNumber':
        case 'accountHolderName':
        case 'ifscCode':
          if (!value || (value as string).trim() === '') {
            newErrors[field] = 'This field is required';
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



  const StepIndicator = useMemo(() => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300 shadow-lg
              ${index <= currentStep 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white shadow-blue-200' 
                : 'bg-white border-gray-200 text-gray-400 shadow-gray-100'
              }
              ${index === currentStep ? 'scale-110 ring-4 ring-blue-100' : ''}
            `}>
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                h-2 w-16 mx-3 transition-all duration-300 rounded-full
                ${index < currentStep 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                  : 'bg-gray-200'
                }
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
          {steps[currentStep].title}
        </h2>
        <p className="text-gray-600 text-xs">{steps[currentStep].description}</p>
      </div>
      <div className="relative">
        <Progress 
          value={((currentStep + 1) / steps.length) * 100} 
          className="h-2 bg-gray-100 rounded-full overflow-hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
             style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  ), [steps, currentStep]);

  const EnhancedInput = useCallback((props: React.ComponentProps<typeof Input>) => (
    <Input
      {...props}
      className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300"
    />
  ), []);



  const FormField = useCallback(({ label, required, error, children }: any) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-800 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1 text-sm">*</span>}
      </Label>
      <div className="relative">
        {children}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-xs mt-1 p-2 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-3 w-3" />
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
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Branch Name" required error={errors.branchName}>
                <EnhancedInput
                  value={formData.branchName}
                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                  placeholder="e.g., City Eye Center"
                />
              </FormField>
              
              <FormField label="Hospital (Parent)" required error={errors.hospitalId}>
                <Select value={formData.hospitalId} onValueChange={(value) => handleInputChange('hospitalId', value)}>
                  <SelectTrigger className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
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
              <FormField label="Branch Code / ID" error={errors.branchCode}>
                <EnhancedInput
                  value={formData.branchCode}
                  onChange={(e) => handleInputChange('branchCode', e.target.value)}
                  placeholder="Optional unique identifier"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      case 1: // Location & Operations
        return (
          <div className="space-y-4">
            {/* Location Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Location Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField label="Country" required error={errors.country}>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <Separator className="my-4" />

            {/* Operational Settings Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Operational Settings</h3>
              </div>
              
              <FormField label="Working Days & Hours" required error={errors.workingDays}>
                <div className="space-y-3">
                  {weekDays.map((day) => {
                    const daySettings = formData.workingDaySettings[day];
        return (
                      <div key={day} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                    <Checkbox
                      id={day}
                              checked={daySettings.isWorking}
                      onCheckedChange={(checked) => handleWorkingDayChange(day, checked as boolean)}
                    />
                            <Label htmlFor={day} className="font-medium text-gray-900">
                              {day}
                    </Label>
                  </div>
                          {daySettings.isWorking && (
                            <Badge variant={daySettings.dayType === 'full' ? 'default' : 'secondary'} className="text-xs">
                              {daySettings.dayType === 'full' ? 'Full Day' : 'Half Day'}
                            </Badge>
                          )}
              </div>
                        
                        {daySettings.isWorking && (
                          <div className="space-y-2 ml-6">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`${day}-full`}
                                  name={`${day}-type`}
                                  checked={daySettings.dayType === 'full'}
                                  onChange={() => handleDayTypeChange(day, 'full')}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor={`${day}-full`} className="text-sm">Full Day</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`${day}-half`}
                                  name={`${day}-type`}
                                  checked={daySettings.dayType === 'half'}
                                  onChange={() => handleDayTypeChange(day, 'half')}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor={`${day}-half`} className="text-sm">Half Day</Label>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">Start Time</Label>
                <EnhancedInput
                  type="time"
                                  value={daySettings.startTime || ''}
                                  onChange={(e) => handleDayTimeChange(day, 'startTime', e.target.value)}
                                  className="h-8 text-xs"
                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">End Time</Label>
                <EnhancedInput
                  type="time"
                                  value={daySettings.endTime || ''}
                                  onChange={(e) => handleDayTimeChange(day, 'endTime', e.target.value)}
                                  className="h-8 text-xs"
                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </FormField>
              
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
              <FormField label="Timezone" required error={errors.timezone}>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg hover:border-gray-300">
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
            </div>
          </div>
        );

      case 2: // Bank Details
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Bank Name" required error={errors.bankName}>
                <EnhancedInput
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="e.g., State Bank of India"
                />
              </FormField>
              
              <FormField label="Account Number" required error={errors.accountNumber}>
                <EnhancedInput
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Enter account number"
                />
              </FormField>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Account Holder Name" required error={errors.accountHolderName}>
                <EnhancedInput
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  placeholder="Account holder's full name"
                />
              </FormField>
              
              <FormField label="IFSC Code" required error={errors.ifscCode}>
                <EnhancedInput
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  placeholder="e.g., SBIN0001234"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Bank Branch Code" error={errors.bankBranchCode}>
                <EnhancedInput
                  value={formData.bankBranchCode}
                  onChange={(e) => handleInputChange('bankBranchCode', e.target.value)}
                  placeholder="Optional branch code"
                />
              </FormField>
            </div>
          </div>
        );

      case 3: // Branch Admin Setup
        return (
          <div className="space-y-3">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="AdminFirst Name" required error={errors.adminFirstName}>
                <EnhancedInput
                  value={formData.adminFirstName}
                  onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                  placeholder="First name"
                />
              </FormField>
              
              <FormField label="Admin Last Name" required error={errors.adminLastName}>
                <EnhancedInput
                  value={formData.adminLastName}
                  onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                  placeholder="Last name"
                />
              </FormField>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="AdminEmail" required error={errors.adminEmail}>
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

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Admin Password" required error={errors.adminPassword}>
                <div className="relative">
                  <EnhancedInput
                    type={showPassword ? 'text' : 'password'}
                    value={formData.adminPassword}
                    onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                    placeholder="Min 8 chars, upper, lower, number"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
              </div>
            </FormField>

            <FormField label="Confirm Password" required error={errors.confirmPassword}>
                <EnhancedInput
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                />
            </FormField>
            </div>
          </div>
        );

      case 4: // Review & Submit
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <h3 className="font-semibold text-base mb-2">Review Branch Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Basic Information</h4>
                  <div className="space-y-0.5 text-xs">
                    <p><span className="text-gray-600">Branch Name:</span> {formData.branchName}</p>
                    <p><span className="text-gray-600">Email:</span> {formData.email}</p>
                    <p><span className="text-gray-600">Phone:</span> {formData.phoneNumber}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Location</h4>
                  <div className="space-y-0.5 text-xs">
                    <p><span className="text-gray-600">City:</span> {formData.city}, {formData.state}</p>
                    <p><span className="text-gray-600">Country:</span> {formData.country}</p>
                    <p><span className="text-gray-600">Address:</span> {formData.addressLine1}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Operations</h4>
                  <div className="space-y-0.5 text-xs">
                    <p><span className="text-gray-600">Working Days:</span> {formData.workingDays.join(', ')}</p>
                    <p><span className="text-gray-600">Timezone:</span> {formData.timezone}</p>
                    <div className="mt-1">
                      <p className="text-gray-600 mb-0.5">Working Hours:</p>
                      {Object.entries(formData.workingDaySettings)
                        .filter(([_, settings]) => settings.isWorking)
                        .map(([day, settings]) => (
                          <p key={day} className="ml-2 text-xs">
                            <span className="text-gray-500">{day}:</span> {settings.startTime} - {settings.endTime} ({settings.dayType === 'full' ? 'Full Day' : 'Half Day'})
                          </p>
                        ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Bank Details</h4>
                  <div className="space-y-0.5 text-xs">
                    <p><span className="text-gray-600">Bank:</span> {formData.bankName}</p>
                    <p><span className="text-gray-600">Account:</span> {formData.accountNumber}</p>
                    <p><span className="text-gray-600">Holder:</span> {formData.accountHolderName}</p>
                    <p><span className="text-gray-600">IFSC:</span> {formData.ifscCode}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Branch Admin</h4>
                  <div className="space-y-0.5 text-xs">
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
      <div className="bg-white border-b border-gray-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
                          <div className="flex items-center space-x-6">
              
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Create New Branch
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm">Set up a new branch with sub-admin access</p>
                </div>
              </div>
            
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-md">
              <Building2 className="w-3 h-3 mr-1" />
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-4">
            {StepIndicator}
            
            <div className="mt-4">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 mt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6 py-2 text-sm font-medium hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-3" />
                Previous
              </Button>

              <div className="flex space-x-4">
                {currentStep < steps.length - 1 ? (
                  <Button 
                    onClick={handleNext}
                    className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Next
                    <ArrowRight className="h-5 w-5 ml-3" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={createBranchMutation.isPending}
                    className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
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