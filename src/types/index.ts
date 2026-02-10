export interface Ticket {
    id: number;
    subject: string;
    issue_type: string;
    status: string;
    priority: string;
    user: {
        name: string;
        mobile_number: string;
        id: number;
    };
    name: string;
    mobile_number: string;
    messages: any[];
    created_at: string;
    payment_status?: string;
    payment_amount?: string;
    unique_ticket_id?: string;
}
