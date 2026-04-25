
import { supabase } from '../supabaseClient';
import { BusinessInfo, Service, Professional } from '../types';

/**
 * Service for handling onboarding data persistence.
 * Uses business_id (conceptually company_id) for multi-tenant isolation.
 */
export const onboardingService = {
    /**
     * Saves or updates basic business/company information.
     */
    async saveCompany(data: Partial<BusinessInfo>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        const payload = {
            id: user.id,
            name: data.name,
            full_name: data.full_name,
            slug: data.slug,
            whatsapp_phone: data.whatsapp_phone,
            cep: data.cep,
            street: data.street,
            number: data.number,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            work_hours: data.work_hours || {},
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('businesses')
            .upsert(payload); // Utilizando upsert para permitir retentativas durante o onboarding

        if (error) {
            console.error('[DATABASE ERROR] saveCompany:', error);
            throw new Error(error.message);
        }
        return true;
    },

    /**
     * Saves or updates the list of services.
     * Cleans objects to ensure only valid database columns are sent.
     */
    async saveServices(services: any[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        const servicesToUpsert = services.map(s => {
            const payload: any = {
                business_id: user.id,
                name: s.name,
                price: parseFloat(s.price) || 0,
                duration: parseInt(s.duration) || 30,
                description: s.description || '',
                updated_at: new Date().toISOString()
            };

            // Only include ID if it's an existing record
            if (s.isExisting && s.id) {
                payload.id = s.id;
            }

            return payload;
        });

        const { error } = await supabase
            .from('services')
            .upsert(servicesToUpsert);

        if (error) {
            console.error('[DATABASE ERROR] saveServices:', error);
            throw new Error(error.message);
        }
        return true;
    },

    /**
     * Saves or updates a professional profile.
     * Manages relationships with services via professional_services table.
     */
    async saveProfessional(professional: any) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        const payload: any = {
            business_id: user.id,
            name: professional.name,
            whatsapp_phone: professional.whatsapp_phone,
            work_hours: professional.work_hours || {},
            avatar_url: professional.avatar_url || null,
            updated_at: new Date().toISOString()
        };

        // Only include ID if it's an existing record with a valid UUID-like length
        if (professional.id && String(professional.id).length > 20) {
            payload.id = professional.id;
        }

        // Upsert professional
        const { data: profData, error: profError } = await supabase
            .from('professionals')
            .upsert(payload)
            .select()
            .single();

        if (profError) {
            console.error('[DATABASE ERROR] saveProfessional:', profError);
            throw new Error(profError.message);
        }

        const professionalId = profData.id;

        // Manage relationships
        const serviceIds = Array.isArray(professional.service_ids) ? professional.service_ids : [];

        // Clear existing relationships
        await supabase
            .from('professional_services')
            .delete()
            .eq('professional_id', professionalId);

        // Insert new relationships
        if (serviceIds.length > 0) {
            const relPayload = serviceIds.map(serviceId => ({
                professional_id: professionalId,
                service_id: serviceId
            }));

            const { error: relError } = await supabase
                .from('professional_services')
                .insert(relPayload);

            if (relError) {
                console.error('[DATABASE ERROR] saveProfessional relationships:', relError);
                throw new Error(relError.message);
            }
        }

        return true;
    },

    /**
     * Updates only the working hours for the business.
     */
    async saveWorkingHours(workHours: any) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        const { error } = await supabase
            .from('businesses')
            .update({ work_hours: workHours, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (error) throw error;
        return true;
    }
};
