# Chat & Notification Messaging Rules

## 🏥 **Updated Role-Based Messaging Rules**

### **Chat Messaging Permissions**

| Role | Can Message | Description |
|------|-------------|-------------|
| **Master Admin** | `admin` | Service/support channel - only admins can contact master admin |
| **Admin** | `master_admin`, `doctor`, `receptionist`, `sub_admin` | Full access to communicate with everyone |
| **Sub Admin** | `doctor`, `receptionist` | Can communicate with medical staff |
| **Doctor** | `admin`, `sub_admin`, `doctor`, `receptionist` | Can message other doctors and receptionists within hospital |
| **Receptionist** | `admin`, `sub_admin`, `doctor` | Can message doctors for coordination |

### **Notification Permissions**

| Role | Can Send Notifications To | Description |
|------|---------------------------|-------------|
| **Master Admin** | `admin`, `sub_admin`, `doctor`, `receptionist` | Can notify everyone in the hospital |
| **Admin** | `master_admin`, `doctor`, `receptionist`, `sub_admin` | Can notify everyone including master admin |
| **Sub Admin** | `doctor`, `receptionist` | Can notify medical staff |
| **Doctor** | `doctor`, `receptionist` | Can notify other doctors and receptionists |
| **Receptionist** | `doctor` | Can notify doctors |

## 🔄 **Communication Flow**

### **Doctor ↔ Doctor Communication**
- ✅ **Doctors can message other doctors** within the same hospital
- ✅ **Doctors can send notifications to other doctors**
- 🔒 **Tenant isolation** - only within the same hospital

### **Doctor ↔ Receptionist Communication**
- ✅ **Doctors can message receptionists** within the same hospital
- ✅ **Receptionists can message doctors** within the same hospital
- ✅ **Doctors can send notifications to receptionists**
- ✅ **Receptionists can send notifications to doctors**

### **Admin ↔ Master Admin Communication**
- ✅ **Only admins can chat with master admin** (service/support channel)
- ✅ **Admins can send notifications to master admin**
- ✅ **Master admin can send notifications to admins**

### **Cross-Role Communication**
- ✅ **Admins can communicate with all roles**
- ✅ **Sub admins can communicate with doctors and receptionists**
- 🔒 **Doctors and receptionists cannot message each other** (unless through admin)

## 🏢 **Multi-Tenant Isolation**

### **Hospital-Level Isolation**
- All communications are scoped to the user's hospital
- No cross-hospital messaging or notifications
- Each hospital operates in complete isolation

### **Branch-Level Isolation** (Optional)
- Users can be further isolated by branch if needed
- Branch-specific chat rooms and notifications
- Configurable per hospital requirements

## 🔐 **Security Features**

### **Authentication & Authorization**
- JWT-based authentication for all chat and notification operations
- Role-based access control (RBAC) enforcement
- Tenant isolation at database level

### **Real-Time Security**
- WebSocket connections authenticated with JWT tokens
- Real-time permission validation
- Secure message delivery with read receipts

## 📱 **User Experience**

### **Chat Interface**
- **Floating chat widget** accessible from any dashboard
- **User list** showing only messageable users based on role
- **Real-time typing indicators** and read receipts
- **Message history** with search and filtering

### **Notification System**
- **Notification bell** with unread count badge
- **Priority-based** notification display
- **Category organization** (appointment, announcement, alert, etc.)
- **Clickable actions** for quick responses

## 🎯 **Use Cases**

### **Doctor Use Cases**
1. **Coordinate with other doctors** about patient care
2. **Message receptionists** about appointments and schedules
3. **Receive notifications** from admins about hospital updates
4. **Send notifications** to other medical staff

### **Receptionist Use Cases**
1. **Message doctors** about patient arrivals and scheduling
2. **Receive notifications** from doctors about availability
3. **Coordinate with other receptionists** through admin channels
4. **Get updates** from hospital administration

### **Admin Use Cases**
1. **Contact master admin** for support and system issues
2. **Send announcements** to all hospital staff
3. **Coordinate between** different departments
4. **Monitor communication** within the hospital

### **Master Admin Use Cases**
1. **Provide support** to hospital admins
2. **Send system-wide** announcements and updates
3. **Monitor hospital** communication patterns
4. **Manage notification** groups and permissions

## 🔧 **Configuration**

### **Role Permissions**
Permissions are defined in:
- `server/routes/chat.ts` - Chat messaging rules
- `server/routes/notifications.ts` - Notification permissions

### **Customization**
- Easy to modify role permissions by updating the `MESSAGING_RULES` and `NOTIFICATION_PERMISSIONS` objects
- Support for custom roles and permissions
- Flexible notification categories and priorities

## 🚀 **Implementation Status**

✅ **Backend Implementation Complete**
- Database models with tenant isolation
- API routes with role-based permissions
- WebSocket server for real-time communication
- Notification system with multiple delivery types

✅ **Frontend Implementation Complete**
- React contexts for state management
- Chat widget with real-time updates
- Notification bell with priority indicators
- Integration with existing dashboards

✅ **Security & Multi-Tenant Features**
- JWT authentication and authorization
- Hospital-level data isolation
- Role-based access control
- Secure WebSocket connections

The system is now ready for production use with the updated messaging rules! 🎉 