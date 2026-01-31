import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface KYCPreviewModalProps {
    loan: any;
    onClose: () => void;
}

export default function KYCPreviewModal({ loan, onClose }: KYCPreviewModalProps) {
    if (!loan) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col relative animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">KYC Form Details</h2>
                        <p className="text-sm text-slate-500">Submitted on {new Date(loan.updated_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 space-y-8 overflow-y-auto">
                    {loan.form_data ? (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {Object.entries(loan.form_data).map(([key, value]: [string, any]) => {
                                const isImageObject = value && typeof value === 'object' && value.url;
                                return (
                                    <div key={key} className={isImageObject ? "col-span-2 sm:col-span-1" : ""}>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                                        {isImageObject ? (
                                            <div className="space-y-2">
                                                <a href={value.url} target="_blank" rel="noopener noreferrer" className="block relative group aspect-video overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                                                    <img src={value.url} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                                        <ChevronRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </a>
                                                {value.geo && (
                                                    <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        <span>Lat: {value.geo.lat?.toFixed(6)}</span>
                                                        <span>Lng: {value.geo.lng?.toFixed(6)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm font-bold text-slate-900 break-words">{String(value)}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">No form data submitted.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
