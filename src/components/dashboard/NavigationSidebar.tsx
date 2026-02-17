
import { MessageSquare, BadgeCheck, Archive, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/loanUtils';

interface NavigationSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    ticketFilter: 'active' | 'closed';
    setTicketFilter: (filter: 'active' | 'closed') => void;
    onSync: () => void;
    onLogout: () => void;
    currentUser: any;
}

export default function NavigationSidebar({
    activeTab,
    setActiveTab,
    ticketFilter,
    setTicketFilter,
    onSync,
    onLogout,
    currentUser
}: NavigationSidebarProps) {
    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                        OS
                    </div>
                    <span className="text-lg font-black tracking-tight text-slate-900">OpenScore</span>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => { setActiveTab('tickets'); setTicketFilter('active'); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold",
                            activeTab === 'tickets' && ticketFilter === 'active'
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <MessageSquare size={18} />
                        Active Inbox
                    </button>

                    <button
                        onClick={() => setActiveTab('repayments')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold",
                            activeTab === 'repayments'
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <BadgeCheck size={18} />
                        EMI Approvals
                    </button>

                    <button
                        onClick={() => { setActiveTab('tickets'); setTicketFilter('closed'); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold",
                            activeTab === 'tickets' && ticketFilter === 'closed'
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <Archive size={18} />
                        Archived
                    </button>

                    <button
                        onClick={onSync}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    >
                        <RefreshCw size={18} />
                        Sync Now
                    </button>
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-slate-100">
                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-black text-slate-900 truncate">{currentUser?.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 size={10} />
                        <span className="uppercase tracking-widest">Online</span>
                    </div>
                    {currentUser?.support_category && (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-200 pt-2 leading-relaxed">
                            {currentUser.support_category.name}
                        </p>
                    )}
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 text-rose-500 hover:text-rose-600 text-xs font-bold transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
