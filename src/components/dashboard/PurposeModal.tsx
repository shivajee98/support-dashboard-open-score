import { X, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface PurposeModalProps {
    onSelect: (purpose: string) => void;
    onClose: () => void;
    attachmentName?: string;
}

const PURPOSES = [
    { id: 'emi', label: 'EMI Proof', icon: '💰' },
    { id: 'wallet', label: 'Wallet Recharge', icon: '💳' },
    { id: 'fee', label: 'Platform Fee & Charges', icon: '🧾' },
    { id: 'other', label: 'Other / General', icon: '📂' },
];

export default function PurposeModal({ onSelect, onClose, attachmentName }: PurposeModalProps) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Purpose of Image</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Select Category</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {attachmentName && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <ImageIcon size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 truncate">{attachmentName}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {PURPOSES.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group shadow-sm hover:shadow-md active:scale-95"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{p.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-700 text-center">{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
