export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';

import { ApiError } from "@/types/auth";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || '';
    }

    const isFormData = options.body instanceof FormData;

    const headers: any = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
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
