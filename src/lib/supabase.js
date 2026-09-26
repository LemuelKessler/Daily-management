import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://llghcytfachaejykddvg.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZ2hjeXRmYWNoYWVqeWtkZHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzA0MzEsImV4cCI6MjEwNjAwNjQzMX0.YUVLOkLJWwCYgnXukjUHL3_Wu7e5o5Ln7K8E_xhfYvc' // Ou cola a chave completa aqui

export const supabase = createClient(supabaseUrl, supabaseKey)
