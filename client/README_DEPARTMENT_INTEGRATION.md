# Department Management Integration with MongoDB

This document explains how the Department Management and Staff Management components are integrated to share department data and persist it to MongoDB.

## Overview

The integration allows you to:
1. Create departments using the Department Management form - **saved to MongoDB**
2. Use those departments when adding staff members in the Staff Management form - **saved to MongoDB**
3. Share department data between components using React Context
4. **Persistent data storage** - data survives page refreshes and server restarts

## How It Works

### 1. Department Context Provider (MongoDB Connected)

The `DepartmentContext` (`client/src/contexts/DepartmentContext.tsx`) provides:
- **MongoDB Integration**: Connects to your existing `/api/departments` endpoints
- Shared state for all departments with real-time sync
- Functions to add, update, and delete departments in MongoDB
- Helper functions to get active departments
- **Error handling** and loading states

### 2. Staff Context Provider (MongoDB Connected)

The `StaffContext` (`client/src/contexts/StaffContext.tsx`) provides:
- **MongoDB Integration**: Connects to your existing `/api/users` endpoints
- Staff data persistence with real-time sync
- Functions to add, update, and delete staff members in MongoDB
- **Password validation** and secure user creation
- **Error handling** and loading states

### 3. Department Management Component

Located at `client/src/pages/sub-admin/DepartmentManagement.tsx`:
- Uses the `useDepartments` hook to access shared department state
- **Saves departments to MongoDB** via API calls
- Shows success/error notifications for database operations
- **Loading states** while saving to database
- Departments are immediately available for staff assignment

### 4. Staff Management Component

Located at `client/src/pages/sub-admin/StaffManagement.tsx`:
- Uses the `useDepartments` hook to get active departments from MongoDB
- Uses the `useStaff` hook to save staff data to MongoDB
- Populates department dropdown with departments from database
- Shows warning if no departments are available
- **Saves staff members to MongoDB** via API calls
- **Password validation** and secure user creation

## MongoDB Integration Details

### Database Schema

**Departments Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  branchId: ObjectId,
  hospitalId: ObjectId,
  headOfDepartment: String,
  isActive: Boolean,
  staff: [ObjectId], // References to User collection
  createdAt: Date,
  updatedAt: Date
}
```

**Users Collection (Staff Members):**
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  username: String,
  password: String, // Hashed
  role: String, // 'doctor', 'nurse', 'receptionist'
  phone: String,
  branchId: ObjectId,
  hospitalId: ObjectId,
  specialization: String,
  department: String,
  // ... additional fields
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints Used

**Departments:**
- `GET /api/departments/branch/:branchId` - Fetch departments for a branch
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

**Staff/Users:**
- `GET /api/users/branch/:branchId` - Fetch staff for a branch
- `POST /api/users` - Create new staff member
- `PUT /api/users/:id` - Update staff member
- `DELETE /api/users/:id` - Delete staff member

## Usage Flow

1. **Create Department**:
   - Navigate to Department Management
   - Fill out the department form with all required information
   - Submit the form
   - **Department is saved to MongoDB** and available immediately

2. **Add Staff Member**:
   - Navigate to Staff Management
   - Fill out the staff form
   - Select from available departments in the dropdown (from MongoDB)
   - Submit the form
   - **Staff member is saved to MongoDB** and assigned to the selected department

## Key Features

### ✅ MongoDB Persistence
- All data is saved to MongoDB collections
- Data survives page refreshes and server restarts
- Real-time synchronization between components

### ✅ Real-time Updates
- Departments created in Department Management are immediately available in Staff Management
- No page refresh required
- Automatic cache invalidation and refetching

### ✅ Error Handling
- Comprehensive error handling for database operations
- User-friendly error messages
- Loading states during database operations

### ✅ Security
- Password hashing for staff members
- Role-based access control
- Authentication token validation

### ✅ Validation
- Staff Management shows warning if no departments exist
- Password confirmation validation
- Form validation before database submission

### ✅ User Feedback
- Toast notifications confirm successful database operations
- Clear error messages guide users
- Loading indicators during database operations

## Technical Implementation

### Context Structure
```typescript
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
```

### Provider Setup
The providers are wrapped around the entire application in `client/src/router.tsx`:

```typescript
<QueryClientProvider client={queryClient}>
  <DepartmentProvider>
    <StaffProvider>
      <div>
        <Outlet />
        <Toaster />
      </div>
    </StaffProvider>
  </DepartmentProvider>
</QueryClientProvider>
```

### Database Operations
- **React Query** for efficient data fetching and caching
- **Mutations** for create, update, delete operations
- **Automatic cache invalidation** when data changes
- **Optimistic updates** for better user experience

## Environment Setup

Make sure your environment variables are configured:

```env
VITE_API_URL=http://localhost:3000
```

## Future Enhancements

1. **File Upload**: Support for document uploads (ID proof, licenses, etc.)
2. **Real-time Sync**: Add WebSocket support for multi-user environments
3. **Department Hierarchy**: Support for parent-child department relationships
4. **Advanced Filtering**: More sophisticated department filtering options
5. **Bulk Operations**: Support for bulk staff assignment to departments
6. **Audit Trail**: Track changes to departments and staff
7. **Backup & Recovery**: Database backup and recovery procedures

## Troubleshooting

### Database Connection Issues
If you see database connection errors:
1. Check if MongoDB server is running
2. Verify database connection string in server config
3. Check network connectivity between client and server

### No Departments Available
If the Staff Management form shows "No departments available":
1. Check if you're in Department Management and have created departments
2. Ensure departments are marked as "Active"
3. Verify the DepartmentProvider is properly set up in the router
4. Check browser console for API errors

### Staff Creation Fails
If staff member creation fails:
1. Check if the selected department exists in MongoDB
2. Verify all required fields are filled
3. Ensure passwords match
4. Check for duplicate email/username errors

### Context Errors
If you see "useDepartments must be used within a DepartmentProvider":
1. Check that DepartmentProvider is imported in router.tsx
2. Verify the provider wraps the application correctly
3. Ensure the import path is correct

### API Errors
If you see API-related errors:
1. Check if the server is running on the correct port
2. Verify VITE_API_URL environment variable
3. Check authentication token validity
4. Review server logs for detailed error messages 