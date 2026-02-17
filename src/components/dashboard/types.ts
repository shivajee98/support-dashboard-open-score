export interface User {
    id: number;
    name: string;
    email: string;
    mobile_number: string;
    role: string;
    support_category_id?: number;
}

export interface Message {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    attachment_url?: string;
    is_admin_reply: boolean;
    created_at: string;
}

export interface Ticket {
    id: number;
    unique_ticket_id: string;
    user_id: number;
    subject: string;
    issue_type: string;
    status: 'open' | 'closed' | 'pending';
    priority: 'low' | 'medium' | 'high';
    assigned_to?: number;
    created_at: string;
    updated_at: string;
    user: User;
    messages?: Message[];
    payment_status?: string;
    payment_amount?: number;
    category?: {
        id: number;
        name: string;
        slug: string;
    };
    sub_action?: string;
    target_id?: number;
}

export interface LoanRepayment {
    id: number;
    loan_id: number;
    amount: number;
    due_date: string;
    status: string;
    payment_mode?: string;
    proof_image?: string;
    transaction_id?: string;
    notes?: string;
    loan?: {
        user?: User;
        payout_frequency?: string;
    };
}

export interface Loan {
    id: number;
    user_id: number;
    amount: number;
    status: string;
    created_at: string;
    plan?: {
        name: string;
    };
    calculations?: any;
    form_data?: any;
    user?: User;
}
