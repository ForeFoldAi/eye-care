import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';

export interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string; // Alias for phoneNumber
  phoneNumber?: string;
  role: 'doctor' | 'receptionist' | 'nurse' | 'admin';
  specialization?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  
  // Extended staff information
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  emergencyContact?: string;
  employeeId?: string;
  joiningDate?: string;
  shiftTiming?: 'morning' | 'evening' | 'night' | 'other' | undefined;

  highestQualification?: string;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  certifications?: string;
  previousHospitals?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface StaffFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  photo: File | null;
  contactNumber: string;
  email: string;
  emergencyContact: string;
  
  // Job Details
  role: 'doctor' | 'receptionist' | 'nurse' | 'admin' | 'other';
  department: string;
  specialization: string;
  employeeId: string;
  joiningDate: string;
  shiftTiming: 'morning' | 'evening' | 'night' | 'other' | undefined;

  
  // Qualifications & Experience
  highestQualification: string;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  certifications: string;
  previousHospitals: string;
  
  // Address Information
  currentAddress: string;
  permanentAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // System Access
  username: string;
  systemRole: 'admin' | 'doctor' | 'nurse' | 'receptionist';
  password: string;
  confirmPassword: string;
  
  // Documents
  idProof: File | null;
  degreeLicense: File | null;
  resume: File | null;
}

interface StaffContextType {
  staff: StaffMember[];
  isLoading: boolean;
  error: Error | null;
  addStaff: (staffData: StaffFormData) => Promise<void>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  getStaffByDepartment: (department: string) => StaffMember[];
  getStaffById: (id: string) => StaffMember | undefined;
  refetchStaff: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};

interface StaffProviderProps {
  children: ReactNode;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const StaffProvider: React.FC<StaffProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const user = authService.getStoredUser();

  // Fetch staff from API - only for roles that need staff management
  const { 
    data: staff = [], 
    isLoading, 
    error, 
    refetch: refetchStaff 
  } = useQuery({
    queryKey: ['staff', user?.branchId],
    queryFn: async () => {
      if (!user?.branchId) {
        throw new Error('No branch ID available');
      }

      const response = await fetch(`${API_URL}/api/users/branch/${user.branchId}`, {
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff members');
      }

      const users = await response.json();
      
      // Filter to only show staff members (doctors, nurses, receptionists)
      return users.filter((user: any) => 
        ['doctor', 'nurse', 'receptionist'].includes(user.role)
      );
    },
    enabled: !!user?.branchId && ['admin', 'sub_admin'].includes(user?.role || ''),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (staffData: StaffFormData) => {
      if (!user?.branchId) {
        throw new Error('No branch ID available');
      }

      // Validate password match
      if (staffData.password !== staffData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: staffData.firstName,
          lastName: staffData.lastName,
          email: staffData.email,
          username: staffData.username,
          password: staffData.password,
          role: staffData.systemRole,
          phoneNumber: staffData.contactNumber,
          branchId: user.branchId,
          hospitalId: user.hospitalId,
          // Extended staff information
          gender: staffData.gender,
          dateOfBirth: staffData.dateOfBirth,
          emergencyContact: staffData.emergencyContact,
          employeeId: staffData.employeeId,
          joiningDate: staffData.joiningDate,
          shiftTiming: staffData.shiftTiming,

          highestQualification: staffData.highestQualification,
          medicalLicenseNumber: staffData.medicalLicenseNumber,
          yearsOfExperience: staffData.yearsOfExperience,
          certifications: staffData.certifications,
          previousHospitals: staffData.previousHospitals,
          currentAddress: staffData.currentAddress,
          permanentAddress: staffData.permanentAddress,
          city: staffData.city,
          state: staffData.state,
          zipCode: staffData.zipCode,
          department: staffData.department,
          specialization: staffData.specialization,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create staff member');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      console.error('Error creating staff member:', error);
    }
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffMember> }) => {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update staff member');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      console.error('Error updating staff member:', error);
    }
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete staff member');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      console.error('Error deleting staff member:', error);
    }
  });

  const addStaff = async (staffData: StaffFormData) => {
    await addStaffMutation.mutateAsync(staffData);
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    await updateStaffMutation.mutateAsync({ id, updates });
  };

  const deleteStaff = async (id: string) => {
    await deleteStaffMutation.mutateAsync(id);
  };

  const getStaffByDepartment = (department: string) => {
    return staff.filter((member: StaffMember) => member.department?.toLowerCase() === department.toLowerCase());
  };

  const getStaffById = (id: string) => {
    return staff.find((member: StaffMember) => member._id === id);
  };

  const value: StaffContextType = {
    staff,
    isLoading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    getStaffByDepartment,
    getStaffById,
    refetchStaff
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
}; 