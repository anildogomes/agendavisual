
-- Limpeza Completa (Drop de todas as tabelas em Cascata)
DROP TABLE IF EXISTS 
    appointments,
    clients,
    professional_services,
    professionals,
    services,
    schedule_blocks,
    businesses
CASCADE;

-- Businesses
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    whatsapp_phone TEXT,
    email TEXT,
    logo_url TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    work_hours JSONB DEFAULT '{}',
    subscription_status TEXT DEFAULT 'active',
    is_exempt BOOLEAN DEFAULT false,
    
    -- Notifications & Reminders
    notify_new_appointments BOOLEAN DEFAULT true,
    notify_cancellations BOOLEAN DEFAULT true,
    notify_daily_summary BOOLEAN DEFAULT false,
    whatsapp_confirmation BOOLEAN DEFAULT true,
    reminder_time INTEGER DEFAULT 60,
    reminder_message TEXT DEFAULT 'Olá {nome}, passando para lembrar do seu agendamento hoje às {horario}.',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage business"
ON public.businesses
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Professionals
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    whatsapp_phone TEXT,
    avatar_url TEXT,
    work_hours JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage professionals"
ON public.professionals
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage services"
ON public.services
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

-- Relacao profissional - servicos
CREATE TABLE IF NOT EXISTS public.professional_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage professional_services"
ON public.professional_services
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM professionals p
        WHERE p.id = professional_services.professional_id
        AND p.business_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM professionals p
        WHERE p.id = professional_services.professional_id
        AND p.business_id = auth.uid()
    )
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage clients"
ON public.clients
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id),
    service_id UUID REFERENCES public.services(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT CHECK (status IN ('reserved','confirmed','cancelled','completed')) DEFAULT 'reserved',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_schedule UNIQUE (professional_id, date, time)
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage appointments"
ON public.appointments
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

-- SCHEDULE BLOCKS (COM VALIDAÇÃO)
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT valid_time CHECK (start_time < end_time)
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage schedule blocks"
ON public.schedule_blocks
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

-- INDEXES (PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_professionals_business_id ON professionals(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_date ON schedule_blocks(date);
