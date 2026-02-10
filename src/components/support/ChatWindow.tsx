import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/loanUtils';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';

const getStorageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = API_BASE_URL.replace('/api', '');
    return `${base}/storage/${path}`;
};

interface Message {
    id: number;
    message: string;
    attachment_url?: string;
    is_admin_reply: boolean; // boolean from backend, 0 or 1
    created_at: string;
    user?: {
        id: number;
        name: string;
    };
}

interface ChatWindowProps {
    messages: Message[];
    currentUserId: number;
    onSendMessage: (message: string, attachment?: File | null) => Promise<void>;
    isLoading?: boolean;
    ticketStatus: string;
    onViewProfile?: () => void;
}

export default function ChatWindow({ messages, currentUserId, onSendMessage, isLoading, ticketStatus, onViewProfile }: ChatWindowProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send", error);
        } finally {
            setIsSending(false);
        }
    };

    const isClosed = ticketStatus === 'closed';

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <p>No messages yet.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // Determine alignment based on 'is_admin_reply'.
                        // BUT: If I am the Customer, my messages are `is_admin_reply: false`.
                        // If I am the Admin, my messages are `is_admin_reply: true`.
                        // We need context on WHO is viewing this.
                        // Actually simpler: `msg.user_id === currentUserId` checks ownership.
                        // But for now, let's rely on standard alignment:
                        // User (me) -> Right
                        // Support (them) -> Left
                        // Wait, `currentUserId` is passed in.
                        // The message object has a `user_id`. Let's assume we fetch `user_id` in the message.
                        // If `msg.user_id` matches `currentUserId`, prompt Right.

                        // Fallback logic if user_id missing on simple objects: 
                        // If we are Customer View: AdminReply -> Left, My Msg -> Right.
                        // If we are Admin View: AdminReply (Me) -> Right, Customer Msg -> Left.
                        // We'll rely on `msg.user_id === currentUserId` if available, or fallback.

                        // Let's assume backend `TicketMessage` has `user_id`.
                        // We need to pass `user_id` of the signed-in user to props.

                        const isMe = currentUserId ? msg.user?.id === currentUserId || (msg as any).user_id === currentUserId : false;

                        return (
                            <div
                                key={msg.id || index}
                                className={cn(
                                    "flex w-full mb-4",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl p-4 shadow-sm",
                                    isMe
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"
                                )}>
                                    {!isMe && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">
                                                {msg.is_admin_reply ? 'Customer Support' : msg.user?.name || 'User'}
                                            </p>
                                            {!msg.is_admin_reply && onViewProfile && (
                                                <button
                                                    onClick={onViewProfile}
                                                    className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-wider"
                                                >
                                                    View Profile
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                                    {msg.attachment_url && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-white/20 shadow-inner group relative">
                                            <img
                                                src={getStorageUrl(msg.attachment_url!)}
                                                alt="Attachment"
                                                className="w-full max-h-60 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                                onClick={() => window.open(getStorageUrl(msg.attachment_url!), '_blank')}
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <ExternalLink size={20} className="text-white drop-shadow-lg" />
                                            </div>
                                        </div>
                                    )}
                                    <div className={cn(
                                        "text-[10px] font-bold mt-2 text-right opacity-60",
                                        isMe ? "text-blue-100" : "text-slate-400"
                                    )}>
                                        {format(new Date(msg.created_at), 'h:mm a')}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                {isClosed ? (
                    <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-bold text-slate-500">This ticket is closed. You can't send new messages.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex items-end gap-2">
                        <div className="flex-1 bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all rounded-2xl overflow-hidden relative">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-transparent border-none p-3.5 focus:outline-none text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                                disabled={isSending}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="p-3.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center min-w-[3.5rem]"
                        >
                            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

