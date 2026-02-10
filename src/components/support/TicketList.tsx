import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/loanUtils';

interface Ticket {
    id: number;
    subject: string;
    issue_type?: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    messages: any[];
}

interface TicketListProps {
    tickets: Ticket[];
    onSelectTicket: (ticket: Ticket) => void;
    selectedTicketId?: number | null;
}

export default function TicketList({ tickets, onSelectTicket, selectedTicketId }: TicketListProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-600';
            case 'in_progress': return 'bg-amber-100 text-amber-600';
            case 'closed': return 'bg-emerald-100 text-emerald-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertCircle size={14} />;
            case 'in_progress': return <Clock size={14} />;
            case 'closed': return <CheckCircle size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    const getCategoryLabel = (type?: string) => {
        switch (type) {
            case 'cashback_not_received': return 'Cashback Issue';
            case 'unable_to_transfer': return 'Transfer Issue';
            case 'general': return 'General';
            default: return 'Uncategorized';
        }
    };

    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <MessageSquare size={32} />
                </div>
                <h3 className="text-slate-900 font-bold mb-1">No Tickets Yet</h3>
                <p className="text-slate-500 text-sm">Start a new conversation to get help.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tickets.map((ticket) => (
                <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className={cn(
                        "group p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md",
                        selectedTicketId === ticket.id
                            ? "bg-blue-50/50 border-blue-200 shadow-sm"
                            : "bg-white border-slate-100 hover:border-blue-100"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                            <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                getStatusColor(ticket.status)
                            )}>
                                {getStatusIcon(ticket.status)}
                                {ticket.status.replace('_', ' ')}
                            </div>
                            {ticket.issue_type && (
                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                                    {getCategoryLabel(ticket.issue_type)}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                            {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                        </span>
                    </div>

                    <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                        {ticket.subject}
                    </h3>

                    <p className="text-sm text-slate-500 line-clamp-2">
                        {ticket.messages?.[0]?.message || 'No messages yet'}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                ticket.priority === 'high' ? 'bg-rose-500' :
                                    ticket.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            )}></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {ticket.priority} Priority
                            </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            ))}
        </div>
    );
}
