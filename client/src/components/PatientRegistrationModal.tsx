import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, queryClient } from "@/lib/queryClient";
import { insertPatientSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PatientFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
};

export default function PatientRegistrationModal({ isOpen, onClose }: PatientRegistrationModalProps) {
  const { toast } = useToast();
  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      medicalHistory: "",
    },
  });

  const patientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to register patient');
      return response.json();
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      form.reset();
      onClose();
      toast({
        title: "Patient Registered",
        description: `${newPatient.firstName} ${newPatient.lastName} has been successfully registered.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientFormData) => {
    patientMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Register New Patient
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name *
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                className="mt-2"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name *
              </Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                className="mt-2"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.lastName.message}
                </p>
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
                className="mt-2"
              />
              {form.formState.errors.dateOfBirth && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Gender *</Label>
              <Select
                value={form.watch("gender")}
                onValueChange={(value) => form.setValue("gender", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.gender && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.gender.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                className="mt-2"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="mt-2"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">
              Address
            </Label>
            <Textarea
              id="address"
              {...form.register("address")}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="emergencyContactName" className="text-sm font-medium text-gray-700">
                Emergency Contact Name
              </Label>
              <Input
                id="emergencyContactName"
                {...form.register("emergencyContactName")}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyContactPhone" className="text-sm font-medium text-gray-700">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                {...form.register("emergencyContactPhone")}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="medicalHistory" className="text-sm font-medium text-gray-700">
              Medical History
            </Label>
            <Textarea
              id="medicalHistory"
              placeholder="Previous surgeries, chronic conditions, allergies, etc."
              {...form.register("medicalHistory")}
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
              disabled={patientMutation.isPending}
            >
              {patientMutation.isPending ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
