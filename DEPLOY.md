# Guia de Implantação (Render & Supabase)

Este documento fornece as instruções necessárias para conectar o projeto ao Supabase e implantá-lo no Render.

## 1. Configuração do Supabase

### Banco de Dados (SQL)
Execute o seguinte script no Editor SQL do seu projeto Supabase para criar as tabelas e configurar a criação automática de perfis:

```sql
-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Empresas/Negócios
CREATE TABLE businesses (
  id UUID PRIMARY KEY, -- Usamos o ID do usuário do Auth
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  whatsapp_phone TEXT,
  banner_url TEXT,
  logo_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  address TEXT,
  cep TEXT,
  city TEXT,
  neighborhood TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  state TEXT,
  work_hours JSONB,
  subscription_status TEXT DEFAULT 'trialing',
  is_exempt BOOLEAN DEFAULT false,
  min_advance_hours INTEGER DEFAULT 1,
  view_window_days INTEGER DEFAULT 30,
  manual_approval BOOLEAN DEFAULT false,
  online_cancellation BOOLEAN DEFAULT true,
  notify_new_appointments BOOLEAN DEFAULT true,
  notify_cancellations BOOLEAN DEFAULT true,
  notify_daily_summary BOOLEAN DEFAULT false,
  whatsapp_confirmation BOOLEAN DEFAULT false,
  reminder_time INTEGER DEFAULT 60,
  reminder_message TEXT DEFAULT 'Olá {nome}, confirmamos seu agendamento para {data} às {horario}.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Tabela de Serviços
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Profissionais
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  whatsapp_phone TEXT,
  service_ids UUID[] DEFAULT '{}',
  work_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'reserved', -- 'reserved', 'completed', 'no_show', 'cancelled'
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Bloqueios de Agenda
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime para agendamentos
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- FUNÇÃO E TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL (Necessário para Google Login)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.businesses (id, user_id, business_name, full_name, slug, work_hours)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'business_name', 'Meu Negócio'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'slug', 'negocio-' || lower(substring(replace(new.id::text, '-', ''), 1, 8))),
    '{"sunday": null, "monday": [{"end": "18:00", "start": "09:00"}], "tuesday": [{"end": "19:00", "start": "09:00"}, {"end": "19:00", "start": "13:00"}], "wednesday": [{"end": "19:00", "start": "09:00"}, {"end": "19:00", "start": "13:00"}], "thursday": [{"end": "20:00", "start": "09:00"}, {"end": "20:00", "start": "13:00"}], "friday": [{"end": "20:00", "start": "09:00"}, {"end": "20:00", "start": "13:00"}], "saturday": [{"end": "16:00", "start": "08:00"}]}'::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Configuração do Google Login
1.  Vá ao **Supabase Dashboard > Authentication > Providers > Google**.
2.  Ative o provider.
3.  Insira o **Client ID** e **Client Secret** (obtidos no Google Cloud Console).
4.  Adicione a **Redirect URL** do Supabase no Google Cloud Console.
5.  No código, o botão "Continuar com Google" já está configurado para redirecionar corretamente.

### Variáveis de Ambiente
Você precisará da **URL do Projeto** e da **Anon Key** (encontradas em Settings > API).

## 2. Implantação no Render

1.  **Crie um novo Web Service** no Render.
2.  **Conecte seu repositório** do GitHub/GitLab.
3.  **Configurações de Build:**
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install && npm run build`
    *   **Publish Directory:** `dist`
4.  **Variáveis de Ambiente (Environment):**
    Adicione as seguintes variáveis:
    *   `VITE_SUPABASE_URL`: (Sua URL do Supabase)
    *   `VITE_SUPABASE_ANON_KEY`: (Sua Anon Key do Supabase)
    *   `GEMINI_API_KEY`: (Chave da API do Gemini - Opcional)
5.  **Deploy:** O Render fará o build e servirá os arquivos estáticos automaticamente.

## 3. Criação de Perfis Especiais (Admin e Teste)

Para garantir que certos usuários tenham acesso total sem cobranças e que você possa gerenciar o sistema, siga estes procedimentos:

### Perfil de Administrador (Dono do Sistema)
O administrador tem acesso ao painel de gestão de todos os estabelecimentos.
1.  **Identifique o E-mail:** No arquivo `App.tsx`, localize a constante `ADMIN_EMAIL`. Por padrão, ela está configurada como `ocodador@gmail.com`.
2.  **Acesso:** Qualquer usuário que fizer login com este e-mail será tratado como Administrador Global.
3.  **Segurança:** Este e-mail é verificado apenas no código (`App.tsx`). Para maior segurança, você pode alterar este e-mail no código antes do deploy.

### Perfil de Usuário Teste (Isento de Cobrança)
Para criar um usuário que não precise pagar assinatura:
1.  **Crie a conta normalmente:** O usuário deve se cadastrar pelo fluxo padrão.
2.  **Liberação via Admin:** 
    *   Acesse o sistema com seu perfil de **Administrador**.
    *   Vá para a aba **"Gestão de Clientes"**.
    *   Localize o usuário teste na lista.
    *   Clique no ícone de **Escudo (Tornar VIP)**.
3.  **Resultado:** O campo `is_exempt` será marcado como `true` no banco de dados. O sistema de bloqueio do Dashboard ignora usuários isentos, permitindo acesso vitalício.

## 4. Integração Automática com Stripe (Webhooks)

Para que o acesso seja liberado automaticamente após o pagamento, siga estes passos para configurar a **Supabase Edge Function**:

### Passo 1: Preparação no Supabase
1.  Instale o **Supabase CLI** na sua máquina local.
2.  Faça login: `supabase login`.
3.  Inicie o projeto (se ainda não o fez): `supabase init`.
4.  Vincule ao seu projeto remoto: `supabase link --project-ref seu-id-do-projeto`.

### Passo 2: Configuração da Função
O código da função já foi criado em `supabase/functions/stripe-webhook/index.ts`.
1.  **Segredos (Secrets):** No painel do Supabase (Settings > API) ou via CLI, configure as chaves secretas:
    ```bash
    supabase secrets set STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
    supabase secrets set STRIPE_WEBHOOK_SECRET=seu_segredo_de_webhook_do_stripe
    ```
2.  **Deploy:** Execute o comando:
    ```bash
    supabase functions deploy stripe-webhook
    ```

### Passo 3: Configuração no Stripe
1.  Vá ao **Stripe Dashboard > Developers > Webhooks**.
2.  Adicione um novo endpoint. A URL será: `https://seu-id-do-projeto.supabase.co/functions/v1/stripe-webhook`.
3.  Selecione o evento: `checkout.session.completed`.
4.  Copie o "Signing Secret" e coloque na variável `STRIPE_WEBHOOK_SECRET` no Supabase (conforme o Passo 2).

### Passo 4: Link de Pagamento Dinâmico
Para que o sistema saiba qual cliente pagou, você deve incluir o ID do negócio no link de pagamento. 
No seu link do Stripe, adicione o parâmetro de referência:
`https://buy.stripe.com/seu-link?client_reference_id=ID_DO_NEGOCIO`

*Nota: No código do Dashboard, o sistema já está preparado para lidar com essa lógica assim que você configurar o novo link.*
