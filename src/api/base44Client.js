import { supabase } from '../lib/supabase';

// Proxy para direcionar as chamadas antigas do base44 para o Supabase
export const base44 = {
  entities: {
    Hub: {
      list: async () => {
        const { data, error } = await supabase.from('Hub').select('*');
        if (error) throw error;
        return data;
      },
      create: async (item) => {
        const { data, error } = await supabase.from('Hub').insert([item]).select();
        if (error) throw error;
        return data[0];
      },
    },
    HubReport: {
      list: async () => {
        const { data, error } = await supabase.from('HubReport').select('*');
        if (error) throw error;
        return data;
      },
      create: async (item) => {
        const { data, error } = await supabase.from('HubReport').insert([item]).select();
        if (error) throw error;
        return data[0];
      },
    },
    HubTarget: {
      list: async () => {
        const { data, error } = await supabase.from('HubTarget').select('*');
        if (error) throw error;
        return data;
      },
      create: async (item) => {
        const { data, error } = await supabase.from('HubTarget').insert([item]).select();
        if (error) throw error;
        return data[0];
      },
    },
  },
};
