export interface BusinessInfo {
  id: string;
  slug: string;
  business_name: string;
  full_name: string;
  created_at: string;
  subscription_status: string;
  is_exempt: boolean;
  address?: string;
  description?: string;
  whatsapp_phone?: string;
  logo_url?: string;
  banner_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  work_hours: any;
  min_advance_hours?: number;
  view_window_days?: number;
  manual_approval?: boolean;
  online_cancellation?: boolean;
  notify_new_appointments?: boolean;
  notify_cancellations?: boolean;
  notify_daily_summary?: boolean;
  whatsapp_confirmation?: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  business_id: string;
}

export interface Professional {
  id: string;
  name: string;
  avatar_url?: string;
  service_ids: string[];
  work_hours: any;
  business_id: string;
  whatsapp_phone?: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'declined';
  cancellation_reason?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  business_id: string;
  status: 'active' | 'inactive';
}

export interface ScheduleBlock {
  id: string;
  business_id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}
