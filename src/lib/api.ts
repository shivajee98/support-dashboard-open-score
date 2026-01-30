export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

import { ApiError } from "@/types/auth";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // If running in browser and no token, maybe redirect?
    // But let's keep it simple.

    // Check for auth token in localStorage (simplest for this internal tool)
    // Or cookies. Let's use localStorage for the support dashboard for simplicity
    // unless the main app uses cookies. Main app uses cookies via server proxy.
    // Since this is a separate app, we can use direct API calls if CORS is allowed.
    // If CORS is an issue, we might need a proxy. Backend likely allows CORS from localhost:3000.
    // We will run this on port 3001 probably.

    // Let's assume we store token in localStorage for this Agent App.
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('agent_token') || '';
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('agent_token');
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        throw new Error('Unauthorized');
    }

    // Handle empty responses
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error || errorData.message || `API Error: ${res.status}`);
    }

    return data as T;
}
