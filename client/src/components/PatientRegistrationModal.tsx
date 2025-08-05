// Description: A modal component for registering new patients with a form that includes validation and submission handling.
//file nme: PatientRegistrationModal.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertTriangle, Search, UserCheck, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Enhanced validation schema with custom rules
const patientValidationSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .transform(val => val.trim().replace(/\s+/g, ' ')), // Clean up spaces
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 150;
    }, 'Please enter a valid date of birth')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate <= today;
    }, 'Date of birth cannot be in the future'),
  
  gender: z.enum(['male', 'female', 'other'], { 
    required_error: 'Gender is required' 
  }),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^[+]?[\d\s\-\(\)]+$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign')
    .transform(val => val.replace(/\D/g, '')) // Remove non-digits
    .refine(val => val.length >= 10, 'Phone number must be at least 10 digits'),
  
  email: z.string()
    .optional()
    .or(z.literal(''))
    .refine((email) => {
      if (!email || email === '') return true;
      return z.string().email().safeParse(email).success;
    }, 'Please enter a valid email address')
    .transform(val => val?.toLowerCase().trim() || ''),
  
  address: z.string()
    .optional()
    .refine((addr) => {
      if (!addr) return true;
      return addr.length <= 200;
    }, 'Address must be less than 200 characters')
    .transform(val => val?.trim() || ''),
  
  emergencyContactName: z.string()
    .optional()
    .refine((name) => {
      if (!name) return true;
      return /^[a-zA-Z\s]+$/.test(name) && name.length >= 2 && name.length <= 50;
    }, 'Emergency contact name must be 2-50 characters and contain only letters')
    .transform(val => val?.trim().replace(/\s+/g, ' ') || ''),
  
  emergencyContactPhone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone) return true;
      const cleanPhone = phone.replace(/\D/g, '');
      return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    }, 'Emergency contact phone must be 10-15 digits')
    .transform(val => val ? val.replace(/\D/g, '') : ''),
  
  medicalHistory: z.string()
    .optional()
    .refine((history) => {
      if (!history) return true;
      return history.length <= 1000;
    }, 'Medical history must be less than 1000 characters')
    .transform(val => val?.trim() || ''),
});

type PatientFormData = z.infer<typeof patientValidationSchema>;

interface ExistingPatient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface ValidationState {
  firstName: 'valid' | 'invalid' | 'pending' | null;
  lastName: 'valid' | 'invalid' | 'pending' | null;
  phone: 'valid' | 'invalid' | 'pending' | null;
  email: 'valid' | 'invalid' | 'pending' | null;
}

export default function PatientRegistrationModal({ isOpen, onClose, onSuccess }: PatientRegistrationModalProps) {
  const { toast } = useToast();
  const [existingPatient, setExistingPatient] = useState<ExistingPatient | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    firstName: null,
    lastName: null,
    phone: null,
    email: null,
  });
  const [serverError, setServerError] = useState<string | null>(null);
  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientValidationSchema),
    mode: 'onBlur', // Validate on blur for better error visibility
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "male",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      medicalHistory: "",
    },
  });

  const API_URL = import.meta.env.VITE_API_URL;
  
  // Watch form values for real-time validation
  const watchedValues = form.watch();
  
  // Watch phone number changes
  const phoneValue = form.watch("phone");

  // Real-time validation for individual fields
  const validateField = (fieldName: keyof ValidationState, value: string) => {
    try {
      switch (fieldName) {
        case 'firstName':
          patientValidationSchema.shape.firstName.parse(value);
          setValidationState(prev => ({ ...prev, firstName: 'valid' }));
          break;
        case 'lastName':
          patientValidationSchema.shape.lastName.parse(value);
          setValidationState(prev => ({ ...prev, lastName: 'valid' }));
          break;
        case 'phone':
          patientValidationSchema.shape.phone.parse(value);
          setValidationState(prev => ({ ...prev, phone: 'valid' }));
          break;
        case 'email':
          patientValidationSchema.shape.email.parse(value);
          setValidationState(prev => ({ ...prev, email: 'valid' }));
          break;
      }
    } catch {
      setValidationState(prev => ({ ...prev, [fieldName]: 'invalid' }));
    }
  };

  // Check if phone number already exists
  const { data: phoneCheckResult } = useQuery({
    queryKey: ['check-phone', phoneValue],
    queryFn: async () => {
      if (!phoneValue || phoneValue.length < 10) return null;
      
      setIsCheckingPhone(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/patients/search?q=${encodeURIComponent(phoneValue)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const patients = data.data || data || [];
          const existingPatient = patients.find((p: any) => p.phone === phoneValue);
          setExistingPatient(existingPatient || null);
          return existingPatient || null;
        }
        return null;
      } catch (error) {
        console.error('Error checking phone:', error);
        return null;
      } finally {
        setIsCheckingPhone(false);
      }
    },
    enabled: !!phoneValue && phoneValue.length >= 10,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('-');
    }
    return cleaned;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const patientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        
        // Handle duplicate phone number error specifically
        if (errorData.message && errorData.message.includes('E11000') && errorData.message.includes('phone')) {
          throw new Error('⚠️ Phone Number Already Exists\n\nThis phone number is already registered in our system. Please:\n• Use a different phone number, or\n• Search for the existing patient using the search feature');
        }
        
        // Handle other duplicate key errors
        if (errorData.message && errorData.message.includes('E11000')) {
          throw new Error('⚠️ Duplicate Information Detected\n\nA patient with similar information already exists. Please verify all details and try again.');
        }
        
        // If there are specific validation errors, show them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation errors: ${errorMessages}`);
        }
        
        throw new Error(errorData.message || 'Failed to register patient');
      }
      return response.json();
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['check-phone'] }); // Clear phone check cache
      form.reset();
      setExistingPatient(null);
      setServerError(null);
      setValidationState({
        firstName: null,
        lastName: null,
        phone: null,
        email: null,
      });
      onClose();
      onSuccess?.();
      toast({
        title: "✅ Patient Registration Successful!",
        description: `${newPatient.firstName} ${newPatient.lastName} has been successfully registered.\n\n📋 Patient ID: ${newPatient.patientId || newPatient._id}\n📞 Phone: ${newPatient.phone}\n\nYou can now book appointments and manage this patient's records.`,
        duration: 6000,
      });
    },
    onError: (error: any) => {
      // Set server error state to display in form
      setServerError(error.message || "Failed to register patient. Please check all fields and try again.");
      
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register patient. Please check all fields and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      // Clear any previous server errors
      setServerError(null);
      
      // Check if phone already exists before submitting
      if (existingPatient) {
        toast({
          title: "⚠️ Cannot Register - Patient Already Exists",
          description: `Patient "${existingPatient.firstName} ${existingPatient.lastName}" is already registered with phone number ${data.phone}. Please use the "Use Existing" button above or enter a different phone number.`,
          variant: "destructive",
          duration: 8000, // Show longer for important message
        });
        return;
      }

      // Final validation before submission
      const validatedData = patientValidationSchema.parse(data);
      await patientMutation.mutateAsync(validatedData);
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: `${firstError.path.join('.')}: ${firstError.message}`,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Validation Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    form.reset();
    setExistingPatient(null);
    setServerError(null);
    setValidationState({
      firstName: null,
      lastName: null,
      phone: null,
      email: null,
    });
    onClose();
  };

  const handleUseExistingPatient = () => {
    if (existingPatient) {
      toast({
        title: "✅ Existing Patient Selected",
        description: `You have selected "${existingPatient.firstName} ${existingPatient.lastName}" (Phone: ${existingPatient.phone}).\n\nThis patient is already in the system and ready for appointments or other services.`,
        duration: 5000,
      });
      handleClose();
      // Optionally trigger a callback to select this patient in the parent component
      onSuccess?.();
    }
  };

  // Get validation icon for field
  const getValidationIcon = (fieldName: keyof ValidationState) => {
    const state = validationState[fieldName];
    if (state === 'valid') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (state === 'invalid') return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  const age = calculateAge(watchedValues.dateOfBirth);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Register New Patient
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Existing Patient Alert */}
        {existingPatient && (
          <Alert className="border-red-300 bg-red-50 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <strong className="text-base">⚠️ Patient Already Registered</strong>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-red-200">
                    <p className="font-semibold text-gray-900">
                      {existingPatient.firstName} {existingPatient.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      📞 Phone: {existingPatient.phone}
                      {existingPatient.email && <span> • ✉️ Email: {existingPatient.email}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleUseExistingPatient}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Use This Existing Patient
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      form.setValue("phone", "");
                      setExistingPatient(null);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Phone & Continue
                  </Button>
                </div>
                <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                  💡 <strong>Tip:</strong> If this is a different person with the same phone number, please use a different contact number or add a suffix (e.g., extension).
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Server Error Alert */}
        {serverError && (
          <Alert className="border-red-400 bg-red-100 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <strong className="text-base">🚨 Registration Failed</strong>
                </div>
                <div className="bg-white p-3 rounded-md border border-red-200">
                  <p className="text-sm whitespace-pre-line">{serverError}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setServerError(null)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Summary - Show all form errors prominently */}
          {Object.keys(form.formState.errors).length > 0 && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900">
                <div className="space-y-2">
                  <p className="font-semibold">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {form.formState.errors.firstName && (
                      <li>First Name: {form.formState.errors.firstName.message}</li>
                    )}
                    {form.formState.errors.lastName && (
                      <li>Last Name: {form.formState.errors.lastName.message}</li>
                    )}
                    {form.formState.errors.dateOfBirth && (
                      <li>Date of Birth: {form.formState.errors.dateOfBirth.message}</li>
                    )}
                    {form.formState.errors.gender && (
                      <li>Gender: {form.formState.errors.gender.message}</li>
                    )}
                    {form.formState.errors.phone && (
                      <li>Phone Number: {form.formState.errors.phone.message}</li>
                    )}
                    {form.formState.errors.email && (
                      <li>Email: {form.formState.errors.email.message}</li>
                    )}
                    {form.formState.errors.address && (
                      <li>Address: {form.formState.errors.address.message}</li>
                    )}
                    {form.formState.errors.emergencyContactName && (
                      <li>Emergency Contact Name: {form.formState.errors.emergencyContactName.message}</li>
                    )}
                    {form.formState.errors.emergencyContactPhone && (
                      <li>Emergency Contact Phone: {form.formState.errors.emergencyContactPhone.message}</li>
                    )}
                    {form.formState.errors.medicalHistory && (
                      <li>Medical History: {form.formState.errors.medicalHistory.message}</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    className={`mt-2 ${form.formState.errors.firstName ? 'border-red-300' : validationState.firstName === 'valid' ? 'border-green-300' : ''}`}
                    placeholder="Enter first name"
                    onChange={(e) => {
                      form.setValue("firstName", e.target.value);
                      validateField('firstName', e.target.value);
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('firstName')}
                  </div>
                </div>
                {form.formState.errors.firstName && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.firstName.message}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name *
                </Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    className={`mt-2 ${form.formState.errors.lastName ? 'border-red-300' : validationState.lastName === 'valid' ? 'border-green-300' : ''}`}
                    placeholder="Enter last name"
                    onChange={(e) => {
                      form.setValue("lastName", e.target.value);
                      validateField('lastName', e.target.value);
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('lastName')}
                  </div>
                </div>
                {form.formState.errors.lastName && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.lastName.message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                  Date of Birth *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...form.register("dateOfBirth")}
                  className={`mt-2 ${form.formState.errors.dateOfBirth ? 'border-red-300' : ''}`}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
                {age !== null && age >= 0 && (
                  <p className="text-sm text-gray-600 mt-1">Age: {age} years</p>
                )}
                {form.formState.errors.dateOfBirth && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Gender *</Label>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(value: 'male' | 'female' | 'other') => form.setValue("gender", value)}
                >
                  <SelectTrigger className={`mt-2 ${form.formState.errors.gender ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.gender.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    className={`mt-2 ${
                      existingPatient ? 'border-amber-300 bg-amber-50' : 
                      form.formState.errors.phone ? 'border-red-300' : 
                      validationState.phone === 'valid' ? 'border-green-300' : ''
                    }`}
                                         placeholder="Enter 10-digit phone number (e.g., 9876543210)"
                     maxLength={15}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      form.setValue("phone", e.target.value);
                      validateField('phone', e.target.value);
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {isCheckingPhone && <Search className="w-4 h-4 animate-spin text-gray-400" />}
                    {!isCheckingPhone && getValidationIcon('phone')}
                  </div>
                </div>
                                 {isCheckingPhone && (
                   <p className="text-sm text-blue-600 mt-1 flex items-center">
                     <Search className="w-4 h-4 mr-1 animate-spin" />
                     Checking if phone number is already registered...
                   </p>
                 )}
                 {form.formState.errors.phone && !isCheckingPhone && (
                   <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                     <p className="text-sm text-red-700 flex items-center font-medium">
                       <XCircle className="w-4 h-4 mr-1" />
                       {form.formState.errors.phone.message}
                     </p>
                   </div>
                 )}
                                 {existingPatient && (
                   <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                     <p className="text-sm text-red-700 flex items-center font-medium">
                       <AlertTriangle className="w-4 h-4 mr-1" />
                       Phone number already registered
                     </p>
                     <p className="text-xs text-red-600 mt-1">
                       Patient: {existingPatient.firstName} {existingPatient.lastName}
                     </p>
                   </div>
                 )}
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className={`mt-2 ${form.formState.errors.email ? 'border-red-300' : validationState.email === 'valid' ? 'border-green-300' : ''}`}
                    placeholder="Enter email address"
                    onChange={(e) => {
                      form.setValue("email", e.target.value);
                      validateField('email', e.target.value);
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('email')}
                  </div>
                </div>
                {form.formState.errors.email && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.email.message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Address (Optional)
              </Label>
              <Textarea
                id="address"
                {...form.register("address")}
                className={`mt-2 ${form.formState.errors.address ? 'border-red-300' : ''}`}
                placeholder="Enter full address"
                rows={3}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                {form.formState.errors.address && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.address.message}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {watchedValues.address?.length || 0}/200 characters
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Emergency Contact (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="emergencyContactName" className="text-sm font-medium text-gray-700">
                  Emergency Contact Name
                </Label>
                <Input
                  id="emergencyContactName"
                  {...form.register("emergencyContactName")}
                  className={`mt-2 ${form.formState.errors.emergencyContactName ? 'border-red-300' : ''}`}
                  placeholder="Enter emergency contact name"
                />
                {form.formState.errors.emergencyContactName && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.emergencyContactName.message}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="emergencyContactPhone" className="text-sm font-medium text-gray-700">
                  Emergency Contact Phone
                </Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  {...form.register("emergencyContactPhone")}
                  className={`mt-2 ${form.formState.errors.emergencyContactPhone ? 'border-red-300' : ''}`}
                  placeholder="Enter emergency contact phone"
                />
                {form.formState.errors.emergencyContactPhone && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.emergencyContactPhone.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Medical Information (Optional)</h3>
            
            <div>
              <Label htmlFor="medicalHistory" className="text-sm font-medium text-gray-700">
                Medical History, Allergies & Current Medications
              </Label>
              <Textarea
                id="medicalHistory"
                {...form.register("medicalHistory")}
                className={`mt-2 ${form.formState.errors.medicalHistory ? 'border-red-300' : ''}`}
                placeholder="Enter any relevant medical history, allergies, current medications, or health conditions"
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                {form.formState.errors.medicalHistory && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center font-medium">
                      <XCircle className="w-4 h-4 mr-1" />
                      {form.formState.errors.medicalHistory.message}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {watchedValues.medicalHistory?.length || 0}/1000 characters
                </p>
              </div>
            </div>
          </div>

         

        

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="text-red-500">*</span> Required fields
              </div>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    form.trigger(); // Trigger validation manually
                    console.log('Form errors:', form.formState.errors);
                    console.log('Form values:', form.getValues());
                  }}
                  className="text-xs"
                >
                  🧪 Test Validation
                </Button>
              )}
            </div>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
                disabled={patientMutation.isPending || !!existingPatient || !form.formState.isValid}
              >
                {patientMutation.isPending ? (
                  <>
                    <Search className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Patient"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
