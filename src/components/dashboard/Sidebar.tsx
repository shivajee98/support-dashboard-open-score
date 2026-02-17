import { Search, RotateCw } from 'lucide-react';
import { Ticket } from '@/components/dashboard/types';
import { cn } from '@/lib/loanUtils';

interface SidebarProps {
    currentUser: any;
    tickets: Ticket[];
    selectedTicket: Ticket | null;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    ticketFilter: 'active' | 'closed';
    setTicketFilter: (val: 'active' | 'closed') => void;
    onSelectTicket: (ticket: Ticket) => void;
    onRefresh: () => void;
}

export default function Sidebar({
    currentUser,
    tickets,
    selectedTicket,
    searchQuery,
    setSearchQuery,
    ticketFilter,
    setTicketFilter,
    onSelectTicket,
    onRefresh
}: SidebarProps) {

    const filteredTickets = tickets.filter(t =>
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.unique_ticket_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-black tracking-tight text-slate-900">Inbox</h1>
                    <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl transition-all active:rotate-180">
                        <RotateCw size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tickets..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setTicketFilter('active')}
                        className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            ticketFilter === 'active' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setTicketFilter('closed')}
                        className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            ticketFilter === 'closed' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Closed
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredTickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        onClick={() => onSelectTicket(ticket)}
                        className={cn(
                            "p-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 relative group",
                            selectedTicket?.id === ticket.id ? "bg-blue-50/50 hover:bg-blue-50/80" : ""
                        )}
                    >
                        {selectedTicket?.id === ticket.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                #{ticket.unique_ticket_id}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                                {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h4 className={cn(
                            "text-sm font-bold mb-1 line-clamp-1",
                            selectedTicket?.id === ticket.id ? "text-blue-900" : "text-slate-700"
                        )}>
                            {ticket.subject}
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                ticket.priority === 'high' ? "bg-rose-500" :
                                    ticket.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <p className="text-xs font-medium text-slate-500 truncate max-w-[150px]">{ticket.user?.name}</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[9px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-400 uppercase tracking-widest">
                                {ticket.issue_type?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                ))}
                {filteredTickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        <p className="text-xs font-bold">No tickets found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
