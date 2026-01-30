import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

window.Pusher = Pusher;

// Hardcoding for now/demo purposes if env vars are tricky in separate app without restart
// Ideally use env vars. Backend runs on 8080 for WS by default.
export const createEcho = () => {
    return new Echo({
        broadcaster: 'reverb',
        key: 'openscore_app_key', // Default Reverb key
        wsHost: '127.0.0.1',       // Or window.location.hostname
        wsPort: 8081,
        wssPort: 8081,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: 'http://127.0.0.1:8001/api/broadcasting/auth', // Important: Point to backend auth
        auth: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('agent_token')}`,
                Accept: 'application/json',
            },
        },
    });
};
