"use client";

import React, { useState, useEffect } from 'react';
import TicketList from '@/components/support/TicketList';
import ChatWindow from '@/components/support/ChatWindow';
import { apiFetch } from '@/lib/api';
import { LogOut, Filter, MessageSquare, RefreshCw, Search, User, Minus, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/loanUtils';
import { useRouter } from 'next/navigation';
import UserSearchModal from '@/components/support/UserSearchModal';
import UserDetailsModal from '@/components/support/UserDetailsModal';

interface OpenTicket {
  id: number;
  title: string;
  minimized: boolean;
  data: any;
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('agent_user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
    fetchTickets();

    // Track Login Session
    // apiFetch('/auth/login-log'); // Using the implicit log from backend login for now, or explicit here if needed.
  }, [filterStatus]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = filterStatus ? `?status=${filterStatus}` : '';
      const res = await apiFetch<any>(`/admin/support/tickets${query}`);
      if (res && res.data) {
        setTickets(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_user');
    router.push('/login');
  };

  const openTicket = async (ticket: any) => {
    // Ticket Assignment Logic
    if (!ticket.assigned_to) {
      const confirmAssign = window.confirm(`This ticket is unassigned. Do you want to pick it?`);
      if (!confirmAssign) return;

      try {
        const updated = await apiFetch<any>(`/admin/support/assign/${ticket.id}`, { method: 'POST' });
        ticket = updated; // Update localRef
        fetchTickets(); // Refresh list to show lock
      } catch (e) {
        alert('Failed to assign ticket. It might be taken.');
        fetchTickets();
        return;
      }
    } else if (ticket.assigned_to !== user.id) {
      alert(`This ticket is assigned to Agent #${ticket.assigned_to}. You cannot open it.`);
      return;
    }

    // Check if already open
    if (openTickets.find(t => t.id === ticket.id)) {
      // Restore if minimized
      setOpenTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, minimized: false } : t));
      return;
    }

    const newWindow: OpenTicket = {
      id: ticket.id,
      title: ticket.subject,
      minimized: false,
      data: ticket
    };

    setOpenTickets(prev => [...prev, newWindow]);
  };

  const closeTicketWindow = (id: number) => {
    setOpenTickets(prev => prev.filter(t => t.id !== id));
  };

  const toggleMinimize = (id: number) => {
    setOpenTickets(prev => prev.map(t => t.id === id ? { ...t, minimized: !t.minimized } : t));
  };

  const handleSendMessage = async (ticketId: number, message: string) => {
    try {
      const res = await apiFetch<any>(`/support/tickets/${ticketId}/message`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      // Update the specific window's messages
      // We need a way to pass this back to the ChatWindow component if it manages its own state
      // Or better, let ChatWindow refetch.
      // For now, allow ChatWindow to handle its own fetch/update logic via callbacks or internal state.
      return res;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-base leading-tight">Support OS</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.name} via {user?.mobile_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
          >
            <Search size={14} />
            Search User
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Desktop Workspace */}
      <div className="flex-1 overflow-hidden relative p-6">

        {/* Background / Wallpaper / Ticket List */}
        <div className="absolute inset-6 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Ticket Queue</h3>
              <button onClick={() => fetchTickets()} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['', 'open', 'in_progress', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border",
                    filterStatus === status
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {status || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <TicketList
              tickets={tickets}
              onSelectTicket={openTicket}
              selectedTicketId={null} // List highlighting not needed here as windows open
            />
          </div>
        </div>

        {/* Windows Layer */}
        {openTickets.map((ticket, index) => !ticket.minimized && (
          <div
            key={ticket.id}
            className="absolute bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95"
            style={{
              width: '400px',
              height: '500px',
              top: `${50 + (index * 20)}px`,
              left: `${400 + (index * 20)}px`,
              zIndex: 10 + index
            }}
          >
            {/* Window Header */}
            <div className="h-10 bg-slate-900 text-white flex justify-between items-center px-3 cursor-move">
              <span className="text-xs font-bold truncate pr-4">{ticket.title}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleMinimize(ticket.id)} className="p-1 hover:bg-white/20 rounded">
                  <Minus size={12} />
                </button>
                <button onClick={() => closeTicketWindow(ticket.id)} className="p-1 hover:bg-rose-500 rounded">
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden relative">
              <ChatWindowFetcher
                ticket={ticket.data}
                currentUserId={user.id}
                onSendMessage={handleSendMessage}
                onViewProfile={() => {
                  setViewingUser(ticket.data.user);
                  setIsUserDetailsOpen(true);
                }}
              />
            </div>
          </div>
        ))}

      </div>

      {/* Taskbar */}
      <div className="h-12 bg-slate-200 border-t border-slate-300 flex items-center px-4 gap-2 z-50 shrink-0">
        {openTickets.map(ticket => (
          <button
            key={ticket.id}
            onClick={() => toggleMinimize(ticket.id)}
            className={cn(
              "h-8 px-3 rounded flex items-center gap-2 text-xs font-bold transition-all border",
              ticket.minimized
                ? "bg-slate-100 text-slate-600 border-slate-300 hover:bg-white"
                : "bg-slate-300 text-slate-800 border-slate-400 shadow-inner"
            )}
          >
            <MessageSquare size={12} />
            <span className="truncate max-w-[100px]">{ticket.title}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={(user) => {
          setViewingUser(user);
          setIsSearchOpen(false);
          setIsUserDetailsOpen(true);
        }}
      />

      <UserDetailsModal
        isOpen={isUserDetailsOpen}
        user={viewingUser}
        currentUserId={user?.id || 0}
        onClose={() => {
          setIsUserDetailsOpen(false);
          setViewingUser(null);
        }}
      />
    </div>
  );
}

// Wrapper to fetch messages for individual windows
function ChatWindowFetcher({ ticket, currentUserId, onSendMessage, onViewProfile }: any) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchMsgs = async () => {
      const res = await apiFetch<any>(`/support/tickets/${ticket.id}`);
      if (res && res.messages) setMessages(res.messages);
    };
    fetchMsgs();

    let echoInstance: any;
    import('@/lib/echo').then(({ createEcho }) => {
      const echo = createEcho();
      echoInstance = echo;
      echo.private(`support.ticket.${ticket.id}`)
        .listen('.MessageSent', (e: any) => {
          setMessages(prev => {
            if (prev.find(m => m.id === e.message.id)) return prev;
            return [...prev, e.message];
          });
        });
    });

    return () => {
      if (echoInstance) echoInstance.leave(`support.ticket.${ticket.id}`);
    };
  }, [ticket.id]);

  const handleSend = async (msg: string) => {
    await onSendMessage(ticket.id, msg);
    // Optimistic or re-fetch done by parent? 
    // Actually parent just POSTs. We should ideally update local state here too or re-fetch.
    // Let's re-fetch for simplicity or append if we returned the msg object
    const res = await apiFetch<any>(`/support/tickets/${ticket.id}`);
    if (res && res.messages) setMessages(res.messages);
  };

  return (
    <ChatWindow
      messages={messages}
      currentUserId={currentUserId}
      onSendMessage={handleSend}
      ticketStatus={ticket.status}
      onViewProfile={onViewProfile}
    />
  );
}
