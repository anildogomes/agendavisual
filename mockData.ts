
import { Session } from '@supabase/supabase-js';

export const MOCK_USER_ID = 'demo-user-123';
export const MOCK_ADMIN_ID = 'demo-admin-456';

export const mockSession: Session = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: MOCK_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@agendios.com.br',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmation_sent_at: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'Usuário Demo' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const mockAdminSession: Session = {
  ...mockSession,
  user: {
    ...mockSession.user,
    id: MOCK_ADMIN_ID,
    email: 'ocodador@gmail.com',
    user_metadata: { full_name: 'Admin Demo' },
  },
};

export const mockBusiness = {
  id: MOCK_USER_ID,
  name: 'Barbearia do Demo',
  full_name: 'Usuário Demo',
  whatsapp_phone: '11999999999',
  address: 'Rua das Flores, 123 - São Paulo',
  instagram_url: 'barbearia_demo',
  facebook_url: '',
  slug: 'barbearia-demo',
  subscription_status: 'active',
  is_exempt: true,
  created_at: new Date().toISOString(),
  work_hours: {
    monday: [{ start: '09:00', end: '18:00' }],
    tuesday: [{ start: '09:00', end: '18:00' }],
    wednesday: [{ start: '09:00', end: '18:00' }],
    thursday: [{ start: '09:00', end: '18:00' }],
    friday: [{ start: '09:00', end: '18:00' }],
    saturday: [{ start: '09:00', end: '14:00' }],
    sunday: [],
  }
};

export const mockClients = [
  { id: 'c1', business_id: MOCK_USER_ID, name: 'João Silva', phone: '11988887777', status: 'active', notes: 'Prefere corte com tesoura', created_at: new Date().toISOString() },
  { id: 'c2', business_id: MOCK_USER_ID, name: 'Maria Oliveira', phone: '11977776666', status: 'active', notes: 'Sempre pontual', created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c3', business_id: MOCK_USER_ID, name: 'Pedro Souza', phone: '11966665555', status: 'inactive', notes: 'Cliente antigo', created_at: new Date().toISOString() },
  { id: 'c4', business_id: MOCK_USER_ID, name: 'Ana Costa', phone: '11955554444', status: 'inactive', notes: '', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
];

export const mockServices = [
  { id: 's1', business_id: MOCK_USER_ID, name: 'Corte de Cabelo', price: 50, duration: 30, description: 'Corte social ou degradê' },
  { id: 's2', business_id: MOCK_USER_ID, name: 'Barba', price: 30, duration: 20, description: 'Barba completa com toalha quente' },
];

export const mockProfessionals = [
  { 
    id: 'p1', 
    business_id: MOCK_USER_ID,
    name: 'Carlos Barbeiro', 
    specialty: 'Cortes Modernos', 
    avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150',
    whatsapp_phone: '11999999999',
    service_ids: ['s1', 's2'],
    work_hours: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [{ start: '09:00', end: '14:00' }],
        sunday: [],
    }
  },
  { 
    id: 'p2', 
    business_id: MOCK_USER_ID,
    name: 'Ricardo Barber', 
    specialty: 'Barba e Bigode', 
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
    whatsapp_phone: '11999999999',
    service_ids: ['s1', 's2'],
    work_hours: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [{ start: '09:00', end: '14:00' }],
        sunday: [],
    }
  },
];

export const mockAppointments = [
  { 
    id: 'a1', 
    client_name: 'João Silva', 
    client_phone: '11988887777', 
    service_id: 's1', 
    professional_id: 'p1', 
    date: new Date().toISOString().split('T')[0], 
    time: '10:00',
    status: 'reserved'
  },
  { 
    id: 'a2', 
    client_name: 'Maria Oliveira', 
    client_phone: '11977776666', 
    service_id: 's2', 
    professional_id: 'p2', 
    date: new Date().toISOString().split('T')[0], 
    time: '11:00',
    status: 'reserved'
  },
];

export const mockSubscribedClients = [
  {
    id: 'demo-client-1',
    businessName: 'Barbearia do João',
    ownerName: 'João Silva',
    email: 'joao@barbearia.com',
    phone: '11988887777',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    joinDate: '2023-10-01',
    plan: 'Standard',
    monthlyRevenue: 14.99,
    isExempt: false,
  },
  {
    id: 'demo-client-2',
    businessName: 'Salão da Maria',
    ownerName: 'Maria Oliveira',
    email: 'maria@salao.com',
    phone: '11977776666',
    city: 'Rio de Janeiro',
    state: 'RJ',
    status: 'active',
    joinDate: '2023-10-05',
    plan: 'Standard',
    monthlyRevenue: 0,
    isExempt: true,
  },
];
