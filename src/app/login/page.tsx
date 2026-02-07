"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthResponse } from '@/types/auth';

// Validation Schemas
const mobileSchema = z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits");
const otpSchema = z.string().length(6, "OTP must be 6 digits");

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const requestOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Mobile
        const result = mobileSchema.safeParse(mobile);
        if (!result.success) {
            toast.error(result.error.issues[0]?.message || "Invalid mobile number");
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/auth/otp', {
                method: 'POST',
                body: JSON.stringify({ mobile_number: mobile })
            });
            toast.success('OTP sent successfully');
            setStep(2);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate OTP
        const result = otpSchema.safeParse(otp);
        if (!result.success) {
            toast.error(result.error.issues[0]?.message || "Invalid OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch<AuthResponse>('/auth/verify', {
                method: 'POST',
                // Send SUPPORT role as requested. 
                // Note: This means strictly users with 'SUPPORT' role can login unless backend logic changes to be inclusive.
                body: JSON.stringify({ mobile_number: mobile, otp, role: 'SUPPORT' })
            });

            if (res.access_token) {
                if (!['ADMIN', 'SUPPORT'].includes(res.user.role)) {
                    toast.error('Access Denied. Support Agents Only.');
                    return;
                }
                localStorage.setItem('agent_token', res.access_token);
                localStorage.setItem('agent_user', JSON.stringify(res.user));
                toast.success('Welcome back!');
                router.push('/');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-100 transition-all">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-slate-900/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Portal</h1>
                    <p className="text-slate-500 font-bold text-sm">Authorized Access Only</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={requestOtp} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setMobile(val);
                                }}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-lg tracking-wide"
                                placeholder="90000 00000"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || mobile.length !== 10}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOtp} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 text-center tracking-[0.5em] text-2xl"
                                placeholder="••••••"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setStep(1); setOtp(''); }}
                            disabled={loading}
                            className="w-full py-2 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
