import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Phone } from "lucide-react";

export default function DoctorAppointments() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const user = getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments", { doctorId: user?.id, date: selectedDate }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment status updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return "bg-green-100 text-green-800";
      case APPOINTMENT_STATUS.WAITING:
        return "bg-yellow-100 text-yellow-800";
      case APPOINTMENT_STATUS.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case APPOINTMENT_STATUS.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case APPOINTMENT_STATUS.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return "Confirmed";
      case APPOINTMENT_STATUS.WAITING:
        return "Waiting";
      case APPOINTMENT_STATUS.IN_PROGRESS:
        return "In Progress";
      case APPOINTMENT_STATUS.COMPLETED:
        return "Completed";
      case APPOINTMENT_STATUS.SCHEDULED:
        return "Scheduled";
      case APPOINTMENT_STATUS.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleStatusUpdate = (appointmentId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Appointments" />
        
        <main className="p-6">
          {/* Date Filter */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Appointments for {new Date(selectedDate).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments scheduled for this date
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment: any) => (
                    <div key={appointment.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {getInitials(appointment.patient.firstName, appointment.patient.lastName)}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{appointment.appointmentTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{appointment.patient.patientId}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{appointment.patient.phone}</span>
                              </div>
                            </div>
                            
                            {appointment.reason && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Reason:</span> {appointment.reason}
                                </p>
                              </div>
                            )}
                            
                            {appointment.notes && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Notes:</span> {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {appointment.status === APPOINTMENT_STATUS.SCHEDULED && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.CONFIRMED)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Confirm
                            </Button>
                          )}
                          
                          {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.IN_PROGRESS)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Start
                            </Button>
                          )}
                          
                          {appointment.status === APPOINTMENT_STATUS.IN_PROGRESS && (
                            <Button
                              size="sm"
                              className="bg-gray-600 hover:bg-gray-700"
                              onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.COMPLETED)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Complete
                            </Button>
                          )}
                          
                          {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                           appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.CANCELLED)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
