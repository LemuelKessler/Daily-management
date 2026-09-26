import { supabase } from '../lib/supabase';

export const base44 = {
  entities: {
    Hub: {
      list: async () => {
        const { data, error } = await supabase.from('Hub').select('*');
        if (error) throw error;
        return data || [];
      },
      create: async (item) => {
        // Remove campos nulos/indefinidos antes de enviar
        const { data, error } = await supabase
          .from('Hub')
          .insert([item])
          .select();
          
        if (error) {
          console.error('Erro ao criar Hub:', error);
          throw error;
        }
        return data ? data[0] : item;
      },
    },
    HubReport: {
      list: async () => {
        const { data, error } = await supabase.from('HubReport').select('*');
        if (error) throw error;
        return data || [];
      },
      create: async (item) => {
        const { data, error } = await supabase.from('HubReport').insert([item]).select();
        if (error) throw error;
        return data ? data[0] : item;
      },
    },
    HubTarget: {
      list: async () => {
        const { data, error } = await supabase.from('HubTarget').select('*');
        if (error) throw error;
        return data || [];
      },
      create: async (item) => {
        const { data, error } = await supabase.from('HubTarget').insert([item]).select();
        if (error) throw error;
        return data ? data[0] : item;
      },
    },
  },
};
