import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertPrescriptionSchema, type InsertPrescription } from "@shared/schema";
import { getCurrentUser } from "@/lib/auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Minus } from "lucide-react";

interface PrescriptionFormModalProps {
  trigger?: React.ReactNode;
  patientId?: number;
  appointmentId?: number;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export function PrescriptionFormModal({ trigger, patientId, appointmentId }: PrescriptionFormModalProps) {
  const [open, setOpen] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getCurrentUser();

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !patientId, // Only fetch if patientId is not provided
  });

  const form = useForm<InsertPrescription>({
    resolver: zodResolver(insertPrescriptionSchema),
    defaultValues: {
      patientId: patientId || 0,
      doctorId: user?.id || 0,
      appointmentId: appointmentId || undefined,
      medications: "",
      instructions: "",
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: InsertPrescription) => {
      const prescriptionData = {
        ...data,
        medications: JSON.stringify(medications.filter(med => med.name.trim() !== "")),
      };
      const response = await apiRequest("POST", "/api/prescriptions", prescriptionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      form.reset();
      setMedications([{ name: "", dosage: "", frequency: "", duration: "" }]);
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      });
    },
  });

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updated);
  };

  const onSubmit = (data: InsertPrescription) => {
    if (medications.every(med => med.name.trim() === "")) {
      toast({
        title: "Error",
        description: "Please add at least one medication",
        variant: "destructive",
      });
      return;
    }
    createPrescriptionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-medical-blue hover:bg-blue-600">
            <FileText className="mr-2 h-4 w-4" />
            Write Prescription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write Prescription</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            {!patientId && (
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.firstName} {patient.lastName} - {patient.patientId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Medications</h4>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </div>
              
              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Medication {index + 1}</h5>
                      {medications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medication Name *
                        </label>
                        <Input
                          value={medication.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          placeholder="e.g., Amoxicillin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosage *
                        </label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency *
                        </label>
                        <Input
                          value={medication.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="e.g., 3 times daily"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration *
                        </label>
                        <Input
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Additional instructions for the patient..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-medical-blue hover:bg-blue-600"
                disabled={createPrescriptionMutation.isPending}
              >
                {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
