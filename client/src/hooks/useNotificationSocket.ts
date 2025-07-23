import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

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

let notificationSocket: Socket | null = null;

export const useNotificationSocket = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = authService.getStoredUser();

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket for notifications
    notificationSocket = io('ws://localhost:5000', {
      path: '/ws',
      auth: {
        token: authService.getToken()
      }
    });

    notificationSocket.on('connect', () => {
      console.log('Connected to notification socket');
    });

    // Listen for new notifications
    notificationSocket.on('new_notification', (data: { notification: Notification; unreadCount: number }) => {
      // Update notifications query cache
      queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) => {
        if (!old) return [data.notification];
        return [data.notification, ...old];
      });

      // Update unread count
      queryClient.setQueryData(['notifications-unread-count'], data.unreadCount);

      // Show toast notification
      toast({
        title: data.notification.title,
        description: data.notification.message,
        duration: 5000,
        variant: data.notification.priority === 'urgent' ? 'destructive' : 'default'
      });
    });

    // Listen for notification updates (read status, etc.)
    notificationSocket.on('notification_updated', (data: { notificationId: string; update: any }) => {
      queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) => {
        if (!old) return old;
        return old.map(notification => 
          notification._id === data.notificationId 
            ? { ...notification, ...data.update }
            : notification
        );
      });
    });

    notificationSocket.on('disconnect', () => {
      console.log('Disconnected from notification socket');
    });

    // Cleanup on unmount
    return () => {
      if (notificationSocket) {
        notificationSocket.disconnect();
        notificationSocket = null;
      }
    };
  }, [user, queryClient, toast]);

  return notificationSocket;
};

export { notificationSocket };