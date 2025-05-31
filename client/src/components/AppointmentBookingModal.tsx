import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMutation, queryClient } from "@/lib/queryClient";
import { insertAppointmentSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AppointmentFormData = {
  patientId: number;
  doctorId: number;
  datetime: string;
  type: string;
  notes?: string;
};

export default function AppointmentBookingModal({ isOpen, onClose }: AppointmentBookingModalProps) {
  const { toast } = useToast();
  
  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const { data: doctors } = useQuery({
    queryKey: ['/api/doctors'],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(insertAppointmentSchema.omit({ status: true })),
    defaultValues: {
      patientId: 0,
      doctorId: 0,
      datetime: "",
      type: "",
      notes: "",
    },
  });

  const appointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          datetime: new Date(data.datetime).toISOString(),
          status: "scheduled",
        }),
      });
      if (!response.ok) throw new Error('Failed to book appointment');
      return response.json();
    },
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      form.reset();
      onClose();
      
      const patient = patients?.find((p: any) => p.id === newAppointment.patientId);
      const doctor = doctors?.find((d: any) => d.id === newAppointment.doctorId);
      
      toast({
        title: "Appointment Booked",
        description: `Appointment scheduled for ${patient?.firstName} ${patient?.lastName} with Dr. ${doctor?.firstName} ${doctor?.lastName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    appointmentMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Book Appointment
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
            <Label className="text-sm font-medium text-gray-700">Doctor *</Label>
            <Select
              value={form.watch("doctorId")?.toString() || ""}
              onValueChange={(value) => form.setValue("doctorId", parseInt(value))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors?.map((doctor: any) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.doctorId && (
              <p className="text-sm text-red-600 mt-1">
                Please select a doctor
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="datetime" className="text-sm font-medium text-gray-700">
              Date & Time *
            </Label>
            <Input
              id="datetime"
              type="datetime-local"
              {...form.register("datetime")}
              className="mt-2"
              min={new Date().toISOString().slice(0, 16)}
            />
            {form.formState.errors.datetime && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.datetime.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Appointment Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="checkup">Regular Checkup</SelectItem>
                <SelectItem value="follow-up">Follow-up Visit</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the appointment"
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
              className="bg-medical-green-500 hover:bg-medical-green-600 text-white"
              disabled={appointmentMutation.isPending}
            >
              {appointmentMutation.isPending ? "Booking..." : "Book Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
