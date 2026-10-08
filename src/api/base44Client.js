import { supabase } from '../lib/supabase';

const applyFilters = (query, filters = {}) => {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  });

  return query;
};

const applyOrder = (query, orderBy) => {
  if (!orderBy) return query;

  const descending = String(orderBy).startsWith('-');
  const column = descending
    ? String(orderBy).substring(1)
    : String(orderBy);

  return query.order(column, { ascending: !descending });
};

export const base44 = {
  entities: {

    // ============================================================
    // HUB
    // ============================================================
    Hub: {

      list: async (orderBy, limit) => {
        let query = supabase
          .from('Hub')
          .select('*');

        query = applyOrder(query, orderBy);

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      },

      filter: async (filters = {}, orderBy, limit) => {
        let query = supabase
          .from('Hub')
          .select('*');

        query = applyFilters(query, filters);
        query = applyOrder(query, orderBy);

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      },

      create: async (item) => {
        const { data, error } = await supabase
          .from('Hub')
          .insert([item])
          .select();

        if (error) throw error;

        return data ? data[0] : item;
      },

      update: async (id, item) => {
        const { data, error } = await supabase
          .from('Hub')
          .update(item)
          .eq('id', id)
          .select();

        if (error) throw error;

        return data ? data[0] : null;
      },

      delete: async (id) => {
        const { error } = await supabase
          .from('Hub')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return true;
      },
    },

    // ============================================================
    // HUB REPORT
    // ============================================================
    HubReport: {

      list: async (orderBy, limit) => {
        let query = supabase
          .from('HubReport')
          .select('*');

        query = applyOrder(query, orderBy);

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      },

      filter: async (filters = {}, orderBy, limit) => {
        let query = supabase
          .from('HubReport')
          .select('*');

        query = applyFilters(query, filters);
        query = applyOrder(query, orderBy);

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      },

      create: async (item) => {
        let payload = { ...item };
        let attempt = 0;

        while (attempt < 15) {
          const { data, error } = await supabase
            .from('HubReport')
            .insert([payload])
            .select();

          if (!error) {
            return data ? data[0] : payload;
          }

          // Se o Supabase informar que uma coluna não existe,
          // remove a coluna e tenta novamente.
          if (error.code === 'PGRST204' && error.message) {
            const match = error.message.match(
              /Could not find the '([^']+)' column/
            );

            if (match && match[1]) {
              const missingCol = match[1];

              delete payload[missingCol];

              attempt++;
              continue;
            }
          }

          throw error;
        }

        throw new Error(
          'Não foi possível criar o HubReport após várias tentativas.'
        );
      },

      update: async (id, item) => {
        let payload = { ...item };
        let attempt = 0;

        while (attempt < 15) {
          const { data, error } = await supabase
            .from('HubReport')
            .update(payload)
            .eq('id', id)
            .select();

          if (!error) {
            return data ? data[0] : null;
          }

          if (error.code === 'PGRST204' && error.message) {
            const match = error.message.match(
              /Could not find the '([^']+)' column/
            );

            if (match && match[1]) {
              delete payload[match[1]];
              attempt++;
              continue;
            }
          }

          throw error;
        }

        throw new Error(
          'Não foi possível atualizar o HubReport.'
        );
      },

      delete: async (id) => {
        const { error } = await supabase
          .from('HubReport')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return true;
      },

      bulkCreate: async (items) => {
        if (!items || items.length === 0) {
          return [];
        }

        const { data, error } = await supabase
          .from('HubReport')
          .insert(items)
          .select();

        if (error) throw error;

        return data || [];
      },
    },

    // ============================================================
    // HUB TARGET
    // ============================================================
    HubTarget: {

      list: async (orderBy, limit) => {
        let query = supabase
          .from('HubTarget')
          .select('*');

        query = applyOrder(query, orderBy);

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      },

      filter: async (filters = {}, orderBy, limit) => {
        let query = supabase
          .from('HubTarget')
          .select('*');

        query = applyFilters(query, filters);
        query = applyOrder(query, orderBy);

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      },

      create: async (item) => {
        const { data, error } = await supabase
          .from('HubTarget')
          .insert([item])
          .select();

        if (error) throw error;

        return data ? data[0] : item;
      },

      update: async (id, item) => {
        const { data, error } = await supabase
          .from('HubTarget')
          .update(item)
          .eq('id', id)
          .select();

        if (error) throw error;

        return data ? data[0] : null;
      },

      delete: async (id) => {
        const { error } = await supabase
          .from('HubTarget')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return true;
      },
    },

    // ============================================================
    // LEFTOVER
    // ============================================================
    // Mantido para compatibilidade.
    // A Dashboard principal NÃO depende desta tabela para
    // mostrar o Leftover do HubReport.
    Leftover: {

      list: async () => {
        const { data, error } = await supabase
          .from('Leftover')
          .select('*');

        if (error) throw error;

        return data || [];
      },

      create: async (item) => {
        const { data, error } = await supabase
          .from('Leftover')
          .insert([item])
          .select();

        if (error) throw error;

        return data ? data[0] : item;
      },
    },
  },
};