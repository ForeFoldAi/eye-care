import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Save, 
  AlertCircle, 
  Check,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Shield,
  FileText,
  Star,
  Globe,
  Clock,
  Edit3,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

// Enhanced schema with comprehensive validations
const hospitalSchema = z.object({
  // Step 1: Basic Information
  name: z.string()
    .min(2, 'Hospital name must be at least 2 characters')
    .max(100, 'Hospital name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s&.-]+$/, 'Hospital name can only contain letters, spaces, &, ., and -'),
  hospitalType: z.string().min(1, 'Hospital type is required'),
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
  logo: z.any().optional(),
  
  // Contact Information with enhanced validation
  primaryPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[+]?[0-9\s-()]+$/, 'Please enter a valid phone number')
    .transform(val => val.replace(/\s+/g, '')), // Remove spaces
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  addressLine1: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'City name can only contain letters and spaces'),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'State name can only contain letters and spaces'),
  pinCode: z.string()
    .length(6, 'PIN code must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'PIN code can only contain numbers'),
  
  // Step 2: Admin & Subscription with enhanced validation
  adminFullName: z.string()
    .min(2, 'Admin name must be at least 2 characters')
    .max(100, 'Admin name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'),
  adminEmail: z.string()
    .email('Please enter a valid admin email address')
    .toLowerCase(),
  adminPhone: z.string()
    .min(10, 'Admin phone must be at least 10 digits')
    .regex(/^[+]?[0-9\s-()]+$/, 'Please enter a valid phone number')
    .transform(val => val.replace(/\s+/g, '')), // Remove spaces
  adminPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  
  // Subscription
  planType: z.string().min(1, 'Plan type is required'),
  monthlyCost: z.number()
    .min(0, 'Monthly cost cannot be negative')
    .max(100000, 'Monthly cost seems too high, please verify'),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.email !== data.adminEmail, {
  message: "Admin email should be different from hospital email",
  path: ["adminEmail"],
});

type HospitalFormData = z.infer<typeof hospitalSchema>;

interface Hospital {
  _id: string;
  name: string;
  hospitalType?: string;
  description?: string;
  logo?: string;
  primaryPhone?: string;
  email: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  adminFullName?: string;
  adminEmail?: string;
  adminPhone?: string;
  planType?: string;
  monthlyCost?: number;
}

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
}

interface HospitalFormProps {
  hospital?: Hospital;
  onSuccess: () => void;
  onCancel: () => void;
}

const HospitalForm: React.FC<HospitalFormProps> = ({ hospital, onSuccess, onCancel }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCustomHospitalType, setIsCustomHospitalType] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    primaryPhone?: string;
    adminEmail?: string;
    adminPhone?: string;
  }>({});

  // Fetch subscription plans from database
  const { data: subscriptionPlansData, isLoading: plansLoading } = useQuery({
    queryKey: ['master-admin', 'subscription-plans-active'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          isActive: 'true'
        });

        const response = await fetch(`${API_URL}/api/master-admin/subscription-plans?${params}`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        
        const data = await response.json();
        console.log('Subscription plans data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        return { plans: [] };
      }
    }
  });

  const totalSteps = 2;
  const progress = (currentStep / totalSteps) * 100;

  // Set existing logo when editing
  useEffect(() => {
    if (hospital?.logo) {
      setLogoPreview(hospital.logo);
    }
  }, [hospital]);

  // Check if hospital type is custom when editing
  useEffect(() => {
    if (hospital?.hospitalType) {
      const predefinedTypes = [
        'multi-specialty', 'general', 'eye-clinic', 'dental', 
        'orthopedic', 'cardiology', 'pediatric', 'maternity', 'diagnostic'
      ];
      const isCustom = !predefinedTypes.includes(hospital.hospitalType);
      setIsCustomHospitalType(isCustom);
    }
  }, [hospital?.hospitalType]);

  // Clear validation errors when user changes input values
  const clearValidationError = (field: keyof typeof validationErrors) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle plan selection and auto-fill monthly cost
  const handlePlanSelection = (planType: string) => {
    setValue('planType', planType);
    const selectedPlan = subscriptionPlansData?.plans?.find((plan: SubscriptionPlan) => plan.planType === planType);
    if (selectedPlan) {
      setValue('monthlyCost', selectedPlan.monthlyCost);
      toast({
        title: "Plan Selected",
        description: `${selectedPlan.planName} - ₹${selectedPlan.monthlyCost.toLocaleString()}/month`,
        variant: "default",
      });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger
  } = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    mode: 'onChange',
    defaultValues: {
      name: hospital?.name || '',
      hospitalType: hospital?.hospitalType || '',
      description: hospital?.description || '',
      primaryPhone: hospital?.primaryPhone || '',
      email: hospital?.email || '',
      addressLine1: hospital?.addressLine1 || '',
      city: hospital?.city || '',
      state: hospital?.state || '',
      pinCode: hospital?.pinCode || '',
      adminFullName: hospital?.adminFullName || '',
      adminEmail: hospital?.adminEmail || '',
      adminPhone: hospital?.adminPhone || '',
      adminPassword: '',
      confirmPassword: '',
      planType: hospital?.planType || '',
      monthlyCost: hospital?.monthlyCost || 0
    }
  });

  const steps = [
    { 
      id: 1, 
      title: 'Hospital Details', 
      icon: Building2,
      description: 'Basic hospital information'
    },
    { 
      id: 2, 
      title: 'Admin & Plan', 
      icon: User,
      description: 'Admin account and subscription'
    }
  ];

  const validateStep = async (step: number) => {
    const fieldsToValidate = step === 1 
      ? ['name', 'hospitalType', 'primaryPhone', 'email', 'addressLine1', 'city', 'state', 'pinCode']
      : ['adminFullName', 'adminEmail', 'adminPhone', 'adminPassword', 'confirmPassword', 'planType', 'monthlyCost'];
    
        const result = await trigger(fieldsToValidate as any);
        return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if email already exists
  const checkEmailExists = async (email: string, type: 'hospital' | 'admin' = 'hospital') => {
    try {
      const response = await fetch(`${API_URL}/api/hospitals?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const exists = data.hospitals?.some((h: any) => 
          h.email === email && (!hospital || h._id !== hospital._id)
        );
        return exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Check if phone already exists
  const checkPhoneExists = async (phone: string, type: 'hospital' | 'admin' = 'hospital') => {
    try {
      const response = await fetch(`${API_URL}/api/hospitals?phone=${encodeURIComponent(phone)}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const exists = data.hospitals?.some((h: any) => 
          (h.primaryPhone === phone || h.adminPhone === phone) && (!hospital || h._id !== hospital._id)
        );
        return exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking phone:', error);
      return false;
    }
  };

  // Validate unique fields
  const validateUniqueFields = async (data: HospitalFormData) => {
    const errors: any = {};
    
    // Check hospital email
    if (data.email) {
      const emailExists = await checkEmailExists(data.email, 'hospital');
      if (emailExists) {
        errors.email = 'This email is already registered. Please use a different email address.';
      }
    }

    // Check hospital phone
    if (data.primaryPhone) {
      const phoneExists = await checkPhoneExists(data.primaryPhone, 'hospital');
      if (phoneExists) {
        errors.primaryPhone = 'This phone number is already registered. Please use a different phone number.';
      }
    }

    // Check admin email
    if (data.adminEmail) {
      const adminEmailExists = await checkEmailExists(data.adminEmail, 'admin');
      if (adminEmailExists) {
        errors.adminEmail = 'This admin email is already registered. Please use a different email address.';
      }
    }

    // Check admin phone
    if (data.adminPhone) {
      const adminPhoneExists = await checkPhoneExists(data.adminPhone, 'admin');
      if (adminPhoneExists) {
        errors.adminPhone = 'This admin phone number is already registered. Please use a different phone number.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createHospitalMutation = useMutation({
    mutationFn: async (data: HospitalFormData) => {
      // Validate unique fields before submission
      const isUnique = await validateUniqueFields(data);
      if (!isUnique) {
        throw new Error('Please fix the validation errors before submitting.');
      }

      const formData = new FormData();
      
      // Add all form data
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'logo' && value instanceof File) {
          formData.append('logo', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_URL}/api/master-admin/hospitals`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create hospital');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Hospital created successfully. Admin account has been set up.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
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

  const updateHospitalMutation = useMutation({
    mutationFn: async (data: HospitalFormData) => {
      // Validate unique fields before submission
      const isUnique = await validateUniqueFields(data);
      if (!isUnique) {
        throw new Error('Please fix the validation errors before submitting.');
      }

      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'logo' && value instanceof File) {
          formData.append('logo', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_URL}/api/master-admin/hospitals/${hospital?._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update hospital');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Hospital updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
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

  const onSubmit = async (data: HospitalFormData) => {
    if (hospital) {
      updateHospitalMutation.mutate(data);
        } else {
      createHospitalMutation.mutate(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {hospital ? 'Edit Hospital' : 'Onboard New Hospital'}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                {hospital ? 'Update hospital information' : 'Add a new hospital to the system'}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{currentStep} of {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center mt-6 space-x-8">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-6">
            {/* Step 1: Hospital Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <Building2 className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
                    <p className="text-sm text-gray-600">Basic details about the hospital</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hospital Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter hospital name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospitalType">Hospital Type *</Label>
                    
                    {!isCustomHospitalType ? (
                      <div className="space-y-2">
                        <Select value={watch('hospitalType')} onValueChange={(value) => setValue('hospitalType', value)}>
                          <SelectTrigger className={errors.hospitalType ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select hospital type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multi-specialty">Multi-Specialty Hospital</SelectItem>
                            <SelectItem value="general">General Hospital</SelectItem>
                            <SelectItem value="eye-clinic">Eye Clinic</SelectItem>
                            <SelectItem value="dental">Dental Clinic</SelectItem>
                            <SelectItem value="orthopedic">Orthopedic Center</SelectItem>
                            <SelectItem value="cardiology">Cardiology Center</SelectItem>
                            <SelectItem value="pediatric">Pediatric Hospital</SelectItem>
                            <SelectItem value="maternity">Maternity Hospital</SelectItem>
                            <SelectItem value="diagnostic">Diagnostic Center</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsCustomHospitalType(true);
                            setValue('hospitalType', '');
                          }}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Enter Custom Hospital Type
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="hospitalType"
                            {...register('hospitalType')}
                            placeholder="Enter custom hospital type"
                            className={errors.hospitalType ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCustomHospitalType(false);
                              setValue('hospitalType', '');
                            }}
                            className="px-3"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsCustomHospitalType(false);
                            setValue('hospitalType', '');
                          }}
                          className="w-full text-blue-600 hover:text-blue-700"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Choose from predefined types
                        </Button>
                      </div>
                    )}
                    
                    {errors.hospitalType && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.hospitalType.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of the hospital (optional)"
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    {watch('description')?.length || 0}/200 characters
                  </p>
                </div>

                                <div className="space-y-2">
                  <Label htmlFor="logo">Hospital Logo</Label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-20 h-20 object-cover mx-auto rounded-lg"
                        />
                        <p className="text-sm text-green-600 font-medium">Logo uploaded!</p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-500">JPG, PNG up to 1MB</p>
                      </>
                    )}
                    <Input
                      id="logo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      {...register('logo')}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryPhone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Phone Number *
                    </Label>
                    <Input
                      id="primaryPhone"
                      {...register('primaryPhone')}
                      placeholder="+91 9876543210"
                      className={(errors.primaryPhone || validationErrors.primaryPhone) ? 'border-red-500' : ''}
                      onChange={(e) => {
                        register('primaryPhone').onChange(e);
                        clearValidationError('primaryPhone');
                      }}
                    />
                    {errors.primaryPhone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.primaryPhone.message}
                      </p>
                    )}
                    {validationErrors.primaryPhone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.primaryPhone}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="hospital@example.com"
                    className={(errors.email || validationErrors.email) ? 'border-red-500' : ''}
                    onChange={(e) => {
                      register('email').onChange(e);
                      clearValidationError('email');
                    }}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </p>
                  )}
                  {validationErrors.email && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.email}
                    </p>
                  )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address *</Label>
                  <Input
                    id="addressLine1"
                    {...register('addressLine1')}
                    placeholder="Street address"
                    className={errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {errors.addressLine1 && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="City"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="State"
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.state.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pinCode">PIN Code *</Label>
                    <Input
                      id="pinCode"
                      {...register('pinCode')}
                      placeholder="123456"
                      className={errors.pinCode ? 'border-red-500' : ''}
                    />
                    {errors.pinCode && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.pinCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Admin & Plan */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <User className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Admin Account & Plan</h3>
                    <p className="text-sm text-gray-600">Set up admin account and subscription plan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="adminFullName">Admin Full Name *</Label>
                    <Input
                      id="adminFullName"
                      {...register('adminFullName')}
                      placeholder="John Doe"
                      className={errors.adminFullName ? 'border-red-500' : ''}
                    />
                    {errors.adminFullName && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminFullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      {...register('adminEmail')}
                      placeholder="admin@hospital.com"
                      className={(errors.adminEmail || validationErrors.adminEmail) ? 'border-red-500' : ''}
                      onChange={(e) => {
                        register('adminEmail').onChange(e);
                        clearValidationError('adminEmail');
                      }}
                    />
                    {errors.adminEmail && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminEmail.message}
                      </p>
                    )}
                    {validationErrors.adminEmail && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.adminEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Admin Phone *</Label>
                    <Input
                      id="adminPhone"
                      {...register('adminPhone')}
                      placeholder="+91 9876543210"
                      className={(errors.adminPhone || validationErrors.adminPhone) ? 'border-red-500' : ''}
                      onChange={(e) => {
                        register('adminPhone').onChange(e);
                        clearValidationError('adminPhone');
                      }}
                    />
                    {errors.adminPhone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminPhone.message}
                      </p>
                    )}
                    {validationErrors.adminPhone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.adminPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword" className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="adminPassword"
                        type={showPassword ? 'text' : 'password'}
                        {...register('adminPassword')}
                        placeholder="Minimum 8 characters with uppercase, lowercase & number"
                        className={`pr-10 ${errors.adminPassword ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.adminPassword && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminPassword.message}
                      </p>
                    )}
                    {/* Password strength indicator */}
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">Password requirements:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${
                          watch('adminPassword')?.length >= 8 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            watch('adminPassword')?.length >= 8 ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                          8+ characters
                        </div>
                        <div className={`flex items-center gap-1 ${
                          /[A-Z]/.test(watch('adminPassword') || '') ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            /[A-Z]/.test(watch('adminPassword') || '') ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                          Uppercase
                        </div>
                        <div className={`flex items-center gap-1 ${
                          /[a-z]/.test(watch('adminPassword') || '') ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            /[a-z]/.test(watch('adminPassword') || '') ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                          Lowercase
                        </div>
                        <div className={`flex items-center gap-1 ${
                          /\d/.test(watch('adminPassword') || '') ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            /\d/.test(watch('adminPassword') || '') ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                          Number
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        placeholder="Confirm your password"
                        className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                    {/* Password match indicator */}
                    {watch('confirmPassword') && (
                      <div className={`text-xs flex items-center gap-1 ${
                        watch('adminPassword') === watch('confirmPassword') 
                          ? 'text-green-600' 
                          : 'text-red-500'
                      }`}>
                        {watch('adminPassword') === watch('confirmPassword') ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        {watch('adminPassword') === watch('confirmPassword') 
                          ? 'Passwords match' 
                          : 'Passwords do not match'
                        }
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="planType">Subscription Plan *</Label>
                    {plansLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-500">Loading plans...</span>
                      </div>
                    ) : (
                      <Select value={watch('planType')} onValueChange={handlePlanSelection}>
                        <SelectTrigger className={errors.planType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {subscriptionPlansData?.plans && subscriptionPlansData.plans.length > 0 ? (
                            subscriptionPlansData.plans.map((plan: SubscriptionPlan) => (
                              <SelectItem key={plan._id} value={plan.planType}>
                                {plan.planName} - ₹{plan.monthlyCost.toLocaleString()}/month
                                {plan.isPopular && (
                                  <span className="ml-2 text-yellow-600">★ Popular</span>
                                )}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1 text-sm text-gray-500">
                              No subscription plans available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.planType && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.planType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyCost">Monthly Cost (₹) *</Label>
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
                </div>

                {/* Plan Features */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Plan Features</h4>
                  {watch('planType') ? (
                    (() => {
                      const selectedPlan = subscriptionPlansData?.plans?.find((plan: SubscriptionPlan) => plan.planType === watch('planType'));
                      return selectedPlan ? (
                        <div>
                          <div className="mb-3 p-3 bg-white rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{selectedPlan.planName}</h5>
                              {selectedPlan.isPopular && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{selectedPlan.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                              <div>Max Users: {selectedPlan.maxUsers}</div>
                              <div>Max Branches: {selectedPlan.maxBranches}</div>
                              <div>Max Patients: {selectedPlan.maxPatients.toLocaleString()}</div>
                              <div>Storage: {selectedPlan.maxStorage}GB</div>
                            </div>
                          </div>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                             {selectedPlan.features.map((feature: string, index: number) => (
                               <div key={index} className="flex items-center">
                                 <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                                 <span className="truncate">{feature}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-4">
                          Select a plan to view features
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      Select a plan to view features
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-3">
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {hospital ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {hospital ? 'Update Hospital' : 'Create Hospital'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default HospitalForm; 