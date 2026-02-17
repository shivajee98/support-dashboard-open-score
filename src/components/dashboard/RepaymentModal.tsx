import { BadgeCheck, Check, ImageIcon, LogOut, Eye } from 'lucide-react';
import { LoanRepayment } from '@/components/dashboard/types';

interface RepaymentModalProps {
    repayment: LoanRepayment;
    onClose: () => void;
    onApprove: (id: number) => void;
    isActionLoading: boolean;
    isAdmin: boolean;
    getStorageUrl: (path: string) => string;
}

export default function RepaymentModal({
    repayment: selectedRepayment,
    onClose,
    onApprove,
    isActionLoading,
    isAdmin,
    getStorageUrl
}: RepaymentModalProps) {
    if (!selectedRepayment) return null;

    return (
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
                        <button onClick={onClose} className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all">
                            <LogOut className="rotate-90 text-slate-600" size={20} />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                <p className="font-black text-slate-900">{selectedRepayment.loan?.user?.name || 'Unknown'}</p>
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
                            onClick={() => onApprove(selectedRepayment.id)}
                            disabled={isActionLoading}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Check size={16} /> {isActionLoading ? 'Processing...' : (isAdmin ? 'Final Admin Approval' : 'Agent Verification')}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black hover:bg-slate-200 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            Cancel Review
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
