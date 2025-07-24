import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  X, 
  Send, 
  Users, 
  MoreVertical,
  Search,
  Phone,
  Video,
  Bell,
  Minimize2,
  Maximize2,
  Smile,
  Paperclip,
  Image,
  File,
  Settings,
  Archive,
  Star,
  Copy,
  Reply,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Plus,
  MessageSquare,
  UserPlus,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Filter,
  Download,
  Info,
  Loader2,
  Circle,
  Zap,
  Hash
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ChatWidgetProps {
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showRoomList, setShowRoomList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showRecentChats, setShowRecentChats] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  const { toast } = useToast();
  
  const {
    isConnected,
    currentRoom,
    messages,
    typingUsers,
    rooms,
    messageableUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    connect
  } = useChat();

  const user = authService.getStoredUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-connect and scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isConnected && user) {
      connect();
    }
  }, [isConnected, user, connect]);

  // Handle new messages and notifications
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Show notification for new messages (not from current user and when chat is closed/minimized)
      if (latestMessage.sender._id !== user?.id && (!isOpen || isMinimized)) {
        setUnreadCount(prev => prev + 1);
        setLastMessage(latestMessage);
        
        // Show toast notification
        toast({
          title: `New message from ${latestMessage.sender.firstName} ${latestMessage.sender.lastName}`,
          description: latestMessage.content.length > 50 
            ? `${latestMessage.content.substring(0, 50)}...` 
            : latestMessage.content,
          duration: 5000,
        });
      }
      
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, user?.id, isOpen, isMinimized, toast]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Handle typing indicators
  useEffect(() => {
    if (isTyping && currentRoom) {
      startTyping(currentRoom.roomId);
    } else if (!isTyping && currentRoom) {
      stopTyping(currentRoom.roomId);
    }
  }, [isTyping, currentRoom, startTyping, stopTyping]);

  const handleSendMessage = () => {
    if (!message.trim() || !currentRoom) return;
    
    sendMessage(message);
    setMessage('');
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleRoomSelect = (room: any) => {
    console.log('Selecting room:', room);
    
    if (!room || !room.roomId) {
      console.error('Invalid room object:', room);
      return;
    }
    
    if (currentRoom?.roomId === room.roomId) return;
    
    if (currentRoom) {
      leaveRoom(currentRoom.roomId);
    }
    
    joinRoom(room.roomId);
    // Switch to chat view when selecting a room
    setShowUserList(false);
    setShowRecentChats(false);
    setUnreadCount(0);
  };

  const handleUserSelect = async (selectedUser: any) => {
    // Find existing room or create new one
    const existingRoom = rooms.find(room => 
      room.type === 'direct' && 
      room.participants.some(p => p._id === selectedUser._id)
    );
    
    if (existingRoom) {
      handleRoomSelect(existingRoom);
    } else {
      // Create new direct room
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/chat/rooms/direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
          },
          body: JSON.stringify({ participantId: selectedUser._id })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating room:', errorData);
          return;
        }
        
        const data = await response.json();
        console.log('Room created:', data);
        
        if (data.success && data.room) {
          handleRoomSelect(data.room);
        } else {
          console.error('Invalid response format:', data);
        }
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  };

  const getOtherParticipant = () => {
    if (!currentRoom || currentRoom.type !== 'direct') return null;
    return currentRoom.participants.find(p => p._id !== user?.id);
  };

  // Helper function to get participant display name
  const getParticipantName = (room: any) => {
    if (room.type === 'direct') {
      const other = room.participants.find((p: any) => p._id !== user?.id);
      return other ? `${other.firstName} ${other.lastName}` : 'Unknown User';
    }
    return room.name || 'Group Chat';
  };

  // Helper function to format message time
  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd');
    }
  };

  // Sort rooms by last message time
  const sortedRooms = [...rooms].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
    const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  const filteredUsers = (messageableUsers || []).filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = sortedRooms.filter(room => 
    getParticipantName(room).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      setIsMinimized(false);
    }
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      <Button
        onClick={toggleChat}
        className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 relative"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="font-semibold text-gray-800">
                {isConnected ? 'Chat' : 'Connecting...'}
              </span>
              {unreadCount > 0 && !isMinimized && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {!isMinimized && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showRecentChats ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => {
                            setShowRecentChats(true);
                            setShowUserList(false);
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Recent Chats</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showUserList ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => {
                            setShowUserList(true);
                            setShowRecentChats(false);
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>All Users</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Minimized View */}
          {isMinimized ? (
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {currentRoom?.type === 'direct' 
                      ? (() => {
                          const other = getOtherParticipant();
                          return other ? other.firstName[0] + other.lastName[0] : 'U';
                        })()
                      : currentRoom?.name?.[0] || 'G'
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentRoom?.type === 'direct' 
                      ? `${getOtherParticipant()?.firstName} ${getOtherParticipant()?.lastName}`
                      : currentRoom?.name
                    }
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-gray-500 truncate max-w-48">
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* Full Chat View */
            <div className="flex-1 flex flex-col">
              {showRecentChats ? (
                // Recent Chats View
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-2 space-y-1">
                      {filteredRooms.map((room) => (
                        <div
                          key={room.roomId}
                          onClick={() => handleRoomSelect(room)}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {room.type === 'direct'
                                ? (() => {
                                    const other = room.participants.find(
                                      (p: any) => p._id !== user?.id
                                    );
                                    return other
                                      ? other.firstName[0] + other.lastName[0]
                                      : 'U';
                                  })()
                                : room.name?.[0] || 'G'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getParticipantName(room)}
                            </p>
                            {room.lastMessage && (
                              <p className="text-xs text-gray-500 truncate max-w-full">
                                {room.lastMessage.content}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatMessageTime(room.lastMessage?.timestamp || '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
            ) : showUserList ? (
                // User List View
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-2 space-y-1">
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleUserSelect(user)}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              [{user.role.replace('_', ' ')}]
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                // Chat View
                <>
                  {/* Room Header */}
                  {currentRoom && (
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {currentRoom.type === 'direct' 
                              ? (() => {
                                  const other = getOtherParticipant();
                                  return other ? other.firstName[0] + other.lastName[0] : 'U';
                                })()
                              : currentRoom.name?.[0] || 'G'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {currentRoom.type === 'direct' 
                              ? `${getOtherParticipant()?.firstName} ${getOtherParticipant()?.lastName}`
                              : currentRoom.name
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {currentRoom.type === 'direct' 
                              ? `[${getOtherParticipant()?.role.replace('_', ' ')}]`
                              : `${currentRoom.participants.length} members`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-3 space-y-3">
                      {currentRoom ? (
                        <>
                          {(messages ?? []).map((msg) => {
                            // Skip messages without sender
                            if (!msg.sender) {
                              console.warn('Message without sender:', msg);
                              return null;
                            }
                            
                            return (
                              <div
                                key={msg._id}
                                className={`flex ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs px-3 py-2 rounded-lg shadow-sm ${
                                    msg.sender._id === user.id
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs opacity-75">
                                      {msg.sender.firstName} {msg.sender.lastName}
                                    </span>
                                    <span className="text-xs opacity-75">
                                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm break-words">{msg.content}</p>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Typing indicator */}
                          {typingUsers.length > 0 && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg shadow-sm">
                                <p className="text-sm italic">Typing...</p>
                              </div>
                            </div>
                          )}
                          
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Select a conversation to start chatting</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  {currentRoom && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type a message..."
                          value={message}
                          onChange={handleTyping}
                          onKeyPress={handleKeyPress}
                          className="flex-1 bg-white"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim()}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 