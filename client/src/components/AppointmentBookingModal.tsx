import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {  Clock, Stethoscope, Activity, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  hoursAvailable: number;
  bookedTokens: number[];
}

interface DoctorAvailability {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  slots: TimeSlot[];
  isAvailable: boolean;
}

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient?: Patient | null;
  onSuccess: () => void;
}

export default function AppointmentBookingModal({ 
  isOpen, 
  onClose,
  selectedPatient,
  onSuccess
}: AppointmentBookingModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'consultation' | 'checkup' | 'follow-up'>('consultation');
  const [localSelectedPatient, setLocalSelectedPatient] = useState<Patient | null>(selectedPatient || null);
  
  const API_URL = import.meta.env.VITE_API_URL;

const { data: patients } = useQuery<Patient[]>({
  queryKey: ['/api/patients'],
  queryFn: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      return data.data.patients.map((p: any) => ({
        ...p,
        id: p._id?.toString() || p.patientId || ''
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      if (error instanceof Error && error.message.includes('Session expired')) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        navigate('/login');
      }
      throw error;
    }
  },
  enabled: !selectedPatient,
  retry: false
});


const { data: doctors = [] } = useQuery<Doctor[]>({
  queryKey: ['/api/doctors'],
  queryFn: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      return data.map((doctor: any) => ({
        id: doctor._id?.toString() || doctor.id || '',
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization
      }));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      if (error instanceof Error && error.message.includes('Session expired')) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        navigate('/login');
      }
      throw error;
    }
  },
  retry: false
});

const { data: doctorAvailabilityData, isLoading: isLoadingAvailability } = useQuery<DoctorAvailability | null, Error>({
  queryKey: ['doctorAvailability', selectedDoctor, selectedDate],
  queryFn: async () => {
    try {
      if (!selectedDoctor || !selectedDate) return null;

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login again",
          variant: "destructive",
        });
        navigate('/login');
        return null;
      }

      const dayOfWeek = new Date(selectedDate).getDay();

      console.log(`[Frontend] Fetching availability for doctorId: ${selectedDoctor}, dayOfWeek: ${dayOfWeek}`);

      const response = await fetch(
        `${API_URL}/api/doctors/${selectedDoctor}/availability?dayOfWeek=${dayOfWeek}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('token');
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        navigate('/login');
        return null;
      }

      if (!response.ok) {
        if (response.status === 200) {
          const data = await response.json();
          return data;
        }
        throw new Error('Failed to fetch doctor availability');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch doctor availability",
        variant: "destructive",
      });
      return null;
    }
  },
  enabled: !!selectedDoctor && !!selectedDate,
  retry: false,
  staleTime: 30000 // Cache for 30 seconds
});

const bookAppointmentMutation = useMutation({
  mutationFn: async (data: { 
    patientId: string; 
    doctorId: string; 
    datetime: string; 
    tokenNumber: number;
    type: 'consultation' | 'checkup' | 'follow-up';
  }) => {
    try {
      console.log("Attempting to book appointment with data:", data);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log("Appointment booking API response status:", response.status);

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const error = await response.json();
        console.error("Appointment booking failed with error:", error);
        throw new Error(error.message || 'Failed to book appointment');
      }

      const result = await response.json();
      console.log("Appointment booked successfully:", result);
      return result;
    } catch (error) {
      console.error('Error booking appointment:', error);
      if (error instanceof Error && error.message.includes('Session expired')) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        navigate('/login');
      }
      throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    queryClient.invalidateQueries({ queryKey: ['doctorAvailability', selectedDoctor, selectedDate] }); // Invalidate availability to show updated tokens
    onClose();
    onSuccess();
    toast({
      title: "Success",
      description: "Appointment booked successfully",
    });
  },
  onError: (error: Error) => {
    console.error("Appointment booking mutation error:", error);
    if (!error.message.includes('Session expired')) {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    }
  },
});

  const getAvailableTokens = (slot: TimeSlot) => {
    const durationHours = (new Date(`2000-01-01T${slot.endTime}`).getTime() - new Date(`2000-01-01T${slot.startTime}`).getTime()) / (1000 * 60 * 60);
    const totalTokens = Math.floor(durationHours * 10); // 10 tokens per hour
    const bookedTokens = slot.bookedTokens || [];
    const availableTokens = [];

    for (let i = 1; i <= totalTokens; i++) {
      if (!bookedTokens.includes(i)) {
        availableTokens.push(i);
      }
    }
    return availableTokens;
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setSelectedToken(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Book New Appointment</DialogTitle>
          <DialogDescription className="text-gray-500">
            Fill in the details below to schedule a new appointment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Patient Information</Label>
              {selectedPatient ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p className="text-sm text-gray-500">{selectedPatient.phone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Select
                  value={localSelectedPatient?.id || ''}
                  onValueChange={(value) => {
                    const patient = patients?.find(p => p.id === value);
                    setLocalSelectedPatient(patient || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                          <span className="text-gray-500">- {patient.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Select Doctor</Label>
              <Select
                value={selectedDoctor || ''}
                onValueChange={setSelectedDoctor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</span>
                        <span className="text-gray-500">- {doctor.specialization}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Appointment Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Appointment Type</Label>
              <Select
                value={selectedType}
                onValueChange={(value: 'consultation' | 'checkup' | 'follow-up') => setSelectedType(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-blue-500" />
                      <span>Consultation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="checkup">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span>Checkup</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="follow-up">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>Follow-up</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Select Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
          </div>

          {/* Time Slot and Token Selection */}
          {selectedDoctor && selectedDate && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">Available Time Slots</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingAvailability ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-gray-500">Loading available slots...</span>
                    </div>
                  </div>
                ) : (!doctorAvailabilityData || doctorAvailabilityData.slots.length === 0) ? (
                  <div className="col-span-full text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No time slots available for this date</p>
                  </div>
                ) : (
                  doctorAvailabilityData.slots.map((slot) => {
                    const availableTokens = getAvailableTokens(slot);
                    const isSlotSelected = selectedTimeSlot === slot;
                    return (
                      <div 
                        key={`${slot.startTime}-${slot.endTime}`} 
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isSlotSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm'
                        }`}
                        onClick={() => {
                          if (availableTokens.length > 0) {
                            setSelectedTimeSlot(slot);
                            setSelectedToken(null);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                          </div>
                          <Badge variant={availableTokens.length > 0 ? "default" : "secondary"}>
                            {availableTokens.length} tokens left
                          </Badge>
                        </div>
                        
                        {availableTokens.length > 0 ? (
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Select Token</Label>
                            <div className="grid grid-cols-5 gap-2">
                              {availableTokens.map((token) => (
                                <Button
                                  key={token}
                                  type="button"
                                  variant={isSlotSelected && selectedToken === token ? "default" : "outline"}
                                  size="sm"
                                  className={`w-full ${
                                    isSlotSelected && selectedToken === token 
                                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                      : 'hover:bg-blue-50'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSlotSelected) {
                                      setSelectedToken(token);
                                    }
                                  }}
                                >
                                  #{token}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-500">No tokens available</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Book Appointment Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("Book Appointment button clicked.");
                const effectivePatient = selectedPatient || localSelectedPatient;
                if (!effectivePatient?.id) {
                  toast({
                    title: "Error",
                    description: "Please select a patient first",
                    variant: "destructive",
                  });
                  console.log("Validation failed: Patient not selected.");
                  return;
                }
                if (!selectedDoctor || !selectedDate || !selectedTimeSlot || !selectedToken) {
                  toast({
                    title: "Error",
                    description: "Please fill in all required fields",
                    variant: "destructive",
                  });
                  console.log("Validation failed: Missing required fields.", { selectedDoctor, selectedDate, selectedTimeSlot, selectedToken });
                  return;
                }
                console.log("All validations passed. Initiating bookAppointmentMutation.");
                bookAppointmentMutation.mutate({
                  patientId: effectivePatient.id,
                  doctorId: selectedDoctor,
                  datetime: `${selectedDate}T${selectedTimeSlot.startTime}`,
                  tokenNumber: selectedToken,
                  type: selectedType
                });
              }}
              disabled={bookAppointmentMutation.isPending}
              className="px-6"
            >
              {bookAppointmentMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Booking...</span>
                </div>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
