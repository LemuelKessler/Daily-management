import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://llghcytfachaejykddvg.supabase.co'
// Substitui o texto abaixo pela tua chave anon que começa por eyJ...
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZ2hjeXRmYWNoYWVqeWtkZHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzA0MzEsImV4cCI6MjEwNjAwNjQzMX0.YUVLOkLJWwCYgnXukjUHL3_Wu7e5o5Ln7K8E_xhfYvc' 

export const supabase = createClient(supabaseUrl, supabaseKey)
