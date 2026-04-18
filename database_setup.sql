
-- Script para criar a tabela de bloqueios de agenda
-- Execute este script no SQL Editor do seu projeto Supabase

CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    professional_id TEXT NOT NULL, -- Pode ser 'all' ou o UUID do profissional
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
USING (auth.uid() = business_id);

-- 2. Permitir que donos de negócios criem bloqueios
CREATE POLICY "Donos podem criar bloqueios" 
ON public.schedule_blocks 
FOR INSERT 
WITH CHECK (auth.uid() = business_id);

-- 3. Permitir que donos de negócios atualizem seus próprios bloqueios
CREATE POLICY "Donos podem atualizar seus próprios bloqueios" 
ON public.schedule_blocks 
FOR UPDATE 
USING (auth.uid() = business_id);

-- 4. Permitir que donos de negócios excluam seus próprios bloqueios
CREATE POLICY "Donos podem excluir seus próprios bloqueios" 
ON public.schedule_blocks 
FOR DELETE 
USING (auth.uid() = business_id);

-- 5. Permitir leitura pública para verificar disponibilidade (opcional, dependendo da sua regra de negócio)
-- Se você quiser que o front-end público veja os bloqueios para desabilitar horários:
CREATE POLICY "Permitir leitura pública de bloqueios" 
ON public.schedule_blocks 
FOR SELECT 
USING (true);

-- Script para a tabela de SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem ver seus próprios serviços" ON public.services FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Donos podem criar seus próprios serviços" ON public.services FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "Donos podem atualizar seus próprios serviços" ON public.services FOR UPDATE USING (auth.uid() = business_id);
CREATE POLICY "Donos podem excluir seus próprios serviços" ON public.services FOR DELETE USING (auth.uid() = business_id);
CREATE POLICY "Leitura pública de serviços" ON public.services FOR SELECT USING (true);

-- Script para a tabela de PROFISSIONAIS
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    whatsapp_phone TEXT,
    avatar_url TEXT,
    service_ids TEXT[] DEFAULT '{}',
    work_hours JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem ver seus profissionais" ON public.professionals FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Donos podem criar profissionais" ON public.professionals FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "Donos podem atualizar profissionais" ON public.professionals FOR UPDATE USING (auth.uid() = business_id);
CREATE POLICY "Donos podem excluir profissionais" ON public.professionals FOR DELETE USING (auth.uid() = business_id);
CREATE POLICY "Leitura pública de profissionais" ON public.professionals FOR SELECT USING (true);

-- Script para a tabela de CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem ver seus clientes" ON public.clients FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Donos podem criar clientes" ON public.clients FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "Donos podem atualizar clientes" ON public.clients FOR UPDATE USING (auth.uid() = business_id);
CREATE POLICY "Donos podem excluir clientes" ON public.clients FOR DELETE USING (auth.uid() = business_id);

-- Script para a tabela de AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT DEFAULT 'reserved',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem ver seus agendamentos" ON public.appointments FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Donos podem criar agendamentos" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "Donos podem atualizar agendamentos" ON public.appointments FOR UPDATE USING (auth.uid() = business_id);
CREATE POLICY "Donos podem excluir agendamentos" ON public.appointments FOR DELETE USING (auth.uid() = business_id);
CREATE POLICY "Leitura pública de agendamentos" ON public.appointments FOR SELECT USING (true);

-- Script para a tabela de NEGÓCIOS (BUSINESSES)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Donos podem ver seu negócio" ON public.businesses FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Donos podem atualizar seu negócio" ON public.businesses FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Leitura pública de negócios" ON public.businesses FOR SELECT USING (true);
