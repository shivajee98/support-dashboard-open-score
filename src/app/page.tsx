'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  User,
  LogOut,
  MessageSquare,
  IndianRupee,
  BadgeCheck,
  Send,
  Loader2,
  Clock,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  ArrowLeft,
  RefreshCcw,
  History,
  CheckCircle2,
  FileText,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Briefcase,
  PlayCircle,
  X,
  Phone
} from 'lucide-react';
import CallInterface from '@/components/CallInterface';
import { Toaster, toast } from 'sonner';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/loanUtils';

import { Ticket } from '@/types';
import LoanActions from '@/components/dashboard/LoanActions';

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState('');
  const [cashbackReason, setCashbackReason] = useState('Support Ticket Reward');
  const [isProcessingCashback, setIsProcessingCashback] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'active' | 'closed'>('active');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New features state
  const [pendingRepayments, setPendingRepayments] = useState<any[]>([]);
  const [selectedRepayment, setSelectedRepayment] = useState<any>(null);
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);

  // Loan Pipeline state
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<any>(null);
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);

  // Call state
  const [activeCall, setActiveCall] = useState<{ userId: number; name: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('support_user_name');
    const role = localStorage.getItem('support_user_role');
    const categoryName = localStorage.getItem('support_user_category_name');
    const token = localStorage.getItem('token');

    if (!token || !name) {
      router.replace('/login');
      return;
    }

    setCurrentUser({ name, role, categoryName });
    const isTrans = role === 'ADMIN' || (categoryName && (categoryName.toLowerCase().includes('transfer') || categoryName.toLowerCase().includes('emi')));
    const isLoan = role === 'ADMIN' || (categoryName && (categoryName.toLowerCase().includes('loan') || categoryName.toLowerCase().includes('kyc')));

    fetchTickets();
    if (isTrans) fetchPendingRepayments();
    if (isLoan) fetchPendingLoans();
    if (isLoan) fetchPendingLoans();

    // Fetch fresh user details to ensure category is up to date
    fetchCurrentUser();

    setIsLoading(false);

    const interval = setInterval(() => {
      fetchTickets();
      if (isTrans) fetchPendingRepayments();
      if (isLoan) fetchPendingLoans();
    }, 60000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedTicket?.messages]);

  useEffect(() => {
    fetchTickets();
  }, [ticketFilter]);

  const fetchTickets = async () => {
    try {
      const data: any = await apiFetch(`/admin/support/tickets?status=${ticketFilter}`);
      setTickets(data.data || []);
    } catch (error) {
      toast.error('Failed to update tickets');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user: any = await apiFetch('/auth/me');
      if (user) {
        // Update local storage and state
        if (user.support_category) {
          localStorage.setItem('support_user_category_name', user.support_category.name);
          localStorage.setItem('support_user_category_id', user.support_category.id);
        }

        setCurrentUser((prev: any) => ({
          ...prev,
          id: user.id,
          categoryName: user.support_category?.name || prev?.categoryName,
          role: user.role
        }));
      }
    } catch (error) {
      console.error('Failed to fetch current user', error);
    }
  };

  const fetchPendingRepayments = async () => {
    try {
      const res: any = await apiFetch('/admin/repayments/pending');
      setPendingRepayments(res.data || []);
    } catch (error) {
      console.error("Failed to fetch pending repayments", error);
    }
  };

  const selectTicket = async (ticket: Ticket) => {
    setViewingUser(null);
    setLoanDetails(null);
    try {
      const fullTicket: any = await apiFetch(`/support/tickets/${ticket.id}`);
      setSelectedTicket(fullTicket);
      if (!fullTicket.assigned_to) {
        await apiFetch(`/admin/support/assign/${ticket.id}`, { method: 'POST' });
      }

      // If user has an active/pending loan, pre-fetch it for easy management
      // We look for the newest loan
      if (currentUser?.role.toLowerCase().includes('loan') || currentUser?.role.toLowerCase().includes('kyc') || currentUser?.role.toLowerCase().includes('support') || currentUser?.role.toLowerCase().includes('agent')) {
        fetchUserLoans(ticket.user.id);
      }
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  };

  const fetchUserLoans = async (userId: number) => {
    try {
      // Fetch full details for the profile view
      const detailRes: any = await apiFetch(`/admin/users/${userId}/full-details`);
      setUserData(detailRes);

      // Fetch active loan for the actions panel
      const loanRes: any = await apiFetch(`/admin/users/${userId}/active-loan`);
      if (loanRes && loanRes.loan) {
        // Get full details of this loan (repayments etc)
        const fullLoanRes: any = await apiFetch(`/admin/loans/${loanRes.loan.id}/details`);
        setLoanDetails(fullLoanRes);
      } else {
        setLoanDetails(null);
      }
    } catch (error) {
      console.error("Failed to fetch user loan details", error);
      setLoanDetails(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !attachment) || !selectedTicket || isSending) return;

    setIsSending(true);
    try {
      let body: any;
      let headers: any = {};

      if (attachment) {
        const formData = new FormData();
        formData.append('message', replyText || 'Shared an image');
        formData.append('attachment', attachment);
        body = formData;
        // Content-Type header should be undefined for FormData to let browser set boundary
      } else {
        body = JSON.stringify({ message: replyText });
        headers['Content-Type'] = 'application/json';
      }

      // apiFetch wrapper might default to JSON, need to handle FormData
      // Checking apiFetch implementation would be good but standard fetch handles FormData if body is FormData and no Content-Type

      // Let's assume apiFetch handles it or we bypass it if needed. 
      // Actually, looking at likely apiFetch implementation, it might set Content-Type: application/json automatically.
      // We'll try to use a direct fetch or modify how we call it if we could see apiFetch.
      // For now, let's assume we can pass body directly. 
      // If apiFetch sets Content-Type to application/json always, this will fail.
      // But I can't see apiFetch. I'll assume standard behavior or I'll implement a workaround.

      // Workaround: We'll use the apiFetch but we need to ensure it doesn't force JSON.
      // Since I can't see apiFetch, I'll update this to a safe approach:

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/support/tickets/${selectedTicket.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do NOT set Content-Type for FormData
          ...(attachment ? {} : { 'Content-Type': 'application/json' })
        },
        body: attachment ? body : body
      });

      if (!res.ok) throw new Error('Failed to send');
      const msg = await res.json();

      setSelectedTicket({
        ...selectedTicket,
        messages: [...selectedTicket.messages, msg]
      });
      setReplyText('');
      setAttachment(null);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('Are you sure you want to close and resolve this ticket?')) return;

    try {
      await apiFetch(`/support/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'closed' })
      });
      toast.success('Ticket archived');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };

  // Loan Actions
  const handleSendKyc = async (loanId: number) => {
    setIsActionLoading(true);
    try {
      const res: any = await apiFetch(`/admin/loans/${loanId}/send-kyc`, { method: 'POST' });
      toast.success('KYC Link sent to customer');
      // Update local status
      if (loanDetails && loanDetails.loan.id === loanId) {
        setLoanDetails({ ...loanDetails, loan: { ...loanDetails.loan, status: 'KYC_SENT' } });
      }
      // Also notify customer in chat
      await apiFetch(`/support/tickets/${selectedTicket?.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: `I have sent the KYC link to your profile. Please complete it so we can proceed with your loan. Link: ${res.kyc_link}` })
      });
      selectTicket(selectedTicket!); // Refresh chat
    } catch (error) {
      toast.error('Failed to send KYC link');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: number) => {
    if (!confirm('Approve this loan application? Funds will be reserved.')) return;
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loans/${loanId}/approve`, { method: 'POST' });
      toast.success('Loan approved successfully');
      if (loanDetails && loanDetails.loan.id === loanId) {
        setLoanDetails({ ...loanDetails, loan: { ...loanDetails.loan, status: 'APPROVED' } });
      }
    } catch (error: any) {
      toast.error(error.message || 'Approval failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Loan Pipeline Actions
  const fetchPendingLoans = async () => {
    try {
      const res: any = await apiFetch('/admin/loans');
      setPendingLoans(res.data || res || []);
    } catch (error) {
      console.error('Failed to fetch pending loans', error);
    }
  };

  const handleProceedLoan = async (loanId: number) => {
    if (!confirm('Mark this loan as Proceeded?')) return;
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loans/${loanId}/proceed`, { method: 'POST' });
      toast.success('Loan marked as Proceeded');
      if (selectedTicket) fetchUserLoans(selectedTicket.user.id);
      fetchPendingLoans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to proceed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLoanAction = async (id: number, endpoint: string, successMsg: string) => {
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loans/${id}/${endpoint}`, { method: 'POST' });
      toast.success(successMsg);
      if (selectedTicket) fetchUserLoans(selectedTicket.user.id);
      fetchPendingLoans();
    } catch (e) {
      toast.error('Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectLoan = async (loanId: number, reason: string) => {
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loans/${loanId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      toast.success('Loan rejected successfully');
      if (selectedTicket) fetchUserLoans(selectedTicket.user.id);
      fetchPendingLoans();
    } catch (error: any) {
      toast.error(error.message || 'Rejection failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleProcessTicketAction = async (ticketId: number, action: string, amount: number, targetId?: number) => {
    setIsActionLoading(true);
    try {
      const res: any = await apiFetch(`/admin/support/tickets/${ticketId}/process-action`, {
        method: 'POST',
        body: JSON.stringify({ action, amount, target_id: targetId })
      });

      const fullTicket: any = await apiFetch(`/support/tickets/${ticketId}`);
      setSelectedTicket(fullTicket);
      toast.success(res.message);
    } catch (error) {
      toast.error('Failed to process action');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveTicketPayment = async (ticketId: number) => {
    setIsActionLoading(true);
    try {
      const updated: any = await apiFetch(`/admin/support/tickets/${ticketId}/approve-payment`, { method: 'POST' });
      setSelectedTicket(updated);
      toast.success('Payment approved successfully');
    } catch (error) {
      toast.error('Failed to approve payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectTicketPayment = async (ticketId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/support/tickets/${ticketId}/reject-payment`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      toast.success('Payment rejected');
      // Reload ticket
      const updated: any = await apiFetch(`/support/tickets/${ticketId}`);
      setSelectedTicket(updated);
    } catch (error) {
      toast.error('Failed to reject payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewLoanDetails = async (loanId: number) => {
    try {
      const res: any = await apiFetch(`/admin/loans/${loanId}/details`);
      setSelectedLoanDetail(res);
      setShowLoanDetailModal(true);
    } catch (error) {
      toast.error('Failed to load loan details');
    }
  };

  const handleSendKycFromPipeline = async (loanId: number) => {
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loans/${loanId}/send-kyc`, { method: 'POST' });
      toast.success('KYC link sent to customer');
      fetchPendingLoans();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send KYC');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveLoanFromPipeline = async (loanId: number) => {
    if (!confirm('Approve this loan? Funds will be reserved in the wallet.')) return;
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loans/${loanId}/approve`, { method: 'POST' });
      toast.success('Loan approved successfully');
      fetchPendingLoans();
    } catch (error: any) {
      toast.error(error.message || 'Approval failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Repayment Actions
  const handleApproveRepayment = async (repaymentId: number) => {
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/repayments/${repaymentId}/approve`, { method: 'POST' });
      toast.success('EMI processed successfully');
      setShowRepaymentModal(false);

      // Optimistic update
      setPendingRepayments(prev => prev.filter(r => r.id !== repaymentId));
      fetchPendingRepayments();

      // Refresh current user view if applicable
      if (viewingUser) {
        fetchUserLoans(viewingUser);
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddCashback = async () => {
    if (!cashbackAmount || isNaN(Number(cashbackAmount))) {
      toast.error('Enter valid amount');
      return;
    }
    setIsProcessingCashback(true);
    try {
      await apiFetch(`/admin/users/${selectedTicket?.user.id}/credit-cashback`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(cashbackAmount), description: cashbackReason })
      });
      toast.success('Cashback credited');
      setShowCashbackModal(false);
      setCashbackAmount('');
      setCashbackReason('Support Ticket Reward');
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsProcessingCashback(false);
    }
  };

  const handleViewProfile = async (userId: number) => {
    setIsDataLoading(true);
    setViewingUser(userId);
    try {
      const data: any = await apiFetch(`/admin/users/${userId}/full-details`);
      setUserData(data);
    } catch (error) {
      toast.error('Profile load failed');
      setViewingUser(null);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.replace('/login');
  };

  const filteredTickets = (tickets || []).filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = t.subject.toLowerCase().includes(query) || (t.user?.name || '').toLowerCase().includes(query);
    const isClosed = t.status === 'closed' || t.status === 'resolved';
    return ticketFilter === 'closed' ? (matchesSearch && isClosed) : (matchesSearch && !isClosed);
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  const role = currentUser?.role || '';
  const categoryName = currentUser?.categoryName || '';

  const isCashbackRole = role === 'ADMIN' || categoryName.toLowerCase().includes('cashback') || role === 'SUPPORT';
  const isTransferRole = role === 'ADMIN' || categoryName.toLowerCase().includes('transfer') || categoryName.toLowerCase().includes('emi') || role === 'SUPPORT';
  const isLoanKycRole = role === 'ADMIN' || categoryName.toLowerCase().includes('loan') || categoryName.toLowerCase().includes('kyc') || role === 'SUPPORT';
  const isAdmin = role === 'ADMIN' || role === 'SUPPORT';

  const getStorageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = API_BASE_URL.replace('/api', '');
    return `${base}/storage/${path}`;
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-slate-900 border-t border-slate-100">
      <Toaster position="top-center" richColors />
      <Toaster position="top-center" richColors />

      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-600/20">
            <img src="/support/logo.svg" alt="OpenScore" className="w-full h-full" />
          </div>
          <span className="hidden lg:block text-xl font-black text-slate-900 tracking-tight">OpenScore</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => { setTicketFilter('active'); setActiveTab('tickets'); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'tickets' && ticketFilter === 'active' ? 'bg-white shadow-sm text-blue-600 font-black' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <MessageSquare size={20} />
            <span className="hidden lg:block">Active Inbox</span>
          </button>

          {isLoanKycRole && (
            <button
              onClick={() => setActiveTab('loan_pipeline')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'loan_pipeline' ? 'bg-white shadow-sm text-blue-600 font-black' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <div className="relative">
                <Briefcase size={20} />
                {pendingLoans.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>}
              </div>
              <span className="hidden lg:block">Loan Pipeline</span>
            </button>
          )}

          {isTransferRole && (
            <button
              onClick={() => setActiveTab('repayments')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'repayments' ? 'bg-white shadow-sm text-blue-600 font-black' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <div className="relative">
                <BadgeCheck size={20} />
                {pendingRepayments.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
              </div>
              <span className="hidden lg:block">EMI Approvals</span>
            </button>
          )}

          <button
            onClick={() => { setTicketFilter('closed'); setActiveTab('tickets'); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'tickets' && ticketFilter === 'closed' ? 'bg-white shadow-sm text-blue-600 font-black' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <History size={20} />
            <span className="hidden lg:block">Archived</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => { fetchTickets(); if (isTransferRole) fetchPendingRepayments(); if (isLoanKycRole) fetchPendingLoans(); }}
              className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-white/50 rounded-xl transition-all"
            >
              <RefreshCcw size={20} />
              <span className="hidden lg:block">Sync Now</span>
            </button>
          </div>
        </nav>

        <div className="p-4 mt-auto">
          <div className="hidden lg:block bg-white/50 p-3 rounded-2xl mb-4 border border-slate-200/50">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Signed In As</p>
            <p className="text-xs font-black truncate">{currentUser?.name}</p>
            <p className="text-[9px] font-bold text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded-full mt-1 uppercase tracking-tight">
              {isAdmin ? 'System Admin' : (categoryName || 'Support Agent')}
            </p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black">
            <LogOut size={20} />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'loan_pipeline' ? (
          /* Loan Pipeline Tab */
          <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden animate-in fade-in duration-300">
            <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Loan Approval Pipeline</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 italic">Review and process new loan applications.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Loans</p>
                  <p className="text-xl font-black text-amber-600">{pendingLoans.length}</p>
                </div>
                <button onClick={fetchPendingLoans} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
                  <RefreshCcw size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {pendingLoans.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                    <Check className="text-emerald-500" size={32} />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs">All caught up!</p>
                  <p className="text-sm font-medium mt-1">No pending loan applications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingLoans.map((loan: any) => (
                    <div key={loan.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                          <Briefcase size={20} />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase ${loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          loan.status === 'PROCEEDED' ? 'bg-blue-100 text-blue-700' :
                            loan.status === 'KYC_SENT' ? 'bg-indigo-100 text-indigo-700' :
                              loan.status === 'FORM_SUBMITTED' ? 'bg-purple-100 text-purple-700' :
                                loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-slate-100 text-slate-500'
                          }`}>{loan.status}</span>
                      </div>
                      <h4 className="font-black text-slate-900 border-b border-slate-50 pb-3 mb-3">{loan.user?.name || 'Unknown'}</h4>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Amount:</span>
                          <span className="text-blue-600">₹{Number(loan.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Plan:</span>
                          <span>{loan.plan?.name || 'General'}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Applied:</span>
                          <span>{new Date(loan.created_at).toLocaleDateString()}</span>
                        </div>
                        {loan.user?.mobile_number && (
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400 uppercase tracking-tighter">Mobile:</span>
                            <span className="font-mono">{loan.user.mobile_number}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {/* Proceed - only for PENDING */}
                        {loan.status === 'PENDING' && (
                          <button
                            onClick={() => handleProceedLoan(loan.id)}
                            disabled={isActionLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 active:scale-95"
                          >
                            <PlayCircle size={14} /> Proceed
                          </button>
                        )}

                        {/* Send KYC - for PROCEEDED status */}
                        {loan.status === 'PROCEEDED' && (
                          <button
                            onClick={() => handleSendKycFromPipeline(loan.id)}
                            disabled={isActionLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                          >
                            <ExternalLink size={14} /> Send KYC
                          </button>
                        )}

                        {/* Approve - for FORM_SUBMITTED */}
                        {loan.status === 'FORM_SUBMITTED' && (
                          <button
                            onClick={() => handleApproveLoanFromPipeline(loan.id)}
                            disabled={isActionLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-600/20"
                          >
                            <BadgeCheck size={14} /> Approve
                          </button>
                        )}

                        {/* See Details - always visible */}
                        <button
                          onClick={() => handleViewLoanDetails(loan.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                          <Eye size={14} /> See Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'tickets' ? (
          <>
            {/* Ticket List Area */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-black">{ticketFilter === 'active' ? 'Active' : 'Archived'} Tickets</h2>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTickets.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold">Inbox empty</div>
                ) : (
                  filteredTickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTicket(t)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedTicket?.id === t.id ? 'bg-blue-50 border-blue-100 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-blue-600 tracking-wider">#{t.id}</span>
                        <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-bold truncate text-slate-800">{t.subject}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1"><User size={10} /> {t.user?.name}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/30">
              {selectedTicket ? (
                viewingUser ? (
                  <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                      <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-slate-50 rounded-lg transition-all">
                        <ArrowLeft />
                      </button>
                      <h3 className="text-lg font-black uppercase tracking-tight">Customer Profile</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8">
                      {isDataLoading ? <Loader2 className="animate-spin" /> : userData && (
                        <div className="max-w-3xl mx-auto space-y-6">
                          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
                            <h4 className="text-2xl font-black mb-1">{userData.user.name}</h4>
                            <p className="text-slate-400 font-mono text-[10px] mb-4">{userData.user.mobile_number}</p>
                            <div className="flex gap-2">
                              <div className="bg-white/10 rounded-xl p-3 flex-1">
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Balance</p>
                                <p className="text-xl font-black">₹{userData.user.wallet_balance}</p>
                              </div>
                              <div className="bg-white/10 rounded-xl p-3 flex-1">
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Loans</p>
                                <p className="text-xl font-black">{userData.loans.total_count}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-white border border-slate-100 rounded-[2rem]">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Documents</p>
                              <p className="text-xs font-bold">Aadhar: {userData.user.aadhaar_number || 'N/A'}</p>
                              <p className="text-xs font-bold mt-2">PAN: {userData.user.pan_number || 'N/A'}</p>
                            </div>
                            <div className="p-5 bg-white border border-slate-100 rounded-[2rem]">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status</p>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${userData.user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {userData.user.status}
                                </span>
                                {/* Call Button */}
                                <button
                                  onClick={() => setActiveCall({ userId: userData.user.id, name: userData.user.name })}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-black mb-4 flex items-center gap-2 px-2"><History size={16} /> Transaction Log</h5>
                            <div className="space-y-2">
                              {userData.transactions?.map((tx: any) => (
                                <div key={tx.id} className="flex justify-between p-3 bg-white border border-slate-50 rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      <IndianRupee size={14} />
                                    </div>
                                    <span className="text-xs font-bold">{tx.source_type}</span>
                                  </div>
                                  <span className={`text-xs font-black ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>₹{tx.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 lg:p-6 border-b border-slate-200 bg-white/80 backdrop-blur-md flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 hover:bg-slate-50 rounded-lg">
                          <ArrowLeft />
                        </button>
                        <div>
                          <h3 className="text-lg font-black truncate max-w-[200px] lg:max-w-md">{selectedTicket.subject}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CUSTOMER ID: {selectedTicket.user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={handleResolveTicket} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-slate-900/20">
                          <CheckCircle2 size={14} /> Close & Resolve
                        </button>
                      </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 custom-scrollbar bg-slate-50/50">
                      {selectedTicket.messages?.map((m: any, idx: number) => (
                        <div key={idx} className={`flex ${m.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm ${m.is_admin_reply ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
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
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.message}</p>
                            <p className={`text-[9px] mt-2 font-bold opacity-50 ${m.is_admin_reply ? 'text-blue-100' : 'text-slate-400'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shrink-0">
                      <form onSubmit={handleSendMessage} className="flex gap-4 items-end">
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
                              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <button disabled={isSending || (!replyText.trim() && !attachment)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50">
                          {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                        </button>
                      </form>
                    </div>
                  </>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 animate-in fade-in duration-500">
                  <div>
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                      <MessageSquare size={40} className="text-blue-600 opacity-20" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Assign & Take Action</h3>
                    <p className="text-sm font-medium max-w-xs mx-auto mt-2 text-slate-500 italic">Select a conversation from the left inbox to start assisting the customer.</p>
                  </div>
                </div>
              )}
            </main>

            {/* Action Overlay Panel (Desktop) */}
            {selectedTicket && !viewingUser && (
              <div className="hidden lg:block w-80 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto shrink-0">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Customer Context</h3>

                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-6 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-600/20">
                      {selectedTicket.user.name[0]}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-sm truncate">{selectedTicket.user.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold font-mono">{selectedTicket.user.mobile_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewProfile(selectedTicket.user.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-md active:scale-95"
                  >
                    <FileText size={14} /> Full History Profile
                  </button>
                </div>

                {/* Role-Based Management Sections */}
                <div className="space-y-6">
                  {/* Loan Management Section */}
                  {isLoanKycRole && (
                    <div className="animate-in slide-in-from-bottom duration-300">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock size={12} /> Loan Management
                      </h3>
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-4 space-y-3 shadow-sm">
                        <LoanActions
                          loanDetails={loanDetails}
                          isActionLoading={isActionLoading}
                          handleProceedLoan={handleProceedLoan}
                          handleSendKyc={handleSendKyc}
                          setViewingUser={setViewingUser}
                          handleViewLoanDetails={handleViewLoanDetails}
                          handleApproveLoan={handleApproveLoan}
                          handleLoanAction={handleLoanAction}
                          handleRejectLoan={handleRejectLoan}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unable to Transfer & Approved Payment Wallet Special Section */}
                  {(selectedTicket?.issue_type === 'unable-to-transfer-approved-my-emi-payment-wallet' || (selectedTicket as any).category?.slug === 'unable-to-transfer-approved-my-emi-payment-wallet') && (
                    <div className="animate-in slide-in-from-bottom duration-300">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldAlert size={12} className="text-blue-600" /> Payment & Wallet Resolution
                      </h3>
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-4 shadow-sm">

                        {/* Status Indicator */}
                        {selectedTicket.payment_status && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                                selectedTicket.payment_status === 'ADMIN_APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                  selectedTicket.payment_status === 'AGENT_APPROVED' ? 'bg-blue-100 text-blue-700' :
                                    selectedTicket.payment_status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                      'bg-amber-100 text-amber-700'
                              )}>
                                {selectedTicket.payment_status.replace('_', ' ')}
                              </span>
                            </div>
                            {(selectedTicket as any).sub_action && (
                              <p className="text-xs font-black mt-2 uppercase tracking-tight text-blue-600">
                                Intended: {(selectedTicket as any).sub_action.replace('_', ' ')} (₹{selectedTicket.payment_amount})
                              </p>
                            )}
                          </div>
                        )}

                        {(!selectedTicket.payment_status || selectedTicket.payment_status === 'PENDING_VERIFICATION') && (
                          <div className="space-y-2">
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                const amount = prompt('Enter Wallet Recharge Amount:', selectedTicket.payment_amount?.toString() || '0');
                                if (amount) handleProcessTicketAction(selectedTicket.id, 'recharge', Number(amount));
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black hover:bg-blue-100 transition-all border border-blue-100"
                            >
                              <RefreshCcw size={14} /> 1. Wallet Recharge
                            </button>

                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                // Find pendings
                                const loans = loanDetails?.loan ? [loanDetails.loan] : [];
                                const repayments = (loanDetails?.repayments || []).filter((r: any) => r.status === 'PENDING' || r.status === 'OVERDUE');

                                if (repayments.length === 0) {
                                  toast.error('No pending repayments found for this user');
                                  return;
                                }

                                const msg = repayments.map((r: any, i: number) => `${i + 1}. ID: ${r.id} | Amount: ₹${r.amount} | Due: ${r.due_date}`).join('\n');
                                const choice = prompt(`Select Repayment to pay (Enter ID):\n\n${msg}`);
                                if (choice) {
                                  const amount = prompt('Confirm/Enter Paid Amount:', selectedTicket.payment_amount?.toString() || '0');
                                  handleProcessTicketAction(selectedTicket.id, 'emi', Number(amount), Number(choice));
                                }
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black hover:bg-emerald-100 transition-all border border-emerald-100"
                            >
                              <BadgeCheck size={14} /> 2. Loan EMI Payment
                            </button>

                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                const amount = prompt('Enter Platform Fee Amount:', selectedTicket.payment_amount?.toString() || '0');
                                if (amount) handleProcessTicketAction(selectedTicket.id, 'platform_fee', Number(amount));
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-md active:scale-95"
                            >
                              <ShieldAlert size={14} /> 3. Platform Fee
                            </button>
                          </div>
                        )}

                        {selectedTicket.payment_status === 'AGENT_APPROVED' && isAdmin && (
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleProcessTicketAction(selectedTicket.id, (selectedTicket as any).sub_action || '', Number(selectedTicket.payment_amount || 0), (selectedTicket as any).target_id ? Number((selectedTicket as any).target_id) : undefined)}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 animate-bounce"
                          >
                            <CheckCircle2 size={16} /> Final Admin Success
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Verification Section (Standard) */}
                  {selectedTicket?.payment_status && selectedTicket.issue_type !== 'unable-to-transfer-approved-my-emi-payment-wallet' && (
                    <div className="animate-in slide-in-from-bottom duration-300">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <IndianRupee size={12} /> Payment Verification
                      </h3>
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-4 space-y-3 shadow-sm">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{selectedTicket.unique_ticket_id || `Payment #${selectedTicket.id}`}</p>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase mt-1 inline-block",
                                selectedTicket.payment_status === 'ADMIN_APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                  selectedTicket.payment_status === 'AGENT_APPROVED' ? 'bg-blue-100 text-blue-700' :
                                    selectedTicket.payment_status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                      'bg-amber-100 text-amber-700'
                              )}>
                                {selectedTicket.payment_status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-slate-900">₹{selectedTicket.payment_amount}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{selectedTicket.issue_type.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>

                        {selectedTicket.payment_status === 'PENDING_VERIFICATION' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleRejectTicketPayment(selectedTicket.id)}
                              className="flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black hover:bg-rose-100 transition-all border border-rose-100"
                            >
                              <X size={14} /> Reject
                            </button>
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleApproveTicketPayment(selectedTicket.id)}
                              className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                            >
                              <BadgeCheck size={14} /> Verify & Approve
                            </button>
                          </div>
                        )}

                        {selectedTicket.payment_status === 'AGENT_APPROVED' && (role === 'admin' || role === 'support') && (
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleApproveTicketPayment(selectedTicket.id)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                          >
                            <BadgeCheck size={14} /> Final Admin Approval
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Standard Actions */}
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operations</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {isCashbackRole && (
                        <button onClick={() => setShowCashbackModal(true)} className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group border border-emerald-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <IndianRupee size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Credit Cashback</span>
                          </div>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {isTransferRole && (
                        <button onClick={() => setActiveTab('repayments')} className="w-full flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-all group border border-indigo-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <BadgeCheck size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Verify Manual EMI</span>
                          </div>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert size={18} className="text-rose-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Control Panel</h4>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mb-6 leading-relaxed">Resolve this query once verification is complete. Closed tickets go to archives.</p>
                    <button
                      onClick={handleResolveTicket}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black shadow-lg hover:bg-rose-700 active:scale-95 transition-all uppercase tracking-widest"
                    >
                      Complete & Archive
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* EMI Approvals Tab */
          <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden animate-in fade-in duration-300">
            <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">EMI Verification Inbox</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 italic">Review manual payment screenshots and verify transactions.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Verification</p>
                  <p className="text-xl font-black text-blue-600">{pendingRepayments.length}</p>
                </div>
                <button onClick={fetchPendingRepayments} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
                  <RefreshCcw size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {pendingRepayments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                    <Check className="text-emerald-500" size={32} />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs">All caught up!</p>
                  <p className="text-sm font-medium mt-1">No pending manual repayments for verification.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingRepayments.map((r: any) => (
                    <div key={r.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <ImageIcon size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest">#{r.id}</span>
                      </div>
                      <h4 className="font-black text-slate-900 border-b border-slate-50 pb-3 mb-3">{r.loan.user.name}</h4>
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Amount Due:</span>
                          <span className="text-blue-600">₹{r.amount}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Due Date:</span>
                          <span>{new Date(r.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Method:</span>
                          <span className="text-slate-600">{r.payment_mode}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedRepayment(r); setShowRepaymentModal(true); }}
                          className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye size={14} /> View Proof
                        </button>
                        <button
                          onClick={() => handleApproveRepayment(r.id)}
                          disabled={isActionLoading}
                          className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manual Repayment / Proof Modal */}
      {showRepaymentModal && selectedRepayment && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            {/* Image Section */}
            <div className="lg:w-2/3 bg-slate-100 flex items-center justify-center relative overflow-hidden p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
              {selectedRepayment.proof_image ? (
                <img
                  src={getStorageUrl(selectedRepayment.proof_image)}
                  alt="Payment Proof"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border-4 border-white"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon size={64} className="mx-auto mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-sm">No Image Attached</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="lg:w-1/3 flex flex-col p-8 lg:p-10 shrink-0">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Verification</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Approval</p>
                </div>
                <button onClick={() => setShowRepaymentModal(false)} className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all">
                  <LogOut className="rotate-90 text-slate-600" size={20} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                    <p className="font-black text-slate-900">{selectedRepayment.loan?.user?.name || 'Unknown'}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-500">{selectedRepayment.loan?.user?.mobile_number}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Verify</span>
                      <span className="text-xl font-black text-blue-600">₹{selectedRepayment.amount}</span>
                    </div>
                    {selectedRepayment.transaction_id && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Transaction ID</span>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded-md break-all">{selectedRepayment.transaction_id}</span>
                      </div>
                    )}
                    {selectedRepayment.status === 'AGENT_APPROVED' && (
                      <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-emerald-600">
                        <BadgeCheck size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Agent Approved</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-xs font-black text-slate-700">{new Date(selectedRepayment.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequency</p>
                      <p className="text-xs font-black text-slate-700 capitalize">{selectedRepayment.loan?.payout_frequency || 'Monthly'}</p>
                    </div>
                  </div>

                  {selectedRepayment.notes && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">User Notes</p>
                      <p className="text-xs font-medium text-amber-800">{selectedRepayment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 space-y-3 mt-auto">
                <button
                  onClick={() => handleApproveRepayment(selectedRepayment.id)}
                  disabled={isActionLoading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Check size={16} /> {isActionLoading ? 'Processing...' : (isAdmin ? 'Final Admin Approval' : 'Agent Verification')}
                </button>
                <button
                  onClick={() => setShowRepaymentModal(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black hover:bg-slate-200 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Cancel Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}{/* Loan Detail Modal */}
      {showLoanDetailModal && selectedLoanDetail && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Loan Details</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID #{selectedLoanDetail.loan?.id}</p>
              </div>
              <button onClick={() => setShowLoanDetailModal(false)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all">
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="font-black text-slate-900">{selectedLoanDetail.loan?.user?.name || 'Unknown'}</p>
                <p className="text-[10px] font-mono font-bold text-slate-500">{selectedLoanDetail.loan?.user?.mobile_number}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Loan Info</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-400">Amount:</span>
                    <span className="text-blue-700 text-lg font-black">₹{Number(selectedLoanDetail.loan?.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-400">Plan:</span>
                    <span className="text-blue-700">{selectedLoanDetail.loan?.plan?.name || 'General'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-400">Status:</span>
                    <span className="text-blue-700 uppercase">{selectedLoanDetail.loan?.status}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-400">Applied:</span>
                    <span className="text-blue-700">{selectedLoanDetail.loan?.created_at ? new Date(selectedLoanDetail.loan.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedLoanDetail.loan?.calculations && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Calculations</p>
                  <div className="space-y-1">
                    {selectedLoanDetail.loan?.calculations && typeof selectedLoanDetail.loan.calculations === 'object' && Object.entries(selectedLoanDetail.loan.calculations).map(([key, val]: [string, any]) => (
                      typeof val !== 'object' && (
                        <div key={key} className="flex justify-between text-[10px] font-bold">
                          <span className="text-emerald-500 uppercase">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-emerald-800">{typeof val === 'number' ? `₹${val.toLocaleString()}` : String(val)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {selectedLoanDetail.loan?.form_data && Object.keys(selectedLoanDetail.loan.form_data).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">KYC Documents & Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLoanDetail.loan?.form_data && typeof selectedLoanDetail.loan.form_data === 'object' && Object.entries(selectedLoanDetail.loan.form_data).map(([key, val]: [string, any]) => {
                      const isImgObj = val && typeof val === 'object' && val.url;
                      const isImgStr = typeof val === 'string' && (val.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i) || val.includes('storage/'));
                      const isImage = isImgObj || isImgStr;
                      const imageUrl = isImgObj ? val.url : val;

                      const isUrl = typeof val === 'string' && val.startsWith('http') && !isImage;

                      if (isImage) {
                        return (
                          <div key={key} className="col-span-1 md:col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</p>
                            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group aspect-video overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                              <img src={imageUrl} alt={key} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                              </div>
                            </a>
                            {val.geo && (
                              <div className="flex gap-2 mt-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Lat: {val.geo.lat?.toFixed(4)}</span>
                                <span>Lng: {val.geo.lng?.toFixed(4)}</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (isUrl) {
                        return (
                          <div key={key} className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                            <a href={val} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1">
                              Open Link <ExternalLink size={10} />
                            </a>
                          </div>
                        );
                      }

                      if (['consent', 'auto_approved', 'auto_approved_at'].includes(key)) return null;

                      return (
                        <div key={key} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] font-black text-slate-700 break-words">{String(val)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowLoanDetailModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashback Modal */}
      {showCashbackModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6">Credit Award</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Benefit Amount</label>
                <input type="number" value={cashbackAmount} onChange={e => setCashbackAmount(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-black text-blue-600 text-lg" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Internal Note</label>
                <textarea value={cashbackReason} onChange={e => setCashbackReason(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-sm min-h-[100px] font-medium" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCashbackModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
              <button onClick={handleAddCashback} disabled={isProcessingCashback || !cashbackAmount} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                {isProcessingCashback ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Approve Credit'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Call Interface Modal */}
      {activeCall && (
        <CallInterface
          partnerId={activeCall.userId}
          partnerName={activeCall.name}
          authToken={localStorage.getItem('token') || ''}
          agentId={currentUser?.id}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
