import React, { useState, useEffect } from 'react';
import { X, User, Phone, Wallet, Clock, ChevronRight, BadgeCheck, Ban, Calculator, IndianRupee, Send, Gift } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/loanUtils';
import KYCPreviewModal from '@/components/support/KYCPreviewModal';

interface UserDetailsModalProps {
    isOpen: boolean;
    user: any;
    currentUserId: number;
    onClose: () => void;
}

export default function UserDetailsModal({ isOpen, user, currentUserId, onClose }: UserDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'loans' | 'cashback' | 'transactions'>('loans');
    const [loans, setLoans] = useState<any[]>([]);
    const [cashbackTxns, setCashbackTxns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [previewLoan, setPreviewLoan] = useState<any>(null);
    const [cashbackAmount, setCashbackAmount] = useState('');
    const [cashbackDescription, setCashbackDescription] = useState('');
    const [cashbackLoading, setCashbackLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchData();
        }
    }, [isOpen, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [loansData, txData] = await Promise.all([
                apiFetch<any>('/admin/loans').catch(() => []),
                apiFetch<any>(`/admin/users/${user.id}/transactions`).catch(() => [])
            ]);

            setLoans(loansData.filter((l: any) => l.user_id === user.id));
            // Filter cashback/credit transactions for the Cashback tab
            const allTxns = Array.isArray(txData) ? txData : [];
            setCashbackTxns(allTxns.filter((t: any) => t.type === 'CREDIT'));
        } catch (error) {
            console.error("Failed to load user data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoanAction = async (id: number, endpoint: string, successMsg: string) => {
        setActionLoading(`${id}-${endpoint}`);
        try {
            await apiFetch(`/admin/loans/${id}/${endpoint}`, { method: 'POST' });
            alert(successMsg);
            fetchData();
        } catch (e) {
            alert('Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header Profile */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black">
                            {user.name?.[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">{user.name}</h2>
                            <div className="flex items-center gap-4 text-slate-400 mt-1 text-sm font-medium">
                                <span className="flex items-center gap-1.5"><Phone size={14} /> {user.mobile_number}</span>
                                <span className="flex items-center gap-1.5"><Wallet size={14} /> ₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    user.status === 'ACTIVE' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                )}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 shrink-0">
                    {(['loans', 'cashback', 'transactions'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-4 font-bold text-sm transition-colors border-b-2 capitalize",
                                activeTab === tab ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'loans' && (
                                <div className="space-y-3">
                                    {loans.length === 0 ? <p className="text-center text-slate-400 py-10 font-bold">No loans found.</p> : loans.map(loan => (
                                        <div key={loan.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                                                        loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                                            loan.status === 'DISBURSED' ? 'bg-blue-100 text-blue-600' :
                                                                loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                                                                    'bg-slate-100 text-slate-600'
                                                    )}>
                                                        {loan.status}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-bold">#{loan.id} • {new Date(loan.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-slate-900">₹{parseFloat(loan.amount).toLocaleString('en-IN')}</span>
                                                    <span className="text-xs font-bold text-slate-400">for {loan.tenure}m</span>
                                                </div>
                                                {loan.kyc_sent_by && (
                                                    <p className="text-[10px] bg-slate-100 px-1 py-0.5 rounded inline-block text-slate-500">
                                                        Sent by Agent #{loan.kyc_sent_by}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                {['PROCEEDED', 'KYC_SENT', 'FORM_SUBMITTED'].includes(loan.status) && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleLoanAction(loan.id, 'send-kyc', 'KYC Link Sent')}
                                                        className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg font-bold text-xs hover:bg-amber-100 transition-all flex items-center gap-2"
                                                    >
                                                        <Send size={14} /> {loan.status === 'KYC_SENT' ? 'Resend Link' : 'Send Link'}
                                                    </button>
                                                )}
                                                {['FORM_SUBMITTED', 'APPROVED', 'DISBURSED', 'REJECTED'].includes(loan.status) && (
                                                    loan.kyc_sent_by === currentUserId ? (
                                                        <button
                                                            onClick={() => setPreviewLoan(loan)}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                                                        >
                                                            <BadgeCheck size={14} /> View Form
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 border border-slate-100 px-2 py-1 rounded select-none">
                                                            Restricted
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'cashback' && (
                                <div className="space-y-5">
                                    {/* Cashback Disbursement Form */}
                                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                <Gift size={16} />
                                            </div>
                                            <h4 className="font-bold text-slate-900 text-sm">Disburse Cashback</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="number"
                                                placeholder="Amount (₹)"
                                                value={cashbackAmount}
                                                onChange={(e) => setCashbackAmount(e.target.value)}
                                                className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Description (e.g. Cashback for Loan #12)"
                                                value={cashbackDescription}
                                                onChange={(e) => setCashbackDescription(e.target.value)}
                                                className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 md:col-span-1"
                                            />
                                            <button
                                                disabled={cashbackLoading || !cashbackAmount || !cashbackDescription}
                                                onClick={async () => {
                                                    if (!confirm(`Disburse ₹${cashbackAmount} cashback to ${user.name}?`)) return;
                                                    setCashbackLoading(true);
                                                    try {
                                                        await apiFetch<any>(`/admin/users/${user.id}/credit-cashback`, {
                                                            method: 'POST',
                                                            body: JSON.stringify({
                                                                amount: parseFloat(cashbackAmount),
                                                                description: cashbackDescription
                                                            })
                                                        });
                                                        alert('Cashback disbursed successfully!');
                                                        setCashbackAmount('');
                                                        setCashbackDescription('');
                                                        fetchData();
                                                    } catch (e) {
                                                        alert('Failed to disburse cashback');
                                                    } finally {
                                                        setCashbackLoading(false);
                                                    }
                                                }}
                                                className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {cashbackLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <><Send size={14} /> Disburse</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cashback History */}
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback History</h4>
                                    {cashbackTxns.length === 0 ? <p className="text-center text-slate-400 py-10 font-bold">No cashback transactions found.</p> : cashbackTxns.map(tx => (
                                        <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-600">Credit</span>
                                                    <span className="text-xs font-bold text-slate-400">{new Date(tx.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="font-bold text-slate-900 mt-1">{tx.description}</p>
                                            </div>
                                            <p className="font-black text-lg text-emerald-600">+₹{tx.amount}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div className="space-y-3">
                                    {cashbackTxns.length === 0 ? <p className="text-center text-slate-400 py-10 font-bold">No transactions found.</p> : (() => {
                                        // Show ALL transactions (not just credits) - refetch if needed
                                        return <p className="text-center text-slate-400 py-6 font-bold text-sm">View wallet transactions in Admin Panel.</p>;
                                    })()}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* KYC Preview Modal Overlay */}
            {previewLoan && (
                <KYCPreviewModal
                    loan={previewLoan}
                    onClose={() => setPreviewLoan(null)}
                />
            )}
        </div>
    );
}
