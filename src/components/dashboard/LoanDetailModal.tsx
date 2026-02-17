import { ExternalLink, X } from 'lucide-react';
import { Loan } from '@/components/dashboard/types';

interface LoanDetailModalProps {
    loan: any; // Using any for now as the specialized loan detail structure is complex
    onClose: () => void;
}

export default function LoanDetailModal({ loan: selectedLoanDetail, onClose }: LoanDetailModalProps) {
    if (!selectedLoanDetail) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Loan Details</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID #{selectedLoanDetail.loan?.id}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all">
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
                        onClick={onClose}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
