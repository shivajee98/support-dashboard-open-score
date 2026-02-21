import { MessageSquare, Loader2, Send, X, Image as ImageIcon } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { Ticket } from '@/components/dashboard/types';

interface ChatAreaProps {
    selectedTicket: Ticket | null;
    replyText: string;
    setReplyText: (val: string) => void;
    isSending: boolean;
    onSendMessage: (e: React.FormEvent) => void;
    attachment: File | null;
    setAttachment: (file: File | null) => void;
    fileInputRef: any;
    getStorageUrl: (path: string) => string;
}

// Utility to auto-link URLs in text
const renderMessageWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold break-all hover:opacity-80 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

export default function ChatArea({
    selectedTicket,
    replyText,
    setReplyText,
    isSending,
    onSendMessage,
    attachment,
    setAttachment,
    fileInputRef,
    getStorageUrl
}: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedTicket?.messages]);

    if (!selectedTicket) {
        return (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 animate-in fade-in duration-500">
                <div>
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <MessageSquare size={40} className="text-blue-600 opacity-20" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Assign & Take Action</h3>
                    <p className="text-sm font-medium max-w-xs mx-auto mt-2 text-slate-500 italic">Select a conversation from the left inbox to start assisting the customer.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-black text-black line-clamp-1">{selectedTicket.subject}</h2>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                            #{selectedTicket.unique_ticket_id}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <span>{selectedTicket.user?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{selectedTicket.issue_type?.replace(/_/g, ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 custom-scrollbar bg-slate-50/50">
                {selectedTicket.messages?.map((m: any, idx: number) => (
                    <div key={idx} className={`flex ${m.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm ${m.is_admin_reply ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-black rounded-tl-none'}`}>
                            {m.attachment_url && (
                                <div className="mb-2">
                                    <img
                                        src={getStorageUrl(m.attachment_url)}
                                        alt="Attachment"
                                        className="rounded-lg max-h-60 object-contain bg-black/10 cursor-pointer"
                                        onClick={() => window.open(getStorageUrl(m.attachment_url), '_blank')}
                                    />
                                </div>
                            )}
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                {renderMessageWithLinks(m.message)}
                            </p>
                            <p className={`text-[9px] mt-2 font-bold opacity-80 ${m.is_admin_reply ? 'text-blue-100' : 'text-slate-900'}`}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={onSendMessage} className="flex gap-4 items-end">
                    <div className="flex-1 flex flex-col gap-2">
                        {attachment && (
                            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg w-fit">
                                <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{attachment.name}</span>
                                <button type="button" onClick={() => setAttachment(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={12} /></button>
                            </div>
                        )}
                        <div className="flex gap-2 w-full">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                <ImageIcon size={20} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setAttachment(e.target.files[0]);
                                    }
                                }}
                            />
                            <input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your response here..."
                                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-black placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button disabled={isSending || (!replyText.trim() && !attachment)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50">
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </button>
                </form>
            </div>
        </div>
    );
}
