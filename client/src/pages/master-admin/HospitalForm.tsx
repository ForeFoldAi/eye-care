import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  ArrowLeft
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

// Simplified schema with only essential fields
const hospitalSchema = z.object({
  // Step 1: Basic Information
  name: z.string().min(1, 'Hospital name is required'),
  hospitalType: z.string().min(1, 'Hospital type is required'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  logo: z.any().optional(),
  
  // Contact Information
  primaryPhone: z.string().min(1, 'Primary phone is required'),
  email: z.string().email('Invalid email address'),
  addressLine1: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(1, 'PIN code is required'),
  
  // Step 2: Admin & Subscription
  adminFullName: z.string().min(1, 'Admin name is required'),
  adminEmail: z.string().email('Invalid admin email'),
  adminPhone: z.string().min(1, 'Admin phone is required'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  
  // Subscription
  planType: z.string().min(1, 'Plan type is required'),
  monthlyCost: z.number().min(0, 'Monthly cost must be 0 or greater'),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

  const totalSteps = 2;
  const progress = (currentStep / totalSteps) * 100;

  // Set existing logo when editing
  useEffect(() => {
    if (hospital?.logo) {
      setLogoPreview(hospital.logo);
    }
  }, [hospital]);

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

  const createHospitalMutation = useMutation({
    mutationFn: async (data: HospitalFormData) => {
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
                    <Label htmlFor="primaryPhone">Phone Number *</Label>
                    <Input
                      id="primaryPhone"
                      {...register('primaryPhone')}
                      placeholder="+91 9876543210"
                      className={errors.primaryPhone ? 'border-red-500' : ''}
                    />
                    {errors.primaryPhone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.primaryPhone.message}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="hospital@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email.message}
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
                      className={errors.adminEmail ? 'border-red-500' : ''}
                    />
                    {errors.adminEmail && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminEmail.message}
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
                      className={errors.adminPhone ? 'border-red-500' : ''}
                    />
                    {errors.adminPhone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminPhone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      {...register('adminPassword')}
                      placeholder="Minimum 6 characters"
                      className={errors.adminPassword ? 'border-red-500' : ''}
                    />
                    {errors.adminPassword && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.adminPassword.message}
                      </p>
                    )}
                  </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register('confirmPassword')}
                    placeholder="Confirm your password"
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="planType">Subscription Plan *</Label>
                    <Select value={watch('planType')} onValueChange={(value) => setValue('planType', value)}>
                      <SelectTrigger className={errors.planType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Plan - ₹5,000/month</SelectItem>
                        <SelectItem value="standard">Standard Plan - ₹8,000/month</SelectItem>
                        <SelectItem value="premium">Premium Plan - ₹12,000/month</SelectItem>
                        <SelectItem value="enterprise">Enterprise Plan - ₹20,000/month</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Patient Management
                </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Appointment Scheduling
                  </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Billing & Payments
                  </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Staff Management
                </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Reports & Analytics
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      24/7 Support
                  </div>
                </div>
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