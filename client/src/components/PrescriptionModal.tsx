import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertPrescriptionSchema, type InsertPrescription } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  const [medications, setMedications] = useState<Medication[]>([{ name: "", dosage: "", frequency: "" }]);

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
      medications: [],
      instructions: "",
      notes: "",
    },
  });

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "" }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = { 
      ...updatedMedications[index], 
      [field]: field === 'quantity' ? Number(value) : value 
    };
    setMedications(updatedMedications);
  };

  const onSubmit = async (data: InsertPrescription) => {
    if (medications.length === 0 || !medications.some(med => med.name.trim() !== "")) {
      toast({
        title: "Error",
        description: "At least one medication is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/prescriptions", {
        ...data,
        medications: medications.filter(med => med.name.trim() !== ""),
      });

      if (!response.ok) {
        throw new Error("Failed to create prescription");
      }

      toast({
        title: "Success",
        description: "Prescription has been created successfully",
      });
      form.reset();
      setMedications([{ name: "", dosage: "", frequency: "" }]);
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create prescription",
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </div>
            
            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded">
            <div>
                    <Label>Name *</Label>
                    <Input
                      value={medication.name}
                      onChange={(e) => updateMedication(index, "name", e.target.value)}
                      placeholder="Medication name"
                      required
                    />
            </div>
                  <div>
                    <Label>Dosage *</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      placeholder="Dosage"
                      required
                    />
          </div>
            <div>
                    <Label>Frequency *</Label>
              <Input
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                      placeholder="Frequency"
                      required
              />
            </div>
            <div>
                    <Label>Duration</Label>
                    <Input
                      value={medication.duration || ""}
                      onChange={(e) => updateMedication(index, "duration", e.target.value)}
                      placeholder="Duration (optional)"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity</Label>
              <Input
                type="number"
                      value={medication.quantity || ""}
                      onChange={(e) => updateMedication(index, "quantity", e.target.value)}
                      placeholder="Quantity (optional)"
                    />
                  </div>
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeMedication(index)}
                      className="col-span-2"
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Remove Medication
                    </Button>
                  )}
                </div>
              ))}
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
