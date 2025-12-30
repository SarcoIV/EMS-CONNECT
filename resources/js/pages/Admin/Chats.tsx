import { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import axios from 'axios';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Sender {
    id: number;
    name: string;
    role: string | null;
    user_role: string | null;
}

interface Message {
    id: number;
    incident_id: number;
    sender_id: number;
    sender: Sender;
    message: string | null;
    image_url: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

interface LastMessage {
    message: string | null;
    image_url: string | null;
    created_at: string;
    sender_name: string;
}

interface Conversation {
    id: number;
    incident_id: number;
    user: User;
    incident_type: string;
    incident_status: string;
    last_message: LastMessage | null;
    unread_count: number;
    updated_at: string;
}

interface IncidentInfo {
    id: number;
    type: string;
    status: string;
    user: User;
}

interface Call {
    id: number;
    incident_id: number | null;
    channel_name: string;
    status: string;
    started_at: string;
    answered_at: string | null;
    ended_at: string | null;
}

interface ChatsProps {
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function Chats({ user }: ChatsProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [incidentInfo, setIncidentInfo] = useState<IncidentInfo | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingIntervalRef = useRef<number | null>(null);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await axios.get('/admin/chats/conversations');
            setConversations(response.data.conversations);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    // Fetch messages for selected conversation
    const fetchMessages = useCallback(async (incidentId: number, showLoader = true) => {
        if (showLoader) setIsLoadingMessages(true);

        try {
            const response = await axios.get(`/admin/chats/${incidentId}/messages`);
            setMessages(response.data.messages);
            setIncidentInfo(response.data.incident);

            // Mark conversation as read
            await axios.post(`/admin/chats/${incidentId}/mark-read`);

            // Update unread count in conversations list
            setConversations(prev => prev.map(conv =>
                conv.incident_id === incidentId ? { ...conv, unread_count: 0 } : conv
            ));
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            if (showLoader) setIsLoadingMessages(false);
        }
    }, []);

    // Send message
    const handleSendMessage = async () => {
        if (!selectedConversation || (!newMessage.trim() && !selectedImage)) {
            return;
        }

        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append('incident_id', selectedConversation.incident_id.toString());

            if (newMessage.trim()) {
                formData.append('message', newMessage.trim());
            }

            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await axios.post('/admin/chats/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Add message to list immediately
            setMessages(prev => [...prev, response.data.data]);

            // Clear inputs
            setNewMessage('');
            setSelectedImage(null);
            setImagePreview(null);

            // Scroll to bottom
            setTimeout(() => scrollToBottom(), 100);

            // Refresh conversations to update last message
            fetchConversations();
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            alert('Only JPEG and PNG images are allowed');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setSelectedImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation.incident_id);
    };

    // Start polling for new messages
    const startPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = window.setInterval(() => {
            // Poll conversations
            fetchConversations();

            // Poll messages if conversation is selected
            if (selectedConversation) {
                fetchMessages(selectedConversation.incident_id, false);
            }
        }, 3000); // Poll every 3 seconds
    }, [selectedConversation, fetchConversations, fetchMessages]);

    // Initial load
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Start polling
    useEffect(() => {
        startPolling();

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [startPolling]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => scrollToBottom(), 100);
        }
    }, [messages.length]);

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format date
    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Get incident type badge color
    const getIncidentTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            medical: 'bg-red-100 text-red-800',
            fire: 'bg-orange-100 text-orange-800',
            accident: 'bg-yellow-100 text-yellow-800',
            crime: 'bg-purple-100 text-purple-800',
            natural_disaster: 'bg-blue-100 text-blue-800',
            other: 'bg-gray-100 text-gray-800',
        };
        return colors[type] || colors.other;
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header title="Chats" />
                <IncomingCallNotification />

                <main className="flex-1 overflow-hidden bg-white">
                    <div className="flex h-full">
                        {/* Left Sidebar - Conversations List */}
                        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {isLoadingConversations ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500">No conversations yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {conversations.map(conversation => (
                                        <button
                                            key={conversation.id}
                                            onClick={() => handleSelectConversation(conversation)}
                                            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                                                selectedConversation?.id === conversation.id ? 'bg-red-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold">
                                                            {conversation.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {conversation.user.name}
                                                            </p>
                                                            <span
                                                                className={`inline-block px-2 py-0.5 text-xs rounded-full ${getIncidentTypeBadge(
                                                                    conversation.incident_type
                                                                )}`}
                                                            >
                                                                {conversation.incident_type.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {conversation.last_message && (
                                                        <p className="text-sm text-gray-600 truncate mt-1">
                                                            {conversation.last_message.message ||
                                                                (conversation.last_message.image_url ? '📷 Image' : '')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="ml-2 flex flex-col items-end gap-1">
                                                    {conversation.last_message && (
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(conversation.last_message.created_at)}
                                                        </span>
                                                    )}
                                                    {conversation.unread_count > 0 && (
                                                        <span className="bg-red-600 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium">
                                                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Side - Chat Messages */}
                        <div className="flex-1 flex flex-col bg-gray-50">
                            {!selectedConversation ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="mx-auto h-24 w-24 text-gray-400">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="mt-4 text-lg font-medium text-gray-900">Select a conversation</h3>
                                        <p className="mt-2 text-sm text-gray-500">
                                            Choose a conversation from the list to start messaging
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="border-b border-gray-200 bg-white px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold">
                                                {selectedConversation.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    {selectedConversation.user.name}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${getIncidentTypeBadge(
                                                            selectedConversation.incident_type
                                                        )}`}
                                                    >
                                                        {selectedConversation.incident_type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Incident #{selectedConversation.incident_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                        {isLoadingMessages ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-gray-500">No messages yet</p>
                                                <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map(message => {
                                                    const isAdmin = message.sender.user_role === 'admin';

                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div className={`max-w-md ${isAdmin ? 'order-2' : 'order-1'}`}>
                                                                {!isAdmin && (
                                                                    <p className="text-xs text-gray-600 mb-1">
                                                                        {message.sender.name}
                                                                    </p>
                                                                )}
                                                                <div
                                                                    className={`rounded-lg px-4 py-2 ${
                                                                        isAdmin
                                                                            ? 'bg-red-600 text-white'
                                                                            : 'bg-white text-gray-900 border border-gray-200'
                                                                    }`}
                                                                >
                                                                    {message.message && (
                                                                        <p className="text-sm whitespace-pre-wrap break-words">
                                                                            {message.message}
                                                                        </p>
                                                                    )}
                                                                    {message.image_url && (
                                                                        <img
                                                                            src={message.image_url}
                                                                            alt="Shared image"
                                                                            className="mt-2 rounded-lg max-w-full h-auto"
                                                                        />
                                                                    )}
                                                                    <p
                                                                        className={`text-xs mt-1 ${
                                                                            isAdmin ? 'text-red-100' : 'text-gray-500'
                                                                        }`}
                                                                    >
                                                                        {formatTime(message.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="border-t border-gray-200 bg-white px-6 py-4">
                                        {/* Image Preview */}
                                        {imagePreview && (
                                            <div className="mb-3 relative inline-block">
                                                <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
                                                <button
                                                    onClick={handleRemoveImage}
                                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Input Row */}
                                        <div className="flex items-end gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageSelect}
                                                accept="image/jpeg,image/jpg,image/png"
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isSending}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <ImageIcon className="h-5 w-5 text-gray-600" />
                                            </button>
                                            <textarea
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                placeholder="Type a message..."
                                                disabled={isSending}
                                                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                                rows={1}
                                                style={{ maxHeight: '120px' }}
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={(!newMessage.trim() && !selectedImage) || isSending}
                                                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSending ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                ) : (
                                                    <Send className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
