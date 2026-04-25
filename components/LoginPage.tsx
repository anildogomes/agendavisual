
import React, { useState } from 'react';
import { Scissors, Loader2 } from '../constants';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useToast, useTheme } from '../App';
import { AlertTriangle, Info } from 'lucide-react';

const translateAuthError = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('new password should be different from the old password')) {
        return 'A nova senha deve ser diferente da senha anterior.';
    }
    if (msg.includes('invalid login credentials')) {
        return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('user already registered')) {
        return 'Este e-mail já está cadastrado.';
    }
    if (msg.includes('password should be at least')) {
        return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (msg.includes('invalid email')) {
        return 'Formato de e-mail inválido.';
    }
    if (msg.includes('rate limit exceeded') || msg.includes('too many requests')) {
        return 'Muitas tentativas. Por favor, aguarde alguns instantes.';
    }
    if (msg.includes('anonymous users cannot be updated')) {
        return 'Erro de sessão. Por favor, faça login novamente.';
    }
    if (msg.includes('token has expired') || msg.includes('is invalid') || msg.includes('verification link')) {
        return 'O link de recuperação expirou ou é inválido. Solicite um novo.';
    }
    if (msg.includes('same password')) {
        return 'A nova senha não pode ser igual à anterior.';
    }
    return message;
};

export const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();
    const { theme } = useTheme();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(translateAuthError(error.message));
            addToast('Erro ao atualizar senha.', 'error');
        } else {
            addToast('Senha atualizada com sucesso!', 'success');
            // Redirect to dashboard after success
            window.location.hash = '#inicio';
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-sm p-6 sm:p-8 space-y-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg relative z-10">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gold-500 text-slate-900 p-3 rounded-xl mb-4 shadow-lg shadow-gold-500/20">
                        <Scissors className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold transition-colors duration-300 text-slate-950 dark:text-slate-100">
                        Nova Senha
                    </h2>
                    <p className="mt-1 text-sm font-bold transition-colors duration-300 text-slate-800 dark:text-slate-400">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleUpdatePassword}>
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Nova Senha</label>
                        <input
                            id="new-password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-new-password" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Confirmar Nova Senha</label>
                        <input
                            id="confirm-new-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400"
                            placeholder="Repita a senha"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800 transition-colors shadow-lg shadow-primary-500/30"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                Atualizando...
                            </>
                        ) : (
                            'Redefinir Senha'
                        )}
                    </button>
                </form>
            </div>
             <footer className="absolute bottom-4 text-center w-full text-xs text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} AG Sistemas. Todos os direitos reservados.
            </footer>
        </div>
    );
};

const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const { addToast } = useToast();
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Signup State
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupEmailError, setSignupEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  // Forgot Password State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryEmailError, setRecoveryEmailError] = useState('');

  // Shared State
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  
  const validateEmail = (value: string, errorSetter: React.Dispatch<React.SetStateAction<string>>): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    errorSetter('');
    if (!value.trim()) {
      errorSetter('O campo de e-mail é obrigatório.');
      return false;
    }
    if (!emailRegex.test(value)) {
      errorSetter('Por favor, insira um formato de e-mail válido.');
      return false;
    }
    return true;
  };

  const getRedirectUrl = () => {
      // Retorna a URL atual (origem) para garantir que o redirecionamento 
      // volte para onde o usuário iniciou o login (seja Hostinger ou AI Studio).
      return window.location.origin;
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    if (error) {
      setError(translateAuthError(error.message));
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email, setEmailError)) return;
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError(translateAuthError(error.message) || 'E-mail ou senha inválidos.');
    }
    // No subscription check here. Access control is handled in Dashboard.tsx
    
    setIsLoading(false);
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setPasswordError('');
    setSignupSuccess(false);
    
    let isValid = true;
    if (!businessName.trim() || !fullName.trim() || !city.trim() || !state.trim() || !signupPassword || !confirmPassword) {
        setSignupError('Todos os campos são obrigatórios.');
        isValid = false;
    }
    if (!validateEmail(signupEmail, setSignupEmailError)) {
        isValid = false;
    }
    if (signupPassword.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres.');
        isValid = false;
    } else if (signupPassword !== confirmPassword) {
        setPasswordError('As senhas não coincidem.');
        isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    const defaultWorkingHours = {
        sunday: null,
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }],
        wednesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }],
        thursday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '20:00' }],
        friday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '20:00' }],
        saturday: [{ start: '08:00', end: '16:00' }],
    };

    const generateSlug = (name: string) => {
        const baseSlug = name.toLowerCase().trim().replace(/&/g, '-e-').replace(/[áàâãäå]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôõö]/g, 'u').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        return `${baseSlug}-${Math.random().toString(36).substring(2, 9)}`;
    };
    const slug = generateSlug(businessName);

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: {
            name: businessName,
            full_name: fullName,
            city: city,
            state: state,
            slug: slug,
            work_hours: defaultWorkingHours,
            logo_url: 'https://images.unsplash.com/photo-1599351432903-8515c1b69437?auto=format&fit=crop&w=200&h=200&q=80',
            subscription_status: 'trialing' // Default to trialing
        }
      }
    });

    if (error) {
      setSignupError(translateAuthError(error.message));
    } else if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
             setSignupError('Esta conta já existe. Tente fazer login.');
        } else {
             setSignupSuccess(true);
        }
    }

    setIsLoading(false);
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryEmailError('');

    if (!validateEmail(recoveryEmail, setRecoveryEmailError)) {
        return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: getRedirectUrl(),
    });

    if (error) {
        setRecoveryMessage('Erro ao enviar e-mail. Tente novamente.');
    } else {
        setRecoveryMessage('Se um e-mail correspondente for encontrado em nosso sistema, um link de recuperação será enviado.');
    }

    setIsLoading(false);
  };

  const handleSwitchTab = (tab: 'login' | 'signup') => {
      setActiveTab(tab);
      setError(''); setEmailError('');
      setSignupError(''); setSignupEmailError(''); setPasswordError(''); setSignupSuccess(false);
      setRecoveryMessage(''); setRecoveryEmail(''); setRecoveryEmailError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
      {/* Background Image with Opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2074" 
          alt="Beauty Salon Background" 
          className={`w-full h-full object-cover transition-opacity duration-700 opacity-40 grayscale ${theme === 'dark' ? 'invert' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-br from-slate-100/95 via-white/80 to-slate-100/95' : 'bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/90'}`}></div>
      </div>

      <div className="w-full max-w-sm p-6 sm:p-8 space-y-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="bg-gold-500 text-slate-950 p-3 rounded-xl mb-4 shadow-lg shadow-gold-500/20">
            <Scissors className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold transition-colors duration-300">
            <span className="text-slate-950 dark:text-slate-100">Agendios</span>
          </h2>
          <p className="mt-1 text-sm font-bold transition-colors duration-300 text-slate-800 dark:text-slate-400">
            Atendimento inteligente para barbearias e studios de beleza
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Configuração Necessária</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-relaxed">
              O banco de dados não foi configurado. Para usar login real e salvar dados, você precisa configurar as chaves do <strong>Supabase</strong> no menu de configurações do AI Studio.
            </p>
            <div className="pt-1">
                <button 
                    onClick={() => window.location.hash = '#demo'}
                    className="text-[10px] font-bold text-amber-900 dark:text-amber-300 underline underline-offset-2"
                >
                    Usar Modo Demo por enquanto
                </button>
            </div>
          </div>
        )}

        {activeTab !== 'forgotPassword' && (
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1 flex space-x-1">
            <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className={`w-full py-2 text-sm font-bold rounded-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                activeTab === 'login'
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-gold-700 dark:text-gold-400'
                    : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
            >
                Entrar
            </button>
            <button
                type="button"
                onClick={() => handleSwitchTab('signup')}
                className={`w-full py-2 text-sm font-bold rounded-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                activeTab === 'signup'
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-gold-700 dark:text-gold-400'
                    : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
            >
                Começar Grátis
            </button>
            </div>
        )}
        
        {activeTab === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-bold text-slate-900 dark:text-slate-200">
                  Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`mt-1 appearance-none block w-full px-3 py-2.5 border placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400 ${emailError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={() => validateEmail(email, setEmailError)}
                />
                 {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="password-sr" className="block text-sm font-bold text-slate-900 dark:text-slate-200">
                        Senha
                    </label>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('forgotPassword'); }} className="text-xs font-bold text-gold-700 hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300">
                        Esqueceu a senha?
                    </a>
                </div>
                <input
                  id="password-sr"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || !isSupabaseConfigured}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800 transition-colors shadow-lg shadow-primary-500/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || !isSupabaseConfigured}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div>
                <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-white dark:bg-slate-800 px-2 text-slate-600 dark:text-slate-400">Ou use o Modo Demo</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.location.hash = '#demo'}
                  className="py-2 px-2 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Demo Negocio
                </button>
                <button
                  type="button"
                  onClick={() => window.location.hash = '#demo-booking'}
                  className="py-2 px-2 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Demo Agendamento
                </button>
              </div>
            </div>
          </form>
        ) : activeTab === 'signup' ? (
             <form className="space-y-4" onSubmit={handleSignup}>
                {signupSuccess ? (
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">Cadastro Realizado!</h3>
                        <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                            Enviamos um link de confirmação para <strong>{signupEmail}</strong>.
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                            Por favor, verifique sua caixa de entrada (e spam) e clique no link para ativar sua conta e acessar o sistema.
                        </p>
                        <button type="button" onClick={() => handleSwitchTab('login')} className="mt-4 text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 underline">
                            Ir para Login
                        </button>
                    </div>
                ) : (
                <>
                    <div className="space-y-4">
                    <div>
                        <label htmlFor="business-name" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Nome do seu negócio</label>
                        <input id="business-name" name="business-name" type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" placeholder="Ex: Barbearia Vanguarda"/>
                    </div>
                    <div>
                        <label htmlFor="full-name" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Seu nome completo</label>
                        <input id="full-name" name="full-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" placeholder="Ex: João da Silva"/>
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Cidade</label>
                        <input id="city" name="city" type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" placeholder="Ex: São Paulo" />
                    </div>
                    <div>
                            <label htmlFor="state" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Estado (UF)</label>
                            <input id="state" name="state" type="text" required value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" placeholder="Ex: SP"/>
                    </div>
                    <div>
                        <label htmlFor="signup-email-address" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Email</label>
                        <input id="signup-email-address" name="email" type="email" autoComplete="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} onBlur={() => validateEmail(signupEmail, setSignupEmailError)} className={`mt-1 appearance-none block w-full px-3 py-2.5 border placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400 ${signupEmailError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} placeholder="seu@email.com" />
                        {signupEmailError && <p className="text-red-500 text-xs mt-1">{signupEmailError}</p>}
                    </div>
                    <div>
                        <label htmlFor="signup-password" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Senha</label>
                        <input id="signup-password" name="password" type="password" required value={signupPassword} onChange={(e) => { setSignupPassword(e.target.value); if (passwordError) setPasswordError(''); }} className="mt-1 appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" placeholder="Mínimo 6 caracteres"/>
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Confirmar senha</label>
                        <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(''); }} className={`mt-1 appearance-none block w-full px-3 py-2.5 border placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400 ${passwordError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} placeholder="••••••••" />
                        {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                    </div>
                    </div>
                    {signupError && <p className="text-red-500 text-sm text-center">{signupError}</p>}
                    <div>
                    <button type="submit" disabled={isLoading || !isSupabaseConfigured} className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800 transition-colors shadow-lg shadow-primary-500/30">
                        {isLoading ? (
                            <>
                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            Criando conta...
                            </>
                        ) : (
                        'Começar Grátis'
                        )}
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div>
                        <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-white dark:bg-slate-800 px-2 text-slate-600 dark:text-slate-400">Ou use sua conta Google</span></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading || !isSupabaseConfigured}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Cadastrar com Google
                    </button>
                    </div>
                </>
                )}
             </form>
        ) : ( // Forgot Password
            <form className="space-y-4" onSubmit={handleForgotPassword}>
                {recoveryMessage ? (
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">{recoveryMessage}</p>
                        <button type="button" onClick={() => handleSwitchTab('login')} className="mt-4 text-sm font-bold text-gold-600 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300">
                        Voltar para o login
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h3 className="text-lg font-bold transition-colors duration-300 text-slate-950 dark:text-slate-100">Recuperar Senha</h3>
                            <p className="mt-1 text-sm font-bold transition-colors duration-300 text-slate-800 dark:text-slate-400">
                                Digite seu e-mail para receber as instruções.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="recovery-email-address" className="block text-sm font-bold text-slate-900 dark:text-slate-200">Email</label>
                            <input
                                id="recovery-email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`mt-1 appearance-none block w-full px-3 py-2.5 border placeholder-slate-500 text-slate-950 rounded-lg focus:outline-none focus:ring-gold-500 focus:border-gold-500 text-sm font-bold dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400 ${recoveryEmailError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                                placeholder="seu@email.com"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                onBlur={() => validateEmail(recoveryEmail, setRecoveryEmailError)}
                            />
                            {recoveryEmailError && <p className="text-red-500 text-xs mt-1">{recoveryEmailError}</p>}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar link de recuperação'
                                )}
                            </button>
                            <p className="mt-4 text-center text-sm">
                                <button type="button" onClick={() => handleSwitchTab('login')} className="font-medium text-gold-600 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300">
                                    Lembrou a senha? Voltar
                                </button>
                            </p>
                        </div>
                    </>
                )}
            </form>
        )}
        <div className="text-center pt-4">
          <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = '#'; }} className="text-sm font-bold text-gold-700 hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300 transition-colors">
            &larr; Voltar à página inicial
          </a>
        </div>
      </div>
      <footer className="absolute bottom-4 text-center w-full text-xs font-bold text-slate-800 dark:text-slate-400 bg-white/20 backdrop-blur-sm py-1">
        © {new Date().getFullYear()} AG Sistemas. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default LoginPage;
