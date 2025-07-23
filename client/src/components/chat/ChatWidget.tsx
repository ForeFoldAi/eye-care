import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  X, 
  Send, 
  Users, 
  Plus,
  MoreVertical,
  Search,
  Phone,
  Video
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

interface ChatWidgetProps {
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    socket,
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
    stopTyping
  } = useChat();

  const user = authService.getStoredUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setShowUserList(false);
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
        const response = await fetch('/api/chat/rooms/direct', {
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

  const filteredUsers = (messageableUsers || []).filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = (rooms || []).filter(room => 
    room.type === 'direct' 
      ? getOtherParticipant()?.firstName.toLowerCase().includes(searchQuery.toLowerCase())
      : room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-semibold text-gray-800">
                {isConnected ? 'Chat' : 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserList(!showUserList)}
                className="h-8 w-8 p-0"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {showUserList ? (
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
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
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
                  <div className="flex items-center justify-between p-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  {currentRoom ? (
                    <div className="space-y-3">
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
                              className={`max-w-xs px-3 py-2 rounded-lg ${
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
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                            <p className="text-sm italic">Typing...</p>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p className="text-sm">Select a conversation to start chatting</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                {currentRoom && (
                  <div className="p-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 