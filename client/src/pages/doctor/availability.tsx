import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import { DAYS_OF_WEEK, TIME_SLOTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, X } from "lucide-react";

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isAvailable: z.boolean().default(true),
});

const leaveSchema = z.object({
  leaveDate: z.string().min(1, "Leave date is required"),
  reason: z.string().optional(),
});

type AvailabilityForm = z.infer<typeof availabilitySchema>;
type LeaveForm = z.infer<typeof leaveSchema>;

export default function DoctorAvailability() {
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const user = getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ["/api/doctors", user?.id, "availability"],
  });

  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ["/api/doctors", user?.id, "leaves"],
  });

  const availabilityForm = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true,
    },
  });

  const leaveForm = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveDate: "",
      reason: "",
    },
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityForm) => {
      const response = await apiRequest("POST", `/api/doctors/${user?.id}/availability`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", user?.id, "availability"] });
      availabilityForm.reset();
      setShowAvailabilityForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  const addLeaveMutation = useMutation({
    mutationFn: async (data: LeaveForm) => {
      const response = await apiRequest("POST", `/api/doctors/${user?.id}/leaves`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave day added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", user?.id, "leaves"] });
      leaveForm.reset();
      setShowLeaveForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add leave day",
        variant: "destructive",
      });
    },
  });

  const onAvailabilitySubmit = (data: AvailabilityForm) => {
    addAvailabilityMutation.mutate(data);
  };

  const onLeaveSubmit = (data: LeaveForm) => {
    addLeaveMutation.mutate(data);
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || "Unknown";
  };

  const groupedAvailability = availability.reduce((acc: any, item: any) => {
    if (!acc[item.dayOfWeek]) {
      acc[item.dayOfWeek] = [];
    }
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Availability Management" />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Weekly Schedule
                  </CardTitle>
                  <Button
                    onClick={() => setShowAvailabilityForm(!showAvailabilityForm)}
                    className="bg-medical-blue hover:bg-blue-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Hours
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAvailabilityForm && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-4">Add Available Hours</h4>
                    <Form {...availabilityForm}>
                      <form onSubmit={availabilityForm.handleSubmit(onAvailabilitySubmit)} className="space-y-4">
                        <FormField
                          control={availabilityForm.control}
                          name="dayOfWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day of Week</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map((day) => (
                                    <SelectItem key={day.value} value={day.value.toString()}>
                                      {day.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={availabilityForm.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={availabilityForm.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={availabilityForm.control}
                          name="isAvailable"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Available</FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            className="bg-medical-blue hover:bg-blue-600"
                            disabled={addAvailabilityMutation.isPending}
                          >
                            {addAvailabilityMutation.isPending ? "Adding..." : "Add"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAvailabilityForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}

                <div className="space-y-4">
                  {availabilityLoading ? (
                    <div className="text-center py-4">Loading schedule...</div>
                  ) : Object.keys(groupedAvailability).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No availability set. Add your working hours above.
                    </div>
                  ) : (
                    DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{day.label}</h4>
                        <div className="space-y-2">
                          {groupedAvailability[day.value] ? (
                            groupedAvailability[day.value].map((slot: any) => (
                              <div key={slot.id} className="flex items-center justify-between bg-green-50 p-2 rounded">
                                <span className="text-sm">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                                  {slot.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">Not available</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leave Days */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Leave Days
                  </CardTitle>
                  <Button
                    onClick={() => setShowLeaveForm(!showLeaveForm)}
                    className="bg-medical-green hover:bg-green-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Leave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showLeaveForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-4">Add Leave Day</h4>
                    <Form {...leaveForm}>
                      <form onSubmit={leaveForm.handleSubmit(onLeaveSubmit)} className="space-y-4">
                        <FormField
                          control={leaveForm.control}
                          name="leaveDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Leave Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={leaveForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason (Optional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} placeholder="Vacation, sick leave, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            className="bg-medical-green hover:bg-green-600"
                            disabled={addLeaveMutation.isPending}
                          >
                            {addLeaveMutation.isPending ? "Adding..." : "Add Leave"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLeaveForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}

                <div className="space-y-3">
                  {leavesLoading ? (
                    <div className="text-center py-4">Loading leave days...</div>
                  ) : leaves.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No leave days scheduled.
                    </div>
                  ) : (
                    leaves.map((leave: any) => (
                      <div key={leave.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(leave.leaveDate).toLocaleDateString()}
                          </p>
                          {leave.reason && (
                            <p className="text-sm text-gray-600">{leave.reason}</p>
                          )}
                        </div>
                        <Badge variant="destructive">
                          Leave
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
