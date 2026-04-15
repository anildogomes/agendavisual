export const ADMIN_EMAIL = 'ocodador@gmail.com';

export interface SubscribedClient {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    status: 'active' | 'inactive';
    joinDate: string;
    plan: string;
    monthlyRevenue: number;
    isExempt: boolean;
}
