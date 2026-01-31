import React, { useState } from 'react';
import { Search, Loader2, X, User } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: any) => void;
}

export default function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            // Fetch all users and filter client-side since API might not support search query param
            // Optimisation: ideally backend supports ?q=... but we stick to existing /admin/users based on admin-panel analysis
            const users: any[] = await apiFetch<any>('/admin/users');

            const filtered = users.filter(u =>
                (u.name || '').toLowerCase().includes(query.toLowerCase()) ||
                (u.mobile_number || '').includes(query)
            );

            setResults(filtered);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                    <h2 className="text-xl font-black text-slate-900">Search User</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Name or Mobile Number..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-2">
                    {results.length > 0 ? (
                        results.map(user => (
                            <button
                                key={user.id}
                                onClick={() => onSelectUser(user)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group text-left"
                            >
                                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 group-hover:text-blue-700">{user.name || 'Unknown'}</p>
                                    <p className="text-xs font-bold text-slate-400">{user.mobile_number}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        query && !loading && (
                            <div className="text-center py-10 text-slate-400">
                                <p>No users found matching "{query}"</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
