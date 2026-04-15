
import { createClient } from '@supabase/supabase-js'

// Helper function to safely access environment variables in different environments
const getEnvVar = (key: string) => {
    try {
        // Try import.meta.env (Vite standard)
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) {
        // Ignore error
    }

    try {
        // Try process.env (Node/Webpack standard fallback)
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) {
        // Ignore error
    }

    return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Check if the configuration is valid (not empty and not the placeholder from .env.example)
export const isSupabaseConfigured = Boolean(
    supabaseUrl && 
    supabaseKey && 
    supabaseUrl !== 'your-project-url.supabase.co' &&
    !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
    console.warn('AVISO: Variáveis de ambiente do Supabase não configuradas corretamente. O sistema funcionará apenas em Modo Demo.');
}

// Fallback values prevent crash on init (createClient throws if URL is empty), 
// though connection will fail later if keys are actually missing.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-project.supabase.co', 
    supabaseKey || 'placeholder-key'
);
