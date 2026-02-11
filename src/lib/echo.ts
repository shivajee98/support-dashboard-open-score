import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Fix for Next.js SSR
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

export const createEcho = (token: string) => {
    return new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 80),
        wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
};
