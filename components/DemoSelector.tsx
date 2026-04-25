
import React from 'react';
import { motion } from 'motion/react';
import { Store, Smartphone, ArrowRight, ArrowLeft, Scissors } from 'lucide-react';
import { useTheme } from '../App';

const DemoSelector: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'light' ? 'bg-white' : 'bg-slate-950'}`}>
      {/* Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'light' ? 'bg-white/90 border-slate-100' : 'bg-slate-950/90 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => window.location.hash = ''}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg text-white">
              <Scissors className="w-4 h-4" />
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Agendios
            </span>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 max-w-lg mx-auto">
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl font-extrabold mb-4 tracking-tight transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
          >
            Escolha sua Demo
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-base font-medium transition-colors duration-300 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}
          >
            Experimente o Agendios de dois pontos de vista diferentes.
          </motion.p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Business Demo Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => window.location.hash = '#demo'}
            className={`group cursor-pointer p-6 rounded-3xl border transition-all duration-300 active:scale-95 ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:border-primary-200' : 'bg-slate-900 border-slate-800 hover:border-primary-900/50'}`}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Store className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Painel do Negócio</h3>
                <p className={`text-sm mb-4 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Gerencie sua agenda, profissionais e faturamento. Veja como é o dia a dia do administrador.
                </p>
                <div className="flex items-center text-primary-600 dark:text-primary-400 font-bold text-sm gap-1">
                  Explorar Painel
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Client Demo Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => window.location.hash = '#demo-booking'}
            className={`group cursor-pointer p-6 rounded-3xl border transition-all duration-300 active:scale-95 ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:border-gold-200' : 'bg-slate-900 border-slate-800 hover:border-gold-900/50'}`}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Página de Agendamento</h3>
                <p className={`text-sm mb-4 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Simule a experiência do seu cliente. Veja como é fácil e rápido agendar um serviço.
                </p>
                <div className="flex items-center text-gold-600 dark:text-gold-400 font-bold text-sm gap-1">
                  Simular Agendamento
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-center"
        >
          <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Ambas as demonstrações são interativas e utilizam dados fictícios para você testar todas as funcionalidades.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default DemoSelector;
