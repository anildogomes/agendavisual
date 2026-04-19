
-- Script para criar a tabela de bloqueios de agenda
-- Execute este script no SQL Editor do seu projeto Supabase

CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL, -- Changed from UUID to allow mock/test IDs
    professional_id TEXT NOT NULL, 
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança

-- 1. Permitir que donos de negócios vejam seus próprios bloqueios
CREATE POLICY "Donos podem ver seus próprios bloqueios" 
ON public.schedule_blocks 
FOR SELECT 
USING ((auth.uid())::text = business_id);

-- 2. Permitir que donos de negócios criem bloqueios
CREATE POLICY "Donos podem criar bloqueios" 
ON public.schedule_blocks 
FOR INSERT 
WITH CHECK ((auth.uid())::text = business_id);

-- 3. Permitir que donos de negócios atualizem seus próprios bloqueios
CREATE POLICY "Donos podem atualizar seus próprios bloqueios" 
ON public.schedule_blocks 
FOR UPDATE 
USING ((auth.uid())::text = business_id);

-- 4. Permitir que donos de negócios excluam seus próprios bloqueios
CREATE POLICY "Donos podem excluir seus próprios bloqueios" 
ON public.schedule_blocks 
FOR DELETE 
USING ((auth.uid())::text = business_id);

-- 5. Permitir leitura pública para verificar disponibilidade (opcional, dependendo da sua regra de negócio)
-- Se você quiser que o front-end público veja os bloqueios para desabilitar horários:
CREATE POLICY "Permitir leitura pública de bloqueios" 
ON public.schedule_blocks 
FOR SELECT 
USING (true);

-- Script para a tabela de SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem ver seus próprios serviços" ON public.services FOR SELECT USING (true); -- Simplified for dev
CREATE POLICY "Donos podem gerenciar seus serviços" ON public.services FOR ALL USING (true); -- Simplified for dev

-- Script para a tabela de PROFISSIONAIS
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    whatsapp_phone TEXT,
    avatar_url TEXT,
    service_ids TEXT[] DEFAULT '{}',
    work_hours JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem gerenciar seus profissionais" ON public.professionals FOR ALL USING (true); -- Simplified for dev
CREATE POLICY "Leitura pública de profissionais" ON public.professionals FOR SELECT USING (true);

-- Script para a tabela de CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem gerenciar seus clientes" ON public.clients FOR ALL USING (true); -- Simplified for dev

-- Script para a tabela de AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL,
    client_id UUID NOT NULL,
    professional_id UUID,
    service_id UUID,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT DEFAULT 'reserved',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem gerenciar agendamentos" ON public.appointments FOR ALL USING (true); -- Simplified for dev
CREATE POLICY "Leitura pública de agendamentos" ON public.appointments FOR SELECT USING (true);

-- Script para a tabela de NEGÓCIOS (BUSINESSES)
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    whatsapp_phone TEXT,
    work_hours JSONB DEFAULT '{}',
    subscription_status TEXT DEFAULT 'active',
    is_exempt BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem gerenciar seu negócio" ON public.businesses FOR ALL USING (true); -- Simplified for dev
CREATE POLICY "Leitura pública de negócios" ON public.businesses FOR SELECT USING (true);
