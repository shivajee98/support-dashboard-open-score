'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { Ticket } from '@/components/dashboard/types';

// Components
import Sidebar from '@/components/dashboard/Sidebar';
import ChatArea from '@/components/dashboard/ChatArea';
import CustomerContextPanel from '@/components/dashboard/CustomerContextPanel';

// Modals
import PurposeModal from '@/components/dashboard/PurposeModal';
import RepaymentModal from '@/components/dashboard/RepaymentModal';
import LoanDetailModal from '@/components/dashboard/LoanDetailModal';
import CashbackModal from '@/components/dashboard/CashbackModal';
import CallInterfaceModal from '@/components/dashboard/CallInterfaceModal';

// Icons for notification cards
import { ShieldAlert, User, X, Check, ImageIcon, Eye, RefreshCcw } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();

  // -- State Management --
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [viewingUser, setViewingUser] = useState<any>(null);

  // Cashback
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

  // Unassigned Tickets Pool state
  const [incomingTickets, setIncomingTickets] = useState<Ticket[]>([]);
  const [acknowledgedTicketIds, setAcknowledgedTicketIds] = useState<Set<number>>(new Set());

  // Loan Pipeline state
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<any>(null);
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);

  // Purpose Modal
  const [showPurposeModal, setShowPurposeModal] = useState(false);

  // Call Interface
  const [activeCall, setActiveCall] = useState<any>(null);

  // -- Roles & Permissions --
  const role = currentUser?.role?.toLowerCase();
  const isLoanKycRole = role === 'admin' || currentUser?.support_category_id === 2; // Assuming 2 is Loan/KYC
  const isCashbackRole = role === 'admin' || currentUser?.support_category_id === 3; // Assuming 3 is Cashback/Rewards
  const isTransferRole = role === 'admin' || currentUser?.support_category_id === 4; // Assuming 4 is Transfer/Payments (or 5)
  const isAdmin = role === 'admin';

  // -- Effects --

  // 1. Initial Load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Poll for unassigned tickets
  useEffect(() => {
    if (!currentUser) return;
    const pollUnassigned = async () => {
      try {
        const res: any = await apiFetch('/admin/support/pool'); // Endpoint to get unassigned/new tickets
        if (Array.isArray(res)) {
          const newTickets = res.filter((t: Ticket) => !acknowledgedTicketIds.has(t.id));
          setIncomingTickets(newTickets);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    const interval = setInterval(pollUnassigned, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [currentUser, acknowledgedTicketIds]);

  // -- Data Fetching --

  const fetchCurrentUser = async () => {
    try {
      const user: any = await apiFetch('/auth/me');
      setCurrentUser(user);
      fetchTickets();
      if (user.role === 'admin' || user.support_category_id === 4) { // Assuming 4 is Transfer/Payments
        fetchPendingRepayments();
      }
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res: any = await apiFetch(`/admin/support/tickets?status=${ticketFilter}`);
      setTickets(res.data || []);
    } catch (err) {
      toast.error('Failed to load tickets');
    }
  };

  const fetchPendingRepayments = async () => {
    try {
      const res: any = await apiFetch('/admin/loan-repayments/manual-verification');
      setPendingRepayments(res || []);
    } catch (err) {
      toast.error('Failed to load pending repayments');
    }
  };

  // -- Actions --

  const selectTicket = async (ticket: Ticket) => {
    // If we're clicking the same ticket, do nothing
    if (selectedTicket?.id === ticket.id) return;

    setSelectedTicket(ticket);
    setViewingUser(null); // Reset viewing user profile when switching tickets

    // Fetch fresh details for the ticket to ensure we have messages
    try {
      const details: any = await apiFetch(`/admin/support/tickets/${ticket.id}`);
      setSelectedTicket(details);

      // Fetch Loan Details if applicable
      if (details.user_id) {
        try {
          const loans: any = await apiFetch(`/admin/users/${details.user_id}/loans`);
          // Assuming we pick the active or last loan
          const activeLoan = loans.find((l: any) => l.status === 'ACTIVE' || l.status === 'PENDING') || loans[0];

          if (activeLoan) {
            const repayments = await apiFetch(`/admin/loans/${activeLoan.id}/repayments`);
            setLoanDetails({ loan: activeLoan, repayments });
          } else {
            setLoanDetails(null);
          }
        } catch (e) {
          console.error("Failed to fetch loan details", e);
        }
      }

    } catch (e) {
      toast.error("Failed to load ticket details");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !attachment)) return;

    // Open purpose modal if there is an attachment
    if (attachment) {
      setShowPurposeModal(true);
      return;
    }

    submitMessage();
  };

  const handlePurposeSelect = (purpose: string) => {
    setShowPurposeModal(false);
    submitMessage(purpose);
  };

  const submitMessage = async (purpose?: string) => {
    if (!selectedTicket) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('message', replyText);
      if (attachment) {
        formData.append('attachment', attachment);
        if (purpose) formData.append('purpose', purpose);
      }

      const res: any = await apiFetch(`/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: formData,
      });

      // Update messages locally
      const newMessage = res.message || res; // Adapt based on actual API response structure

      setSelectedTicket(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), newMessage]
      } : null);

      setReplyText('');
      setAttachment(null);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('Are you sure you want to resolve and close this ticket?')) return;

    try {
      await apiFetch(`/admin/support/tickets/${selectedTicket.id}/resolve`, { method: 'POST' });
      toast.success('Ticket resolved');
      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
      setSelectedTicket(null);
    } catch (err) {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleProcessTicketAction = async (ticketId: number, action: string, amount: number, targetId?: number) => {
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/support/tickets/${ticketId}/process-action`, {
        method: 'POST',
        body: JSON.stringify({ action, amount, target_id: targetId }),
      });
      toast.success('Action processed successfully');

      // Refresh details
      const updated: any = await apiFetch(`/admin/support/tickets/${ticketId}`);
      setSelectedTicket(updated);
    } catch (err) {
      toast.error('Failed to process action');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveTicketPayment = async (ticketId: number) => {
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/support/tickets/${ticketId}/approve-payment`, { method: 'POST' });
      toast.success('Payment approved');
      const updated: any = await apiFetch(`/admin/support/tickets/${ticketId}`);
      setSelectedTicket(updated);
    } catch (err) {
      toast.error('Failed to approve payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectTicketPayment = async (ticketId: number) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/support/tickets/${ticketId}/reject-payment`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      toast.success('Payment rejected');
      const updated: any = await apiFetch(`/admin/support/tickets/${ticketId}`);
      setSelectedTicket(updated);
    } catch (err) {
      toast.error('Failed to reject payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  // -- Loan Actions --
  const handleProceedLoan = async (id: number) => {
    try {
      await apiFetch(`/admin/loans/${id}/proceed`, { method: 'POST' });
      toast.success("Loan proceeded");
      // Refresh loan details
      if (selectedTicket) selectTicket(selectedTicket);
    } catch (e) {
      toast.error("Failed to proceed loan");
    }
  };

  const handleSendKyc = async (id: number) => {
    try {
      await apiFetch(`/admin/loans/${id}/send-kyc`, { method: 'POST' });
      toast.success("KYC Link sent");
    } catch (e) {
      toast.error("Failed to send KYC link");
    }
  };

  const handleViewLoanDetails = async (id: number) => {
    try {
      const details: any = await apiFetch(`/admin/loans/${id}/details`);
      setSelectedLoanDetail(details);
      setShowLoanDetailModal(true);
    } catch (e) {
      toast.error("Failed to fetch details");
    }
  };

  const handleApproveLoan = async (id: number) => {
    if (!confirm("Approve this loan?")) return;
    try {
      await apiFetch(`/admin/loans/${id}/approve`, { method: 'POST' });
      toast.success("Loan approved");
      if (selectedTicket) selectTicket(selectedTicket);
    } catch (e) {
      toast.error("Failed to approve loan");
    }
  };

  const handleRejectLoan = async (id: number) => {
    const reason = prompt("Rejection Reason:");
    if (!reason) return;
    try {
      await apiFetch(`/admin/loans/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      toast.success("Loan rejected");
      if (selectedTicket) selectTicket(selectedTicket);
    } catch (e) {
      toast.error("Failed to reject loan");
    }
  };

  const handleLoanAction = async (id: number, action: string) => {
    try {
      await apiFetch(`/admin/loans/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      toast.success("Action completed");
      if (selectedTicket) selectTicket(selectedTicket);
    } catch (e) {
      toast.error("Failed to perform action");
    }
  };

  // -- Repayment Actions --
  const handleApproveRepayment = async (id: number) => {
    if (!confirm('Approve this manual repayment?')) return;
    setIsActionLoading(true);
    try {
      await apiFetch(`/admin/loan-repayments/${id}/approve-manual`, { method: 'POST' });
      toast.success('Repayment verified successfully');
      setPendingRepayments(prev => prev.filter(p => p.id !== id));
      setShowRepaymentModal(false);
      fetchPendingRepayments();
    } catch (err) {
      toast.error('Failed to approve repayment');
    } finally {
      setIsActionLoading(false);
    }
  };

  // -- Cashback Actions --
  const handleAddCashback = async () => {
    if (!selectedTicket) return;
    setIsProcessingCashback(true);
    try {
      await apiFetch(`/admin/users/${selectedTicket.user_id}/cashback`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(cashbackAmount),
          description: cashbackReason
        })
      });
      toast.success('Cashback credited successfully');
      setShowCashbackModal(false);
      setCashbackAmount('');
    } catch (err) {
      toast.error('Failed to credit cashback');
    } finally {
      setIsProcessingCashback(false);
    }
  };

  // -- Misc --
  const getStorageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}/storage/${path}`;
  };

  const handleViewProfile = (userId: number) => {
    window.open(`/admin/users/${userId}`, '_blank');
  };

  if (isLoading) { // Use Loader2 here? Check imports. Yes, lucide-react doesn't export Loader2 usually, it's Loader or specific package. Wait.
    // Lucide-react DOES export Loader2.
    // However, I didn't import Loader2 in the top imports in the ReplacementContent above!
    // I imported: ShieldAlert, User, X, Check, ImageIcon, Eye, RefreshCcw.
    // I NEED to import Loader2.

    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // -- Render --

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex w-full">

        {/* Left Sidebar: Tickets List */}
        <Sidebar
          currentUser={currentUser}
          tickets={tickets}
          selectedTicket={selectedTicket}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          ticketFilter={ticketFilter}
          setTicketFilter={setTicketFilter}
          onSelectTicket={selectTicket}
          onRefresh={fetchTickets}
        />

        {/* Middle: Chat / Content Area */}
        {activeTab === 'tickets' ? (
          <ChatArea
            selectedTicket={selectedTicket}
            replyText={replyText}
            setReplyText={setReplyText}
            isSending={isSending}
            onSendMessage={handleSendMessage}
            attachment={attachment}
            setAttachment={setAttachment}
            fileInputRef={fileInputRef}
            getStorageUrl={getStorageUrl}
          />
        ) : (
          // EMI Verification Inbox Mode
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

        {/* Right Sidebar: Context Panel (Only in tickets mode) */}
        {activeTab === 'tickets' && (
          <CustomerContextPanel
            selectedTicket={selectedTicket}
            viewingUser={viewingUser}
            setViewingUser={setViewingUser}
            isLoanKycRole={isLoanKycRole}
            loanDetails={loanDetails}
            isActionLoading={isActionLoading}
            handleProceedLoan={handleProceedLoan}
            handleSendKyc={handleSendKyc}
            handleViewLoanDetails={handleViewLoanDetails}
            handleApproveLoan={handleApproveLoan}
            handleLoanAction={handleLoanAction}
            handleRejectLoan={handleRejectLoan}
            role={role}
            handleProcessTicketAction={handleProcessTicketAction}
            handleApproveTicketPayment={handleApproveTicketPayment}
            handleRejectTicketPayment={handleRejectTicketPayment}
            isAdmin={isAdmin}
            isCashbackRole={isCashbackRole}
            setShowCashbackModal={setShowCashbackModal}
            isTransferRole={isTransferRole}
            setActiveTab={setActiveTab}
            handleResolveTicket={handleResolveTicket}
            handleViewProfile={handleViewProfile}
          />
        )}
      </div>

      {/* -- Modals -- */}

      {showPurposeModal && (
        <PurposeModal
          onSelect={handlePurposeSelect}
          onClose={() => setShowPurposeModal(false)}
          attachmentName={attachment?.name}
        />
      )}

      {showRepaymentModal && selectedRepayment && (
        <RepaymentModal
          repayment={selectedRepayment}
          onApprove={handleApproveRepayment}
          onClose={() => setShowRepaymentModal(false)}
          isActionLoading={isActionLoading}
          isAdmin={isAdmin}
          getStorageUrl={getStorageUrl}
        />
      )}

      {showLoanDetailModal && selectedLoanDetail && (
        <LoanDetailModal
          loan={selectedLoanDetail}
          onClose={() => setShowLoanDetailModal(false)}
        />
      )}

      {showCashbackModal && (
        <CashbackModal
          amount={cashbackAmount}
          setAmount={setCashbackAmount}
          reason={cashbackReason}
          setReason={setCashbackReason}
          isProcessing={isProcessingCashback}
          onConfirm={handleAddCashback}
          onClose={() => setShowCashbackModal(false)}
        />
      )}

      {activeCall && currentUser && (
        <CallInterfaceModal
          activeCall={activeCall}
          currentUser={currentUser}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Incoming Tickets Popup Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 pointer-events-none">
        {incomingTickets.slice(0, 3).map((ticket, idx) => (
          <div
            key={ticket.id}
            className="w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-right duration-500"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">New Request</h4>
                  <p className="text-sm font-black text-slate-900">Ticket #{ticket.id}</p>
                </div>
              </div>
              <button
                onClick={() => setAcknowledgedTicketIds(prev => new Set([...prev, ticket.id]))}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6">
              <h5 className="text-sm font-bold text-slate-800 mb-1">{ticket.subject}</h5>
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <User size={10} /> {ticket.user?.name}
                <span className="mx-1">•</span>
                {ticket.issue_type.replace(/-/g, ' ')}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setAcknowledgedTicketIds(prev => new Set([...prev, ticket.id]));
                  await selectTicket(ticket);
                  try {
                    const updated: any = await apiFetch(`/admin/support/assign/${ticket.id}`, { method: 'POST' });
                    setSelectedTicket(updated);
                    // Also refresh list
                    fetchTickets();
                  } catch (e) {
                    toast.error("Failed to assign ticket");
                  }
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                Accept & Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
