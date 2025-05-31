import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMutation, queryClient } from "@/lib/queryClient";
import { insertPrescriptionSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PrescriptionFormData = {
  patientId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  notes?: string;
};

export default function PrescriptionModal({ isOpen, onClose }: PrescriptionModalProps) {
  const { toast } = useToast();
  
  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(insertPrescriptionSchema.omit({ doctorId: true })),
    defaultValues: {
      patientId: 0,
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: undefined,
      instructions: "",
      notes: "",
    },
  });

  const prescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create prescription');
      return response.json();
    },
    onSuccess: (newPrescription) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      form.reset();
      onClose();
      toast({
        title: "Prescription Created",
        description: `Prescription for ${newPrescription.medication} has been successfully created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrescriptionFormData) => {
    prescriptionMutation.mutate(data);
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
            Write Prescription
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">Patient *</Label>
            <Select
              value={form.watch("patientId")?.toString() || ""}
              onValueChange={(value) => form.setValue("patientId", parseInt(value))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient: any) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.patientId && (
              <p className="text-sm text-red-600 mt-1">
                Please select a patient
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="medication" className="text-sm font-medium text-gray-700">
              Medication Name *
            </Label>
            <Input
              id="medication"
              placeholder="e.g., Lisinopril, Metformin, Amoxicillin"
              {...form.register("medication")}
              className="mt-2"
            />
            {form.formState.errors.medication && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.medication.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="dosage" className="text-sm font-medium text-gray-700">
                Dosage *
              </Label>
              <Input
                id="dosage"
                placeholder="e.g., 10mg, 500mg"
                {...form.register("dosage")}
                className="mt-2"
              />
              {form.formState.errors.dosage && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.dosage.message}
                </p>
              )}
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Frequency *</Label>
              <Select
                value={form.watch("frequency")}
                onValueChange={(value) => form.setValue("frequency", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_daily">Once daily</SelectItem>
                  <SelectItem value="twice_daily">Twice daily</SelectItem>
                  <SelectItem value="three_times_daily">Three times daily</SelectItem>
                  <SelectItem value="four_times_daily">Four times daily</SelectItem>
                  <SelectItem value="as_needed">As needed</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.frequency && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.frequency.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                Duration
              </Label>
              <Input
                id="duration"
                placeholder="e.g., 7 days, 2 weeks, 1 month"
                {...form.register("duration")}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 30, 60, 90"
                {...form.register("quantity", { valueAsNumber: true })}
                className="mt-2"
              />
            </div>
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

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
              disabled={prescriptionMutation.isPending}
            >
              {prescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
