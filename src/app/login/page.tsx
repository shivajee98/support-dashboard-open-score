"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Loader2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const requestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Using the same backend AuthController
            await apiFetch('/auth/otp', {
                method: 'POST',
                body: JSON.stringify({ identifier: mobile, type: 'mobile' }) // assuming backend accepts identifier
            });
            setStep(2);
        } catch (error) {
            console.error(error);
            alert('Failed to send OTP. Ensure you are an Admin/Support.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await apiFetch('/auth/verify', {
                method: 'POST',
                body: JSON.stringify({ identifier: mobile, otp })
            });

            if (res.token) {
                // Check role
                if (res.user.role !== 'ADMIN') {
                    alert('Access Denied. Support Agents Only.');
                    return;
                }
                localStorage.setItem('agent_token', res.token);
                localStorage.setItem('agent_user', JSON.stringify(res.user));
                router.push('/');
            }
        } catch (error) {
            console.error(error);
            alert('Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-600/30">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Portal</h1>
                    <p className="text-slate-500 font-bold text-sm">Authorized Access Only</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={requestOtp} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile / Email</label>
                            <input
                                type="text"
                                value={mobile}
                                onChange={e => setMobile(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="Enter your identifier"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOtp} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 text-center tracking-[0.5em] text-2xl"
                                placeholder="••••"
                                maxLength={6}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full py-2 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600"
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
