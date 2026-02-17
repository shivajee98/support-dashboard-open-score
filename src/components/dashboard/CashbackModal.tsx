import { Loader2 } from 'lucide-react';

interface CashbackModalProps {
    amount: string;
    setAmount: (val: string) => void;
    reason: string;
    setReason: (val: string) => void;
    isProcessing: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function CashbackModal({
    amount,
    setAmount,
    reason,
    setReason,
    isProcessing,
    onConfirm,
    onClose
}: CashbackModalProps) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-black mb-6">Credit Award</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Benefit Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-black text-blue-600 text-lg placeholder:text-slate-400"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Internal Note</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-sm min-h-[100px] font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing || !amount}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/20 uppercase tracking-widest"
                    >
                        {isProcessing ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Approve Credit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
