
import { X, ArrowLeft, Calendar, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UserProfilePanelProps {
    userId: number;
    onClose: () => void;
}

export default function UserProfilePanel({ userId, onClose }: UserProfilePanelProps) {
    const [user, setUser] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Fetch User Details (Includes loans and transactions)
                const userRes: any = await apiFetch(`/admin/users/${userId}/full-details`);
                setUser(userRes);

                // Use loans from the full-details response
                // Structure: userRes.loans = { ongoing: [], past: [], ... }
                if (userRes.loans) {
                    const allLoans = [...(userRes.loans.ongoing || []), ...(userRes.loans.past || [])];
                    setLoans(allLoans);
                } else {
                    setLoans([]);
                }
            } catch (e) {
                console.error(e);
                toast.error("Failed to load user profile");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchDetails();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="w-96 bg-slate-50 border-l border-slate-200 p-6 flex items-center justify-center shrink-0">
                <div className="flex flex-col items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex-1 bg-slate-50 h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-8 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Customer Profile</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${user.user?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.user?.status}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">

                <div className="max-w-5xl mx-auto space-y-12">
                    {/* Hero Section */}
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-4xl font-black border border-white/10">
                                {user.user?.name?.[0]}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight">{user.user?.name}</h3>
                                <p className="text-slate-400 font-mono mt-1 opacity-80">{user.user?.mobile_number}</p>
                                <div className="flex items-center gap-3 mt-4">
                                    <span className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/5">
                                        ID: {user.user?.id}
                                    </span>
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 ${user.user?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                        {user.user?.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Loans</p>
                            <p className="text-3xl font-black text-slate-900">{loans.length}</p>
                        </div>
                        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Wallet App</p>
                            <p className="text-3xl font-black text-emerald-600">₹{Number(user.wallet?.balance || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Loan History */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={12} /> Loan History
                        </h4>
                        <div className="space-y-3">
                            {loans.map((loan: any) => (
                                <div key={loan.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-black text-slate-900">Loan #{loan.id}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{new Date(loan.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${loan.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                            loan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                                loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {loan.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="text-slate-500">Amount: <span className="text-slate-900">₹{loan.amount}</span></span>
                                        {loan.sub_user_id && <span className="text-blue-600">Ref: {loan.sub_user_id}</span>}
                                    </div>
                                </div>
                            ))}
                            {loans.length === 0 && (
                                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                    <p className="text-[10px] font-bold text-slate-400">No loans found</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
