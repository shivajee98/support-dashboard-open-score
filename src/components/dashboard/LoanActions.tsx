import { ChevronRight, PlayCircle, ExternalLink, Eye, BadgeCheck, IndianRupee, Clock } from 'lucide-react';

interface LoanActionsProps {
    loanDetails: any;
    isActionLoading: boolean;
    handleProceedLoan: (id: number) => void;
    handleSendKyc: (id: number) => void;
    setViewingUser: (id: number) => void;
    handleViewLoanDetails: (id: number) => void;
    handleApproveLoan: (id: number) => void;
    handleLoanAction: (id: number, action: string, message: string) => void;
    handleRejectLoan: (id: number, reason: string) => void;
}

export default function LoanActions({
    loanDetails,
    isActionLoading,
    handleProceedLoan,
    handleSendKyc,
    setViewingUser,
    handleViewLoanDetails,
    handleApproveLoan,
    handleLoanAction,
    handleRejectLoan
}: LoanActionsProps) {
    if (!loanDetails) {
        return (
            <div className="text-center py-6">
                <Clock className="mx-auto mb-2 opacity-20" size={24} />
                <p className="text-[10px] font-bold text-slate-400">No active applications found</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ID #{loanDetails.loan.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${loanDetails.loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        loanDetails.loan.status === 'KYC_SENT' ? 'bg-blue-100 text-blue-700' :
                            loanDetails.loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                'bg-slate-100 text-slate-500'
                        }`}>
                        {loanDetails.loan.status}
                    </span>
                </div>
                <p className="text-xs font-black">₹{loanDetails.loan.amount} Loan</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{loanDetails.loan.plan?.name || 'General Loan'}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {/* Action: Proceed Loan */}
                {loanDetails.loan.status === 'PENDING' && (
                    <button
                        onClick={() => handleProceedLoan(loanDetails.loan.id)}
                        disabled={isActionLoading}
                        className="w-full flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50 group"
                    >
                        <div className="flex items-center gap-2">
                            <PlayCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Proceed Application</span>
                        </div>
                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-all" />
                    </button>
                )}

                {/* Action 1: Send KYC */}
                <button
                    onClick={() => handleSendKyc(loanDetails.loan.id)}
                    disabled={isActionLoading || !['PROCEEDED', 'KYC_SENT', 'FORM_SUBMITTED'].includes(loanDetails.loan.status)}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50 group"
                >
                    <div className="flex items-center gap-2">
                        <ExternalLink size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Send KYC Link</span>
                    </div>
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-all" />
                </button>

                {/* Action 2: View KYC Data */}
                <button
                    onClick={() => handleViewLoanDetails(loanDetails.loan.id)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <Eye size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">View KYC Details</span>
                    </div>
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-all" />
                </button>

                {/* Action 3: Approve Loan */}
                {loanDetails.loan.status === 'FORM_SUBMITTED' && (
                    <button
                        onClick={() => handleApproveLoan(loanDetails.loan.id)}
                        disabled={isActionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <BadgeCheck size={14} /> {isActionLoading ? 'Processing...' : 'Approve Application'}
                    </button>
                )}

                {/* Action 4: Disburse Funds */}
                {loanDetails.loan.status === 'APPROVED' && (
                    <button
                        onClick={() => {
                            if (confirm('Disburse funds for this loan?')) {
                                handleLoanAction(loanDetails.loan.id, 'release', 'Loan Disbursed Successfully');
                            }
                        }}
                        disabled={isActionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <IndianRupee size={14} /> {isActionLoading ? 'Processing...' : 'Disburse Loan'}
                    </button>
                )}

                {/* Action 5: Reject Loan */}
                {!['DISBURSED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(loanDetails.loan.status) && (
                    <button
                        onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                                handleRejectLoan(loanDetails.loan.id, reason);
                            }
                        }}
                        disabled={isActionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black hover:bg-rose-100 transition-all disabled:opacity-50 mt-2"
                    >
                        Reject Application
                    </button>
                )}
            </div>
        </>
    );
}
