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
        const { data, error } = await supabase.from('Hub').insert([item]).select();
        if (error) throw error;
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
        let payload = { ...item };
        let attempt = 0;
        
        while (attempt < 15) {
          const { data, error } = await supabase.from('HubReport').insert([payload]).select();
          
          if (!error) {
            return data ? data[0] : payload;
          }
          
          // Se o erro for de coluna não encontrada (PGRST204), remove a coluna problemática e tenta novamente
          if (error.code === 'PGRST204' && error.message) {
            const match = error.message.match(/Could not find the '([^']+)' column/);
            if (match && match[1]) {
              const missingCol = match[1];
              delete payload[missingCol];
              attempt++;
              continue;
            }
          }
          
          // Caso seja outro erro, lança a exceção
          throw error;
        }
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
    Leftover: {
      list: async () => {
        const { data, error } = await supabase.from('Leftover').select('*');
        if (error) throw error;
        return data || [];
      },
      create: async (item) => {
        const { data, error } = await supabase.from('Leftover').insert([item]).select();
        if (error) throw error;
        return data ? data[0] : item;
      },
    },
  },
};
