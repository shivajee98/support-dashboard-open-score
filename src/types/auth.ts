export interface User {
    id: number;
    name: string;
    email: string;
    mobile_number: string;
    role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN'; // Strict role typing
    status: 'ACTIVE' | 'SUSPENDED';
    is_onboarded: boolean;
    business_name?: string;
    profile_image?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
    onboarding_status: string;
}

export interface ApiError {
    message?: string;
    error?: string;
}
