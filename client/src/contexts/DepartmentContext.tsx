import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';

export interface Department {
  _id: string;
  name: string;
  description: string;
  headOfDepartment: string;
  staffCount: number;
  activePatients: number;
  totalAppointments: number;
  isActive: boolean;
  createdAt: string;
  staff: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    specialization: string;
  }>;
  branchId: string; // Added for branch-level filtering
}

export interface DepartmentFormData {
  // Basic Information
  departmentName: string;
  departmentCode: string;
  departmentType: 'clinical' | 'administrative' | 'support' | 'other';
  customDepartmentType: string;
  description: string;
  
  // Contact & Location
  phoneNumber: string;
  emailAddress: string;
  floorWing: string;
  roomNumberLocation: string;
  
  // Department Head
  headOfDepartment: string;
  staffCountLimit: number;
  
  // Metadata (auto-handled)
  createdDate: string;
  createdBy: string;
}

interface DepartmentContextType {
  departments: Department[];
  isLoading: boolean;
  error: Error | null;
  addDepartment: (departmentData: DepartmentFormData) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  getActiveDepartments: () => Department[];
  getDepartmentById: (id: string) => Department | undefined;
  getDepartmentByName: (name: string) => Department | undefined;
  refetchDepartments: () => void;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartments must be used within a DepartmentProvider');
  }
  return context;
};

interface DepartmentProviderProps {
  children: ReactNode;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const DepartmentProvider: React.FC<DepartmentProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const user = authService.getStoredUser();

  // Provide default values when user is not available
  const defaultDepartments: Department[] = [];

  // Fetch departments from API
  const { 
    data: departments = defaultDepartments, 
    isLoading, 
    error, 
    refetch: refetchDepartments 
  } = useQuery({
    queryKey: ['departments', user?.branchId],
    queryFn: async () => {
      if (!user?.branchId) {
        return defaultDepartments;
      }

      const response = await fetch(`${API_URL}/api/departments/branch/${user.branchId}`, {
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      return response.json();
    },
    enabled: !!user?.branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add department mutation
  const addDepartmentMutation = useMutation({
    mutationFn: async (departmentData: DepartmentFormData) => {
      if (!user?.branchId) {
        throw new Error('No branch ID available');
      }

      const response = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: departmentData.departmentName,
          description: departmentData.description,
          branchId: user.branchId,
          headOfDepartment: departmentData.headOfDepartment === 'none' ? '' : departmentData.headOfDepartment,
          // Add additional fields as needed
          departmentCode: departmentData.departmentCode,
          departmentType: departmentData.departmentType,
          phoneNumber: departmentData.phoneNumber,
          emailAddress: departmentData.emailAddress,
          floorWing: departmentData.floorWing,
          roomNumberLocation: departmentData.roomNumberLocation,
          staffCountLimit: departmentData.staffCountLimit,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create department');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error creating department:', error);
    }
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Department> }) => {
      const response = await fetch(`${API_URL}/api/departments/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update department');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error updating department:', error);
    }
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      console.error('Error deleting department:', error);
    }
  });

  const addDepartment = async (departmentData: DepartmentFormData) => {
    await addDepartmentMutation.mutateAsync(departmentData);
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    await updateDepartmentMutation.mutateAsync({ id, updates });
  };

  const deleteDepartment = async (id: string) => {
    await deleteDepartmentMutation.mutateAsync(id);
  };

  const getActiveDepartments = () => {
    return departments.filter((dept: Department) => dept.isActive);
  };

  const getDepartmentById = (id: string) => {
    return departments.find((dept: Department) => dept._id === id);
  };

  const getDepartmentByName = (name: string) => {
    return departments.find((dept: Department) => dept.name.toLowerCase() === name.toLowerCase());
  };

  const value: DepartmentContextType = {
    departments,
    isLoading,
    error,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getActiveDepartments,
    getDepartmentById,
    getDepartmentByName,
    refetchDepartments
  };

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
}; 