import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertPrescriptionSchema, type InsertPrescription } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { authService } from "@/lib/auth";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  patientId?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrescriptionModal({ isOpen, onClose, onSuccess }: PrescriptionModalProps) {
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => authService.getCurrentUser().then(res => res.user),
  });
  
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/patients");
      return response.json();
    },
  });

  const form = useForm<InsertPrescription>({
    resolver: zodResolver(insertPrescriptionSchema),
    defaultValues: {
      patientId: "",
      doctorId: currentUser?.id || "",
      medications: [{ name: "", dosage: "", frequency: "" }],
      instructions: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (currentUser?.id) {
      form.setValue("doctorId", currentUser.id, { shouldValidate: true });
    }
  }, [currentUser, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications"
  });

  const onSubmit = async (data: InsertPrescription) => {
    if (!data.doctorId) {
      toast({
        title: "Error",
        description: "Doctor ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }
    console.log('Prescription form submitted', data);
    if (!data.medications || data.medications.length === 0 || !data.medications.some(med => med.name.trim() !== "")) {
      toast({
        title: "Error",
        description: "At least one medication is required. Please add at least one valid medication before submitting.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await apiRequest("POST", "/api/prescriptions", data);
      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = errorData.message || "Failed to create prescription.";
        if (errorMsg.toLowerCase().includes('duplicate')) {
          errorMsg = 'A prescription for this patient and date already exists.';
        }
        throw new Error(errorMsg);
      }
      toast({
        title: "Success",
        description: "Prescription has been created successfully.",
      });
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create prescription. Please check all fields and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Write Prescription
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Fill out the prescription details for the selected patient. All fields marked with * are required.
        </DialogDescription>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...form.register("doctorId")}/>
          <div>
            <Label className="text-sm font-medium text-gray-700">Patient *</Label>
            <Select
              value={form.watch("patientId")}
              onValueChange={(value) => form.setValue("patientId", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName} {patient.patientId ? `- ${patient.patientId}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.patientId && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.patientId.message}
              </p>
            )}
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Medications *</h4>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", dosage: "", frequency: "" })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 gap-2 p-2 border rounded">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      {...form.register(`medications.${index}.name` as const)}
                      placeholder="Medication name"
                      required
                    />
                    {form.formState.errors.medications && Array.isArray(form.formState.errors.medications) && form.formState.errors.medications[index]?.name && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.medications[index]?.name?.message as string}</p>
                    )}
                  </div>
                  <div>
                    <Label>Dosage *</Label>
                    <Input
                      {...form.register(`medications.${index}.dosage` as const)}
                      placeholder="Dosage"
                      required
                    />
                    {form.formState.errors.medications && Array.isArray(form.formState.errors.medications) && form.formState.errors.medications[index]?.dosage && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.medications[index]?.dosage?.message as string}</p>
                    )}
                  </div>
                  <div>
                    <Label>Frequency *</Label>
                    <Input
                      {...form.register(`medications.${index}.frequency` as const)}
                      placeholder="Frequency"
                      required
                    />
                    {form.formState.errors.medications && Array.isArray(form.formState.errors.medications) && form.formState.errors.medications[index]?.frequency && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.medications[index]?.frequency?.message as string}</p>
                    )}
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Input
                      {...form.register(`medications.${index}.duration` as const)}
                      placeholder="Duration (optional)"
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                      className="col-span-2"
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Remove Medication
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Show validation error for medications if present */}
            {form.formState.errors.medications && !Array.isArray(form.formState.errors.medications) && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.medications.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">
              Instructions
            </Label>
            <Textarea
              id="instructions"
              placeholder="Special instructions for the patient (e.g., take with food, avoid alcohol)"
              {...form.register("instructions")}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or observations"
              {...form.register("notes")}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Prescription
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
