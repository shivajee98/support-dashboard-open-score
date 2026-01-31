"use client";

import React, { useState, useEffect } from 'react';
import TicketList from '@/components/support/TicketList';
import ChatWindow from '@/components/support/ChatWindow';
import { apiFetch } from '@/lib/api';
import { LogOut, Filter, MessageSquare, RefreshCw, Search, User } from 'lucide-react';
import { cn } from '@/lib/loanUtils';
import { useRouter } from 'next/navigation';
import UserSearchModal from '@/components/support/UserSearchModal';
import UserDetailsModal from '@/components/support/UserDetailsModal';

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // New State for Modals
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
  }, [filterStatus]);

  useEffect(() => {
    // Polling removed in favor of WebSockets
  }, [selectedTicket]);

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

  const fetchMessages = async (ticketId: number) => {
    try {
      const res = await apiFetch<any>(`/support/tickets/${ticketId}`);
      if (res && res.messages) {
        setMessages(res.messages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!selectedTicket) return;

    // Fetch initial
    fetchMessages(selectedTicket.id);

    // Setup Echo Listener
    let echoInstance: any;
    import('@/lib/echo').then(({ createEcho }) => {
      const echo = createEcho();
      echoInstance = echo;

      echo.private(`support.ticket.${selectedTicket.id}`)
        .listen('.MessageSent', (e: any) => {
          setMessages(prev => {
            if (prev.find(m => m.id === e.message.id)) return prev;
            return [...prev, e.message];
          });
        });
    });

    return () => {
      if (echoInstance) {
        echoInstance.leave(`support.ticket.${selectedTicket.id}`);
      }
    };
  }, [selectedTicket]);

  const handleSendMessage = async (message: string) => {
    if (!selectedTicket) return;
    try {
      await apiFetch<any>(`/support/tickets/${selectedTicket.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      fetchMessages(selectedTicket.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    try {
      await apiFetch<any>(`/support/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setSelectedTicket({ ...selectedTicket, status });
      fetchTickets();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_user');
    router.push('/login');
  };

  const handleViewProfileFromChat = () => {
    if (selectedTicket && selectedTicket.user) {
      setViewingUser(selectedTicket.user);
      setIsUserDetailsOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-tight">Support Dashboard</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user?.name || 'Agent'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
          >
            <Search size={16} />
            Search User
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Ticket List Sidebar */}
        <div className="w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Queue</h3>
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
              onSelectTicket={setSelectedTicket}
              selectedTicketId={selectedTicket?.id}
            />
          </div>
        </div>

        {/* Active Ticket Chat */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span
                      className="font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={handleViewProfileFromChat}
                      title="View Profile"
                    >
                      {selectedTicket.user?.name}
                    </span>
                    <span>•</span>
                    <span>Ticket #{selectedTicket.id}</span>
                  </div>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <ChatWindow
                  messages={messages}
                  currentUserId={user?.id}
                  onSendMessage={handleSendMessage}
                  ticketStatus={selectedTicket.status}
                  onViewProfile={handleViewProfileFromChat}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 text-slate-200" />
              <p className="font-bold text-lg text-slate-300">Select a ticket to respond</p>
            </div>
          )}
        </div>
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
        onClose={() => {
          setIsUserDetailsOpen(false);
          setViewingUser(null);
        }}
      />
    </div>
  );
}
