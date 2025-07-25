import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface ChatRoom {
  _id: string;
  roomId: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  }>;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  messageId: string;
  roomId: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
  readBy: string[];
  deliveredTo: string[];
  isEdited: boolean;
  editedAt?: string;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
}

interface ChatContextType {
  // State
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: ChatRoom | null;
  messages: Message[];
  typingUsers: string[];
  onlineUsers: UserStatus[];
  unreadCounts: {
    messages: number;
    notifications: number;
  };
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (content: string, messageType?: string, replyTo?: string) => void;
  markAsRead: (roomId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  updateStatus: (status: string) => void;
  
  // Queries
  rooms: ChatRoom[];
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  messageableUsers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, notifications: 0 });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = authService.getStoredUser();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // API functions
  const fetchRooms = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/chat/rooms`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
    const data = await response.json();
    return data.rooms;
  };

  const fetchMessages = async (roomId: string, page = 1) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages?page=${page}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
    const data = await response.json();
    return data;
  };

  const fetchMessageableUsers = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/chat/messageable-users`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
    const data = await response.json();
    return data.users;
  };

  const createDirectRoom = async (participantId: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/chat/rooms/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify({ participantId })
    });
    const data = await response.json();
    return data.room;
  };

  const sendMessageAPI = async (roomId: string, content: string, messageType = 'text', replyTo?: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ content, messageType, replyTo })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.message) {
        throw new Error('Invalid response from server');
      }
      
      // Ensure the message has a sender
      if (!data.message.sender) {
        console.error('Message received without sender:', data.message);
        throw new Error('Message missing sender information');
      }
      
      return data.message;
    } catch (error) {
      console.error('Error in sendMessageAPI:', error);
      throw error;
    }
  };

  const markAsReadAPI = async (roomId: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await fetch(`${API_URL}/api/chat/rooms/${roomId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
  };

  const updateStatusAPI = async (status: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await fetch(`${API_URL}/api/chat/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify({ status })
    });
  };

  // Queries
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: fetchRooms,
    enabled: !!user,
    retry: 1
  });

  const { data: messageableUsers = [], isLoading: isLoadingMessageableUsers } = useQuery({
    queryKey: ['messageable-users'],
    queryFn: fetchMessageableUsers,
    enabled: !!user,
    retry: 1
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-messages', currentRoom?.roomId],
    queryFn: () => fetchMessages(currentRoom!.roomId),
    enabled: !!currentRoom,
    retry: 1
  });

  // Update messages when data changes
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: ({ roomId, content, messageType, replyTo }: {
      roomId: string;
      content: string;
      messageType?: string;
      replyTo?: string;
    }) => sendMessageAPI(roomId, content, messageType, replyTo),
    onSuccess: (newMessage) => {
      // Ensure the message has a sender before adding it to the state
      if (newMessage && newMessage.sender) {
        setMessages(prev => [...prev, newMessage]);
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      } else {
        console.error('Message received without sender:', newMessage);
        // Refetch messages to get the correct data
        queryClient.invalidateQueries({ queryKey: ['chat-messages', currentRoom?.roomId] });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // WebSocket connection
  const connect = () => {
    if (!user || socket || isConnected) return;

    // Connect to the server directly for WebSocket
    const wsUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const newSocket = io(wsUrl, {
      auth: {
        token: authService.getToken()
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected from chat server:', reason);
      
      // Only show error for unexpected disconnections
      if (reason === 'io server disconnect') {
        toast({
          title: "Connection Lost",
          description: "You have been disconnected from the chat server",
          variant: "destructive"
        });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      
      if (error.message === 'Authentication error' || error.message === 'Invalid token') {
        toast({
          title: "Authentication Error",
          description: "Please log in again to use chat features",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server. Please try again.",
          variant: "destructive"
        });
      }
    });

    newSocket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      
      // Show notification if not in the current room or if user is not focused on chat
      if (currentRoom?.roomId !== message.roomId || document.hidden) {
        toast({
          title: `💬 ${message.sender.firstName} ${message.sender.lastName}`,
          description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
          duration: 5000
        });
      }
    });

    newSocket.on('user_typing', (data: { userId: string; roomId: string; isTyping: boolean }) => {
      if (currentRoom?.roomId === data.roomId) {
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev.filter(id => id !== data.userId), data.userId]
            : prev.filter(id => id !== data.userId)
        );
      }
    });

    newSocket.on('message_delivered', (data: { messageId: string; roomId: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.messageId === data.messageId 
            ? { ...msg, deliveredTo: [...msg.deliveredTo, user.id] }
            : msg
        )
      );
    });

    newSocket.on('message_read', (data: { messageId: string; roomId: string; readBy: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.messageId === data.messageId 
            ? { ...msg, readBy: [...msg.readBy, data.readBy] }
            : msg
        )
      );
    });

    newSocket.on('user_status_change', (data: { userId: string; status: string; timestamp: string }) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.userId === data.userId);
        if (existing) {
          return prev.map(u => 
            u.userId === data.userId 
              ? { ...u, status: data.status as any, lastSeen: data.timestamp }
              : u
          );
        } else {
          return [...prev, { userId: data.userId, status: data.status as any, lastSeen: data.timestamp }];
        }
      });
    });

    newSocket.on('unread_counts', (counts: { messages: number; notifications: number }) => {
      setUnreadCounts(counts);
    });

    newSocket.on('error', (error: { message: string }) => {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive"
      });
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
      const room = rooms.find((r: ChatRoom) => r.roomId === roomId);
      setCurrentRoom(room || null);
      setTypingUsers([]);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomId);
      setCurrentRoom(null);
      setMessages([]);
      setTypingUsers([]);
    }
  };

  const sendMessage = (content: string, messageType = 'text', replyTo?: string) => {
    if (!currentRoom) return;
    
    sendMessageMutation.mutate({
      roomId: currentRoom.roomId,
      content,
      messageType,
      replyTo
    });
  };

  const markAsRead = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_read', { roomId });
    }
    markAsReadAPI(roomId);
  };

  const startTyping = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const updateStatus = (status: string) => {
    if (socket && isConnected) {
      socket.emit('status_change', { status });
    }
    updateStatusAPI(status);
  };

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !socket && !isConnected) {
      connect();
    }
    
    return () => {
      if (socket) {
        disconnect();
      }
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Auto-mark as read when joining room
  useEffect(() => {
    if (currentRoom && isConnected) {
      markAsRead(currentRoom.roomId);
    }
  }, [currentRoom, isConnected]);

  const value: ChatContextType = {
    socket,
    isConnected,
    currentRoom,
    messages,
    typingUsers,
    onlineUsers,
    unreadCounts,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    updateStatus,
    rooms,
    isLoadingRooms,
    isLoadingMessages,
    messageableUsers
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 