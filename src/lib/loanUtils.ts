
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Types ---

export type TenureMonths = 1 | 3 | 6;

export type PayoutFrequency = 'Daily' | '5 Days' | '7 Days' | '10 Days' | '15 Days' | '20 Days' | '25 Days' | 'Monthly' | 'Quarterly' | 'Half Yearly';

export interface PayoutOption {
    id: string;
    label: string; // e.g. "Daily"
    frequency: PayoutFrequency;
    fixedAmount?: number;      // Fixed EMI amount. If not provided, calculated from interest.
    interestRate?: number;     // Interest Rate % (Flat for the tenure). 0 means 0% interest.
    cashback?: number;         // Cashback amount per EMI
    val?: string; // e.g. "Best Value", "Recommended"
    isBestValue?: boolean;
}

export interface LoanPlan {
    amount: number;
    title: string;
    description: string;
    isLocked?: boolean;
    tenures: TenureMonths[];
    payoutOptions: (tenure: TenureMonths) => PayoutOption[];
    color: string;
}

// --- Configuration ---

export const LOAN_PLANS: Record<number, LoanPlan> = {
    10000: {
        amount: 10000,
        title: "Virtual Credit",
        description: "Instant activation with nominal KYC",
        tenures: [1],
        color: "from-indigo-500 to-purple-600",
        payoutOptions: (tenure) => [
            { id: 'daily', label: 'Daily', frequency: 'Daily', interestRate: 0, cashback: 5, val: 'Big Cashback', isBestValue: true },
            { id: '7days', label: 'Every 7 Days', frequency: '7 Days', interestRate: 0, cashback: 10, val: 'Recommended' },
            { id: '10days', label: 'Every 10 Days', frequency: '10 Days', interestRate: 0, cashback: 15, val: 'Recommended' },
            { id: 'monthly', label: 'Monthly', frequency: 'Monthly', interestRate: 0, cashback: 20 },
        ]
    },
    20000: {
        amount: 20000,
        title: "Starter Boost",
        description: "Earn cashback on repayments",
        tenures: [1, 3],
        color: "from-orange-500 to-red-600",
        payoutOptions: (tenure) => [
            { id: 'daily', label: 'Daily', frequency: 'Daily', interestRate: 0, cashback: 25, val: 'Big Cashback', isBestValue: true },
            { id: '7days', label: 'Every 7 Days', frequency: '7 Days', interestRate: 0, cashback: 30, val: 'Recommended' },
            { id: '10days', label: 'Every 10 Days', frequency: '10 Days', interestRate: 0, cashback: 40, val: 'Recommended' },
            { id: 'monthly', label: 'Monthly', frequency: 'Monthly', interestRate: 0, cashback: 50, val: 'Cashback' },
        ]
    },
    30000: {
        amount: 30000,
        title: "Micro Start",
        description: "Interest Free with High Cashback",
        tenures: [1, 3],
        color: "from-emerald-500 to-teal-600",
        payoutOptions: (tenure) => [
            // 30K Loan. 3 Month. Interest Free 0%. Repayment 30k.
            { id: 'daily', label: 'Daily', frequency: 'Daily', interestRate: 0, cashback: 25, val: 'Big Cashback', isBestValue: true },
            { id: '7days', label: 'Every 7 Days', frequency: '7 Days', interestRate: 0, cashback: 30, val: 'Recommended' },
            { id: '10days', label: 'Every 10 Days', frequency: '10 Days', interestRate: 0, cashback: 40, val: 'Recommended' },
            { id: 'monthly', label: 'Monthly', frequency: 'Monthly', interestRate: 0, cashback: 50, val: 'Cashback' },
        ]
    },
    50000: {
        amount: 50000,
        title: "Growth Pro",
        description: "Flexible Interest & Cashback Options",
        tenures: [1, 3, 6],
        color: "from-blue-600 to-indigo-700",
        payoutOptions: (tenure) => {
            if (tenure === 1) {
                return [
                    { id: 'daily', label: 'Daily', frequency: 'Daily', interestRate: 0, cashback: 10, val: 'Big Cashback', isBestValue: true },
                    { id: 'monthly', label: 'Monthly', frequency: 'Monthly', interestRate: 0, cashback: 20 },
                ];
            }
            if (tenure === 3) {
                // 50K Loan - 3 Month
                return [
                    { id: 'daily', label: 'Daily', frequency: 'Daily', interestRate: 0, cashback: 10, val: 'Big Cashback', isBestValue: true },
                    { id: '7days', label: 'Every 7 Days', frequency: '7 Days', interestRate: 0, cashback: 20, val: 'Recommended' },
                    { id: '10days', label: 'Every 10 Days', frequency: '10 Days', interestRate: 2, cashback: 30, val: 'Recommended' },
                    { id: '15days', label: 'Every 15 Days', frequency: '15 Days', interestRate: 3, cashback: 40, val: 'Recommended' },
                    { id: '20days', label: 'Every 20 Days', frequency: '20 Days', interestRate: 4 },
                    { id: '25days', label: 'Every 25 Days', frequency: '25 Days', interestRate: 5 },
                    { id: 'monthly', label: 'Monthly', frequency: 'Monthly', interestRate: 6 },
                    { id: 'quarterly', label: 'Quarterly', frequency: 'Quarterly', interestRate: 10 },
                ];
            } else {
                // 50K Loan - 6 Month
                return [
                    { id: 'daily', label: 'Daily', frequency: 'Daily', interestRate: 0, cashback: 10, val: 'Big Cashback', isBestValue: true },
                    { id: '7days', label: 'Every 7 Days', frequency: '7 Days', interestRate: 0, cashback: 20, val: 'Recommended' },
                    { id: '10days', label: 'Every 10 Days', frequency: '10 Days', interestRate: 3, cashback: 30, val: 'Recommended' },
                    { id: '15days', label: 'Every 15 Days', frequency: '15 Days', interestRate: 4, cashback: 30, val: 'Recommended' },
                    { id: '20days', label: 'Every 20 Days', frequency: '20 Days', interestRate: 5 },
                    { id: '25days', label: 'Every 25 Days', frequency: '25 Days', interestRate: 7 },
                    { id: 'monthly', label: 'Monthly', frequency: 'Monthly', interestRate: 14 },
                    { id: 'halfyearly', label: 'Half Yearly', frequency: 'Half Yearly', interestRate: 16 },
                ];
            }
        }
    },
    100000: {
        amount: 100000,
        title: "Empire Builder",
        description: "Scale your operations to new heights",
        isLocked: true,
        tenures: [6],
        color: "from-purple-600 to-indigo-800",
        payoutOptions: () => []
    },
    200000: {
        amount: 200000,
        title: "Capital Expansion",
        description: "Massive funding for big milestones",
        isLocked: true,
        tenures: [6],
        color: "from-amber-600 to-orange-800",
        payoutOptions: () => []
    },
    500000: {
        amount: 500000,
        title: "Venture Power",
        description: "Ultimate plan for market domination",
        isLocked: true,
        tenures: [6],
        color: "from-rose-600 to-pink-800",
        payoutOptions: () => []
    }
};

// --- Utilities ---

export function calculateRepayment(amount: number, tenureMonths: number, option: PayoutOption): { total: number, breakdown: string, count: number, emi: number } {
    let count = 0;
    // Prefer exact tenure days from option if available, otherwise approximation
    const days = (option as any).tenureDays || (tenureMonths * 30);

    const freqUpper = option.frequency.toUpperCase();

    if (freqUpper === 'DAILY') count = days;
    else if (freqUpper === '5 DAYS') count = Math.floor(days / 5);
    else if (freqUpper === '7 DAYS' || freqUpper === 'WEEKLY') count = Math.floor(days / 7);
    else if (freqUpper === '10 DAYS') count = Math.floor(days / 10);
    else if (freqUpper === '15 DAYS') count = Math.floor(days / 15);
    else if (freqUpper === '20 DAYS') count = Math.floor(days / 20);
    else if (freqUpper === '25 DAYS') count = Math.floor(days / 25);
    else if (freqUpper === 'MONTHLY') {
        // If we have exact days, use days/30, else use months
        count = (option as any).tenureDays ? Math.floor(days / 30) : tenureMonths;
    }
    else if (freqUpper === 'QUARTERLY') count = Math.floor(tenureMonths / 3);
    else if (freqUpper === 'HALF YEARLY') count = Math.floor(tenureMonths / 6);
    else count = 1;

    if (count < 1) count = 1;

    if (option.fixedAmount) {
        // Legacy/Fixed mode
        const total = count * option.fixedAmount;
        return {
            total,
            breakdown: `₹${option.fixedAmount.toLocaleString()} x ${count}`,
            count,
            emi: option.fixedAmount
        };
    }

    if (option.interestRate !== undefined) {
        // Interest Rate Calculation
        // Total = Principal + (Principal * Rate / 100)
        const principal = amount;
        const totalInterest = (principal * option.interestRate) / 100;
        const total = principal + totalInterest;
        // Integer Distribution Strategy
        // Base EMI = Floor(Total / Count)
        // Remainder = Total % Count
        // The first 'Remainder' number of EMIs get +1.
        // For display purposes, we show the First EMI (which is the highest possible value).

        const baseEmi = Math.floor(total / count);
        const remainder = total % count;

        // If remainder > 0, the first EMI will be Base + 1
        const emi = baseEmi + (remainder > 0 ? 1 : 0);


        // Build Breakdown String
        let parts = [];

        // Interest Part
        if (option.interestRate === 0) {
            parts.push("0% Interest");
        } else {
            parts.push(`${option.interestRate}% Interest`);
        }

        const breakdownText = `${parts.join(" • ")} • ₹${emi.toLocaleString()} / EMI`;

        return {
            total,
            breakdown: breakdownText,
            count,
            emi
        };
    }

    return { total: 0, breakdown: '-', count: 0, emi: 0 };
}

// Deprecated: Alias for backward compatibility during refactor if needed
export const calculateEarnings = calculateRepayment;


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
