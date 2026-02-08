"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Search, Calendar, FileText, Smartphone } from 'lucide-react';
import { cn } from '@/lib/loanUtils';

interface Repayment {
    id: number;
    amount: string;
    status: string;
    proof_image: string | null;
    submitted_at: string;
    updated_at: string;
    payment_mode: string;
    loan: {
        id: number;
        user: {
            id: number;
            name: string;
            email: string;
            mobile_number: string;
        }
    };
}

export default function PaymentsPage() {
    const [repayments, setRepayments] = useState<Repayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/repayments/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRepayments(data.data || []);
            } else {
                toast.error("Failed to fetch payments");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error fetching payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this payment?`)) return;

        setProcessingId(id);
        try {
            const token = localStorage.getItem('token');
            // For reject we might need a reason, but for MVP we skip or hardcode
            const body = action === 'reject' ? JSON.stringify({ reason: 'Verification failed by agent' }) : null;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/repayments/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body
            });

            if (res.ok) {
                toast.success(`Payment ${action}d successfully`);
                setRepayments(prev => prev.filter(r => r.id !== id));
                setPreviewImage(null);
            } else {
                const d = await res.json();
                toast.error(d.error || `Failed to ${action}`);
            }
        } catch (e) {
            toast.error(`Error processing request`);
        } finally {
            setProcessingId(null);
        }
    };

    // Construct image URL function
    const getImageUrl = (path: string | null) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // Assuming backend serves storage/ via direct link or we need full URL
        // We configured 'APP_URL' in backend. usually 'storage/app/public' -> 'storage' symlink.
        // The backend stores relative path 'repayments/xyz.jpg'.
        // We need 'BACKEND_URL/storage/repayments/xyz.jpg'. 
        // Or if we use `Storage::url()` it returns `/storage/...`.
        return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${path}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
                    <p className="text-slate-500 text-sm">Review manual UPI payments</p>
                </div>
                <button onClick={fetchPayments} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                    Refresh List
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading payments...</div>
            ) : repayments.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 font-medium">No pending verifications</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {repayments.map(rep => (
                        <div key={rep.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6">
                            {/* Proof Image Preview */}
                            <div className="w-full md:w-64 h-64 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0 relative overflow-hidden group">
                                {rep.proof_image ? (
                                    <img
                                        src={getImageUrl(rep.proof_image)}
                                        alt="Proof"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={() => setPreviewImage(getImageUrl(rep.proof_image || ''))}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold pointer-events-none">
                                    Click to Expand
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-slate-900">₹{parseFloat(rep.amount).toLocaleString()}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-medium text-slate-700">{rep.loan.user.name}</span>
                                            <span>•</span>
                                            <span>{rep.loan.user.mobile_number}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono">LOAN-#{rep.loan.id} • EMI-#{rep.id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100">
                                            Pending Review
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {new Date(rep.updated_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Payment Mode</span>
                                        <span className="font-medium flex items-center gap-2"><Smartphone size={14} /> UPI Manual</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-400 uppercase tracking-widest mb-1">Submitted At</span>
                                        <span className="font-medium">{new Date(rep.updated_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => handleAction(rep.id, 'approve')}
                                        disabled={processingId === rep.id}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Approve Payment
                                    </button>
                                    <button
                                        onClick={() => handleAction(rep.id, 'reject')}
                                        disabled={processingId === rep.id}
                                        className="flex-1 py-2.5 bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 rounded-lg font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="Full Proof" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white hover:text-rose-400">
                        <XCircle size={32} />
                    </button>
                </div>
            )}
        </div>
    );
}
