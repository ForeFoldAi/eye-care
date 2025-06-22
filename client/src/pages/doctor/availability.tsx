import React, { useState, useEffect } from 'react';
import { Trash2, Clock, Plus, Calendar, Users, Edit2, MoreVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Header } from '@/components/layout/header';
import { authService } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

interface TimeSlot {
  startTime: string;
  endTime: string;
  hoursAvailable: number;
  tokenCount: number;
}

interface Availability {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DEFAULT_SLOT: TimeSlot = {
  startTime: '09:00',
  endTime: '10:00',
  hoursAvailable: 1,
  tokenCount: 10,
};
const API_URL = import.meta.env.VITE_API_URL;

export default function AvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [newSlot, setNewSlot] = useState<TimeSlot>(DEFAULT_SLOT);
  const { toast } = useToast();
  const user = authService.getStoredUser();
  const form = useForm({
    defaultValues: {
      dayOfWeek: '1',
      startTime: '09:00',
      endTime: '10:00',
      hoursAvailable: 1,
      tokenCount: 10,
    },
  });

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchAvailabilities = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to view availability',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/doctor/availability`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view availability',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to fetch availabilities');
      }

      const data = await response.json();
      setAvailabilities(data);
    } catch (error) {
      toast({
        title: 'Error fetching availabilities',
        description: 'Failed to load availability data',
        variant: 'destructive',
      });
    }
  };

  const handleAddTimeSlot = async (formData: any) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to add availability',
          variant: 'destructive',
        });
        return;
      }

      // Convert form data to the correct format
      const dayOfWeek = parseInt(formData.dayOfWeek);
      const newSlot = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        hoursAvailable: parseInt(formData.hoursAvailable),
        tokenCount: parseInt(formData.tokenCount),
      };

      // Find existing availability for the selected day
      const existingAvailability = availabilities.find(a => a.dayOfWeek === dayOfWeek);
      const slots = existingAvailability ? [...existingAvailability.slots, newSlot] : [newSlot];

      const response = await fetch(`${API_URL}/api/doctor/availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek,
          slots,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to add availability',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to add time slot');
      }

      toast({
        title: 'Success',
        description: 'Time slot added successfully',
      });

      fetchAvailabilities();
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add time slot',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAvailability = async (dayOfWeek: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to delete availability',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/doctor/availability/${dayOfWeek}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to delete availability',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to delete availability');
      }

      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });

      fetchAvailabilities();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete availability',
        variant: 'destructive',
      });
    }
  };

  const handleEditAvailability = (dayOfWeek: number) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Availability",
      description: "Edit functionality coming soon!",
    });
  };

  if (!user) return null;

  // Calculate some stats for the overview cards
  const totalSlots = availabilities.reduce((acc, curr) => acc + curr.slots.length, 0);
  const totalHours = availabilities.reduce((acc, curr) => 
    acc + curr.slots.reduce((sum, slot) => sum + slot.hoursAvailable, 0), 0
  );
  const totalTokens = availabilities.reduce((acc, curr) => 
    acc + curr.slots.reduce((sum, slot) => sum + slot.tokenCount, 0), 0
  );

  return (
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-blue-600">
                {totalSlots}
              </CardTitle>
              <CardDescription className="text-blue-600/80 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Total Time Slots
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-purple-600">
                {totalHours}h
              </CardTitle>
              <CardDescription className="text-purple-600/80 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Total Hours Available
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-emerald-600">
                {totalTokens}
              </CardTitle>
              <CardDescription className="text-emerald-600/80 flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Total Patient Tokens
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Time Slot Form */}
          <Card className="lg:col-span-1 border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Plus className="h-5 w-5 text-blue-500" />
                Add Time Slot
              </CardTitle>
              <CardDescription>
                Configure your availability for specific days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddTimeSlot)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Day of Week</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem
                                key={day.value}
                                value={day.value.toString()}
                                disabled={day.value === 0}
                                className="cursor-pointer"
                              >
                                {day.label} {day.value === 0 ? '(Holiday)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="focus:ring-2 focus:ring-blue-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="focus:ring-2 focus:ring-blue-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hoursAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Hours Available</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              className="focus:ring-2 focus:ring-blue-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tokenCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Tokens per Hour</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              className="focus:ring-2 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Maximum patients per hour
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Current Availability Table */}
          <Card className="lg:col-span-2 border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5 text-blue-500" />
                Current Availability
              </CardTitle>
              <CardDescription>
                Overview of your weekly availability schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold w-1/4">Day</TableHead>
                      <TableHead className="font-semibold w-1/2">Time Slots</TableHead>
                      <TableHead className="font-semibold text-right w-1/4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS.map((day) => {
                      const availability = availabilities.find(
                        (a) => a.dayOfWeek === day.value
                      );
                      return (
                        <TableRow key={day.value} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {day.label}
                              {day.value === 0 && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  Holiday
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              {availability?.slots.map((slot, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {slot.startTime} - {slot.endTime}
                                  </Badge>
                                  <span className="text-gray-600">
                                    ({slot.hoursAvailable}h, {slot.tokenCount} tokens)
                                  </span>
                                </div>
                              )) || (
                                <span className="text-gray-500 text-sm italic">
                                  No slots available
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {day.value !== 0 && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                  onClick={() => handleEditAvailability(day.value)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAvailability(day.value)}
                                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer">
                                      Copy Schedule
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                      Set as Default
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                      Export Schedule
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="cursor-pointer text-red-600 focus:text-red-600"
                                      onClick={() => handleDeleteAvailability(day.value)}
                                    >
                                      Delete Schedule
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
} 