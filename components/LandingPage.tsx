
import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  Smartphone, 
  Bell, 
  Check, 
  ArrowRight,
  Moon,
  Sun,
  Scissors,
  Store,
  Sparkles,
  Heart,
  Flower2,
  Palette,
  PenTool,
  Dog
} from 'lucide-react';
import { useTheme } from '../App';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Agendamento 24h",
      description: "Seus clientes agendam a qualquer hora, direto pelo link exclusivo do seu negócio.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gestão de Clientes",
      description: "Banco de dados completo com histórico de atendimentos e preferências.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Painel Administrativo",
      description: "Dashboard com métricas de agendamentos, faturamento e novos clientes.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Horários Inteligentes",
      description: "Configuração de horários de funcionamento com intervalos personalizados.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Link Personalizado",
      description: "URL única para compartilhar com seus clientes nas redes sociais.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Notificações em Tempo Real",
      description: "Alertas instantâneos quando um novo agendamento é realizado.",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    }
  ];

  const niches = [
    { icon: <Scissors className="w-6 h-6" />, title: "Barbearia", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" },
    { icon: <Sparkles className="w-6 h-6" />, title: "Salão de Beleza", img: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop" },
    { icon: <Flower2 className="w-6 h-6" />, title: "Manicure & Pedicure", img: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop" },
    { icon: <Heart className="w-6 h-6" />, title: "Massagem", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop" },
    { icon: <Palette className="w-6 h-6" />, title: "Maquiagem", img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070&auto=format&fit=crop" },
    { icon: <Sun className="w-6 h-6" />, title: "Bronzeamento", img: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=2070&auto=format&fit=crop" },
    { icon: <PenTool className="w-6 h-6" />, title: "Tatuagem", img: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071&auto=format&fit=crop" },
    { icon: <Dog className="w-6 h-6" />, title: "Pets", img: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=2071&auto=format&fit=crop" }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300`}>
      {/* --- HEADER --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'light' ? 'bg-white/90 border-slate-100' : 'bg-slate-950/90 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="bg-orange-500 p-1.5 sm:p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <Scissors className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg sm:text-2xl font-bold tracking-tight leading-none transition-colors duration-300`}>
                  <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>Agenda</span>
                  <span className="text-gold-600 dark:text-gold-400">Visual</span>
              </span>
              <span className={`text-[9px] sm:text-[11px] font-bold transition-colors duration-300 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Agendamento inteligente para seu negócio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6">
            <button 
              onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => window.location.hash = '#login'}
              className={`px-2 sm:px-4 py-2 text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-900 hover:text-orange-500' : 'text-slate-300 hover:text-white'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => window.location.hash = '#login'}
              className="hidden sm:flex px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 sm:pt-48 pb-8 sm:pb-16 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-orange-400/10 dark:bg-orange-500/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 sm:mb-10 tracking-tight transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
            >
              Sua agenda online, <br className="hidden sm:block" /> <span className="text-orange-500">simples e profissional</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-sm sm:text-xl mb-10 sm:mb-14 max-w-2xl mx-auto leading-relaxed font-medium transition-colors duration-300 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}
            >
              Gerencie agendamentos, clientes e serviços em uma plataforma completa. Seus clientes agendam 24h por dia, você foca no que faz de melhor.
            </motion.p>
          </div>

          {/* --- CATEGORY CAROUSEL (Full Width) --- */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden mb-8 sm:mb-16 py-2"
          >
            <motion.div 
              className="flex gap-3 sm:gap-6 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ 
                ease: "linear", 
                duration: 50, 
                repeat: Infinity 
              }}
            >
              {[...niches, ...niches].map((niche, idx) => (
                <div 
                  key={idx}
                  className={`relative group overflow-hidden rounded-2xl transition-all duration-300 h-28 w-44 sm:h-40 sm:w-64 flex-shrink-0 shadow-sm`}
                >
                  <img 
                    src={niche.img} 
                    alt={niche.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white text-left">
                    <div className="bg-orange-500/20 backdrop-blur-md w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 border border-orange-500/30">
                      {React.cloneElement(niche.icon as React.ReactElement, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" })}
                    </div>
                    <h3 className="text-xs sm:text-base font-bold">{niche.title}</h3>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <button 
                onClick={() => window.location.hash = '#login'}
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-2 active:scale-95"
              >
                Começar Grátis
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => window.location.hash = '#selecionar-demo'}
                className={`w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 border font-bold rounded-2xl transition-all active:scale-95 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'}`}
              >
                Ver demonstrações
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 sm:mt-5"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-slate-900 text-gold-400 dark:bg-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] shadow-2xl border-2 border-gold-500/20 whitespace-nowrap overflow-hidden">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>30 dias grátis • Sem cartão de crédito</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- NICHES SECTION REMOVED (MOVED TO HERO) --- */}

      {/* --- FEATURES SECTION --- */}
      <section className={`py-8 sm:py-20 px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-slate-50/30' : 'bg-slate-900/30'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className={`text-xl sm:text-5xl font-extrabold mb-2 sm:mb-6 tracking-tight transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Tudo que você precisa para gerenciar seu negócio
            </h2>
            <p className={`text-sm sm:text-xl font-medium transition-colors duration-300 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Ferramentas poderosas em uma interface simples e intuitiva.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 sm:p-10 rounded-2xl sm:rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}
              >
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-8 ${feature.color} shadow-sm`}>
                  {React.cloneElement(feature.icon as React.ReactElement, { className: "w-5 h-5 sm:w-6 h-6" })}
                </div>
                <h3 className={`text-sm sm:text-2xl font-bold mb-1 sm:mb-4 tracking-tight transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {feature.title}
                </h3>
                <p className={`text-[10px] sm:text-base leading-tight sm:leading-relaxed font-medium transition-colors duration-300 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="py-8 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className={`text-2xl sm:text-5xl font-extrabold mb-3 sm:mb-6 tracking-tight transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Plano simples, sem surpresas
            </h2>
            <p className={`text-sm sm:text-xl font-medium transition-colors duration-300 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Comece grátis por 30 dias. Cancele quando quiser.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`rounded-3xl sm:rounded-[40px] border-2 border-orange-500 p-6 sm:p-16 shadow-2xl relative overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-white' : 'bg-slate-900'}`}
          >
            <div className="text-center mb-8 sm:mb-12">
              <p className={`font-bold uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 sm:mb-6 transition-colors duration-300 ${theme === 'light' ? 'text-orange-500' : 'text-orange-400'}`}>
                Plano Profissional
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl sm:text-3xl text-slate-400 font-bold mb-2 sm:mb-4">R$</span>
                <span className={`text-6xl sm:text-8xl font-black tracking-tighter transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>14</span>
                <div className="text-left ml-1 sm:ml-2">
                  <span className={`block text-xl sm:text-3xl font-black transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>,99</span>
                  <span className="block text-sm sm:text-lg font-bold text-slate-400">/mês</span>
                </div>
              </div>
              <p className={`mt-4 sm:mt-6 text-xs sm:text-base font-bold transition-colors duration-300 ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>30 dias de teste gratuito</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 sm:gap-y-6 mb-8 sm:mb-16 max-w-2xl mx-auto">
              {[
                "Agendamento online ilimitado",
                "Gestão completa de clientes",
                "Catálogo de serviços",
                "Equipe de profissionais",
                "Link personalizado",
                "Notificações em tempo real",
                "Painel administrativo completo",
                "Suporte por e-mail"
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 sm:gap-4 transition-colors duration-300 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                  <div className={`flex-shrink-0 w-5 h-5 sm:w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${theme === 'light' ? 'bg-orange-50 text-orange-500' : 'bg-orange-900/20 text-orange-400'}`}>
                    <Check className="w-3 h-3 sm:w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-bold">{item}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => window.location.hash = '#login'}
              className="w-full py-4 sm:py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg"
            >
              Começar teste gratuito
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`py-8 sm:py-12 px-4 border-t transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-950 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-10">
            <div className="bg-orange-500 p-1.5 sm:p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <Scissors className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <span className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300`}>
                <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>Agenda</span>
                <span className="text-gold-600 dark:text-gold-400">Visual</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-8 sm:mb-12">
            <a href="#" className={`text-sm sm:text-base font-bold hover:text-orange-500 transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Termos</a>
            <a href="#" className={`text-sm sm:text-base font-bold hover:text-orange-500 transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Privacidade</a>
            <a href="#" className={`text-sm sm:text-base font-bold hover:text-orange-500 transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Contato</a>
          </div>

          <p className={`text-[10px] sm:text-sm font-medium transition-colors duration-300 ${theme === 'light' ? 'text-slate-500' : 'text-slate-600'}`}>
            © {new Date().getFullYear()} AG Sistemas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

