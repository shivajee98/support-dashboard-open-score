import {
    FileText, Clock, ShieldAlert, IndianRupee, BadgeCheck, RotateCw, RefreshCcw, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { Ticket } from '@/components/dashboard/types';
import LoanActions from '@/components/dashboard/LoanActions';
import { cn } from '@/lib/loanUtils';
import { toast } from 'sonner';

interface CustomerContextPanelProps {
    selectedTicket: Ticket | null;
    viewingUser: any;
    setViewingUser: (val: any) => void;
    isLoanKycRole: boolean;
    loanDetails: any;
    isActionLoading: boolean;
    handleProceedLoan: (id: number) => void;
    handleSendKyc: (id: number) => void;
    handleViewLoanDetails: (id: number) => void;
    handleApproveLoan: (id: number) => void;
    handleLoanAction: (id: number, action: string) => void;
    handleRejectLoan: (id: number) => void;
    role: string;
    handleProcessTicketAction: (ticketId: number, action: string, amount: number, targetId?: number) => void;
    handleApproveTicketPayment: (ticketId: number) => void;
    handleRejectTicketPayment: (ticketId: number) => void;
    isAdmin: boolean;
    isCashbackRole: boolean;
    setShowCashbackModal: (val: boolean) => void;
    isTransferRole: boolean;
    setActiveTab: (val: string) => void;
    handleResolveTicket: () => void;
    handleViewProfile: (userId: number) => void;
}

export default function CustomerContextPanel({
    selectedTicket,
    viewingUser,
    setViewingUser,
    isLoanKycRole,
    loanDetails,
    isActionLoading,
    handleProceedLoan,
    handleSendKyc,
    handleViewLoanDetails,
    handleApproveLoan,
    handleLoanAction,
    handleRejectLoan,
    role,
    handleProcessTicketAction,
    handleApproveTicketPayment,
    handleRejectTicketPayment,
    isAdmin,
    isCashbackRole,
    setShowCashbackModal,
    isTransferRole,
    setActiveTab,
    handleResolveTicket,
    handleViewProfile
}: CustomerContextPanelProps) {

    if (!selectedTicket || viewingUser) return null;

    return (
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
            </div>
        </div>
    );
}
