import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Send,
    Pin,
    X,
    Trash2,
    MoreVertical,
    Clock,
} from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface ChatsProps {
    user: User;
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'contact';
    timestamp: Date;
    isImage?: boolean;
    imageUrl?: string;
    color?: 'red' | 'gray';
}

export default function Chats({ user }: ChatsProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: 'update patient info',
            sender: 'contact',
            timestamp: new Date(Date.now() - 3600000),
        },
        {
            id: 2,
            text: 'ASAP',
            sender: 'contact',
            timestamp: new Date(Date.now() - 3500000),
        },
        {
            id: 3,
            text: 'Send Image report',
            sender: 'contact',
            timestamp: new Date(Date.now() - 3400000),
        },
        {
            id: 4,
            text: 'Update the number of patience',
            sender: 'contact',
            timestamp: new Date(Date.now() - 3300000),
        },
        {
            id: 5,
            text: 'Updated!!!',
            sender: 'user',
            timestamp: new Date(Date.now() - 3200000),
            color: 'red',
        },
        {
            id: 6,
            text: '',
            sender: 'user',
            timestamp: new Date(Date.now() - 86400000),
            isImage: true,
            imageUrl: '/api/placeholder/400/300',
        },
        {
            id: 7,
            text: 'Burned victim 20',
            sender: 'user',
            timestamp: new Date(Date.now() - 8630000),
            color: 'red',
        },
        {
            id: 8,
            text: 'Update ESMC ASAP',
            sender: 'user',
            timestamp: new Date(Date.now() - 8620000),
            color: 'red',
        },
        {
            id: 9,
            text: 'UPDATED!!!',
            sender: 'user',
            timestamp: new Date(Date.now() - 8610000),
            color: 'gray',
        },
        {
            id: 10,
            text: 'IVE NOTIFY THEM',
            sender: 'user',
            timestamp: new Date(Date.now() - 8600000),
            color: 'gray',
        },
    ]);

    const [newMessage, setNewMessage] = useState('');
    const [isCallActive, setIsCallActive] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const contactName = 'SOF John Doe';
    const contactAvatar = '/api/placeholder/40/40';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isCallActive) {
            intervalRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setCallDuration(0);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isCallActive]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages([
                ...messages,
                {
                    id: messages.length + 1,
                    text: newMessage,
                    sender: 'user',
                    timestamp: new Date(),
                    color: 'red',
                },
            ]);
            setNewMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCall = () => {
        setIsCallActive(true);
        setIsMuted(false);
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        setIsMuted(false);
    };

    const handleDeleteMessage = (messageId: number) => {
        setMessages(messages.filter((m) => m.id !== messageId));
        setSelectedMessageId(null);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-hidden bg-gray-100">
                    {isCallActive ? (
                        // Active Call View
                        <div className="flex h-full flex-col items-center justify-center bg-gray-100 p-8">
                            <Button
                                variant="ghost"
                                className="absolute left-4 top-4"
                                onClick={() => setIsCallActive(false)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>

                            <div className="flex flex-col items-center space-y-6">
                                <Avatar className="h-32 w-32">
                                    <AvatarImage src={contactAvatar} alt={contactName} />
                                    <AvatarFallback className="bg-[#7a1818] text-3xl text-white">
                                        {getInitials(contactName)}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <h2 className="text-center text-3xl font-bold text-gray-900">{contactName}</h2>
                                    <p className="mt-4 text-center text-6xl font-bold text-gray-900">
                                        {formatTime(callDuration)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-14 w-14 rounded-full ${isMuted ? 'bg-gray-200' : 'bg-gray-300'}`}
                                        onClick={() => setIsMuted(!isMuted)}
                                    >
                                        {isMuted ? (
                                            <MicOff className="h-6 w-6 text-gray-700" />
                                        ) : (
                                            <Mic className="h-6 w-6 text-gray-700" />
                                        )}
                                    </Button>

                                    <Button
                                        size="icon"
                                        className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                                        onClick={handleEndCall}
                                    >
                                        <PhoneOff className="h-8 w-8 text-white" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-14 w-14 rounded-full bg-gray-300"
                                    >
                                        <Phone className="h-6 w-6 text-gray-700" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Chat View
                        <div className="flex h-full flex-col">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b bg-white px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={contactAvatar} alt={contactName} />
                                        <AvatarFallback className="bg-[#7a1818] text-white">
                                            {getInitials(contactName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">{contactName}</h2>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600"
                                    onClick={handleCall}
                                >
                                    <Phone className="h-5 w-5 text-white" />
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="mx-auto max-w-4xl space-y-4">
                                    {messages.map((message, index) => {
                                        const showTimestamp =
                                            index === 0 ||
                                            message.timestamp.getTime() - messages[index - 1].timestamp.getTime() >
                                                300000; // 5 minutes

                                        return (
                                            <React.Fragment key={message.id}>
                                                {showTimestamp && (
                                                    <div className="flex justify-center">
                                                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
                                                            {formatTimestamp(message.timestamp)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    className={`flex ${
                                                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    <div className="relative group">
                                                        {message.isImage ? (
                                                            <div className="rounded-lg overflow-hidden shadow-md">
                                                                <img
                                                                    src={message.imageUrl}
                                                                    alt="Shared image"
                                                                    className="max-w-xs h-auto"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`max-w-xs rounded-2xl px-4 py-2 ${
                                                                    message.sender === 'user'
                                                                        ? message.color === 'red'
                                                                            ? 'bg-red-600 text-white'
                                                                            : 'bg-gray-600 text-white'
                                                                        : 'bg-gray-300 text-gray-900'
                                                                }`}
                                                            >
                                                                <p className="text-sm">{message.text}</p>
                                                            </div>
                                                        )}

                                                        {/* Message Actions Menu */}
                                                        {message.sender === 'user' && (
                                                            <DropdownMenu
                                                                open={selectedMessageId === message.id}
                                                                onOpenChange={(open) =>
                                                                    setSelectedMessageId(open ? message.id : null)
                                                                }
                                                            >
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute -left-8 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedMessageId(message.id);
                                                                        }}
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem>
                                                                        <Pin className="mr-2 h-4 w-4" />
                                                                        Pin
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <X className="mr-2 h-4 w-4 text-red-500" />
                                                                        Remove message
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteMessage(message.id)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                                        Delete message
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="border-t bg-white px-6 py-4">
                                <div className="mx-auto flex max-w-4xl items-center gap-3">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message"
                                        className="flex-1 rounded-full border-gray-300 focus:ring-[#7a1818]"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600"
                                        size="icon"
                                    >
                                        <Send className="h-5 w-5 text-white" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

