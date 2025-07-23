import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  _id: string;
  notificationId: string;
  type: 'individual' | 'group' | 'role' | 'system';
  title: string;
  message: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'appointment' | 'announcement' | 'alert' | 'reminder' | 'system' | 'chat' | 'general';
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    data?: any;
  }>;
  readBy: string[];
  isRead: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationGroup {
  _id: string;
  groupId: string;
  name: string;
  description?: string;
  members: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  isNotificationModalOpen: boolean;
  
  // Actions
  openNotificationModal: () => void;
  closeNotificationModal: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  createNotification: (data: CreateNotificationData) => void;
  
  // Queries
  isLoading: boolean;
  groups: NotificationGroup[];
  isLoadingGroups: boolean;
}

interface CreateNotificationData {
  type: 'individual' | 'group' | 'role' | 'system';
  title: string;
  message: string;
  recipients?: string[];
  roleTargets?: string[];
  groupTargets?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'appointment' | 'announcement' | 'alert' | 'reminder' | 'system' | 'chat' | 'general';
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    data?: any;
  }>;
  expiresAt?: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = authService.getStoredUser();

  // API functions
  const fetchNotifications = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch notifications:', response.status, response.statusText);
        return []; // Return empty array instead of throwing error
      }
      
      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return empty array on error
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch unread count:', response.status, response.statusText);
        return 0; // Return 0 instead of throwing error
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0; // Return 0 on error
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/notifications/groups', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch notification groups:', response.status, response.statusText);
        return []; // Return empty array instead of throwing error
      }
      
      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      console.error('Error fetching notification groups:', error);
      return []; // Return empty array on error
    }
  };

  const markAsReadAPI = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
  };

  const markAllAsReadAPI = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
  };

  const deleteNotificationAPI = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
  };

  const createNotificationAPI = async (data: CreateNotificationData) => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.notification;
  };

  // Queries
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!user
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['notification-groups'],
    queryFn: fetchGroups,
    enabled: !!user,
    retry: 1
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: markAsReadAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsReadAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    }
  });

  const createNotificationMutation = useMutation({
    mutationFn: createNotificationAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "Notification sent successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    }
  });

  // Actions
  const openNotificationModal = () => setIsNotificationModalOpen(true);
  const closeNotificationModal = () => setIsNotificationModalOpen(false);

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const createNotification = (data: CreateNotificationData) => {
    createNotificationMutation.mutate(data);
  };

  // Listen for real-time notifications from WebSocket
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      
      // Show toast for new notification
      toast({
        title: notification.title,
        description: notification.message
      });
    };

    // Listen for WebSocket events
    window.addEventListener('new_notification', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('new_notification', handleNewNotification as EventListener);
    };
  }, [queryClient, toast]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isNotificationModalOpen,
    openNotificationModal,
    closeNotificationModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    isLoading,
    groups,
    isLoadingGroups
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 