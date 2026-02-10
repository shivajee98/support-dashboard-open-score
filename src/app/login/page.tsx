'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck, Smartphone, Lock, Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [agentData, setAgentData] = useState<any>(null);

    // Auto-redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            router.replace('/');
        }
    }, [router]);

    const handleCheckMobile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';
            const res = await fetch(`${apiBase}/support/agent/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile_number: mobile })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    setAgentData(data);
                    setStep(2);
                } else {
                    toast.error('Access Denied. Not a support agent.');
                }
            } else {
                toast.error('Failed to verify mobile number');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';
            const res = await fetch(`${apiBase}/auth/support/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile_number: mobile,
                    password: password
                })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('support_user_mobile', mobile);
                localStorage.setItem('support_user_role', data.user.support_category?.name || 'Agent');
                localStorage.setItem('support_user_name', data.user.name);
                localStorage.setItem('support_user_category_id', data.user.support_category_id);

                toast.success('Welcome back!');
                router.push('/');
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch (error) {
            toast.error('Network error during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <h1 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">
                        Support Portal
                    </h1>
                    <p className="text-slate-500 text-center text-sm font-medium mb-8">
                        {step === 1 ? 'Enter your registered mobile number' : 'Verify your identity'}
                    </p>

                    {step === 1 ? (
                        <form onSubmit={handleCheckMobile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setMobile(val);
                                        }}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                                        placeholder="Enter number"
                                        required
                                        autoFocus
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={20} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Welcome Back</p>
                                <h3 className="text-xl font-black text-slate-900">{agentData.name}</h3>
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-blue-100 shadow-sm">
                                    <ShieldCheck size={14} className="text-blue-600" />
                                    <span className="text-sm font-bold text-blue-700">{agentData.category_name}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        type={passwordVisible ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                        placeholder="Enter password"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Dashboard'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600"
                            >
                                Use different number
                            </button>
                        </form>
                    )}
                </div>
            </div>
            <Toaster />
        </div>
    );
}
