import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ShiftTiming {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  isActive: boolean;
  departmentId?: string;
}

interface ShiftContextType {
  shiftTimings: ShiftTiming[];
  isLoading: boolean;
  error: Error | null;
  addShift: (shiftData: Omit<ShiftTiming, '_id'>) => Promise<void>;
  updateShift: (id: string, updates: Partial<ShiftTiming>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  getShiftsByDepartment: (departmentId?: string) => ShiftTiming[];
  getShiftById: (id: string) => ShiftTiming | undefined;
  refetchShifts: () => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const useShifts = () => {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShifts must be used within a ShiftProvider');
  }
  return context;
};

interface ShiftProviderProps {
  children: ReactNode;
}

export const ShiftProvider: React.FC<ShiftProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize with default shifts
  const [shiftTimings, setShiftTimings] = useState<ShiftTiming[]>([
    {
      _id: '1',
      name: 'Morning Shift',
      startTime: '06:00',
      endTime: '14:00',
      description: 'Early morning shift for morning operations',
      isActive: true
    },
    {
      _id: '2',
      name: 'Evening Shift',
      startTime: '14:00',
      endTime: '22:00',
      description: 'Afternoon to evening shift',
      isActive: true
    },
    {
      _id: '3',
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      description: 'Overnight shift for emergency services',
      isActive: true
    },
    {
      _id: '4',
      name: 'Part-time Morning',
      startTime: '08:00',
      endTime: '12:00',
      description: 'Part-time morning shift',
      isActive: true
    },
    {
      _id: '5',
      name: 'Part-time Evening',
      startTime: '16:00',
      endTime: '20:00',
      description: 'Part-time evening shift',
      isActive: true
    }
  ]);

  const addShift = async (shiftData: Omit<ShiftTiming, '_id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newShift: ShiftTiming = {
        _id: Date.now().toString(),
        ...shiftData
      };
      
      setShiftTimings(prev => [...prev, newShift]);
      
      // TODO: Add API call to save to backend
      // const response = await fetch('/api/shifts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(shiftData)
      // });
      // if (!response.ok) throw new Error('Failed to create shift');
      
      toast({
        title: "Shift Created",
        description: `${shiftData.name} has been successfully created.`,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create shift');
      setError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateShift = async (id: string, updates: Partial<ShiftTiming>) => {
    setIsLoading(true);
    setError(null);
    try {
      setShiftTimings(prev => 
        prev.map(shift => 
          shift._id === id ? { ...shift, ...updates } : shift
        )
      );
      
      // TODO: Add API call to update backend
      
      toast({
        title: "Shift Updated",
        description: "Shift has been successfully updated.",
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update shift');
      setError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShift = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setShiftTimings(prev => prev.filter(shift => shift._id !== id));
      
      // TODO: Add API call to delete from backend
      
      toast({
        title: "Shift Deleted",
        description: "Shift has been successfully deleted.",
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete shift');
      setError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getShiftsByDepartment = (departmentId?: string) => {
    if (!departmentId) return shiftTimings.filter(shift => !shift.departmentId);
    return shiftTimings.filter(shift => 
      shift.departmentId === departmentId || !shift.departmentId
    );
  };

  const getShiftById = (id: string) => {
    return shiftTimings.find(shift => shift._id === id);
  };

  const refetchShifts = () => {
    // TODO: Add API call to fetch shifts from backend
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const value: ShiftContextType = {
    shiftTimings,
    isLoading,
    error,
    addShift,
    updateShift,
    deleteShift,
    getShiftsByDepartment,
    getShiftById,
    refetchShifts
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
}; 