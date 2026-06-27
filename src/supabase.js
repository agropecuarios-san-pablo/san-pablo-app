import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wvqhqgqhdpzktgarvcyf.supabase.co'
const supabaseKey = 'sb_publishable_2we6cf6ogcxqj8S9kH_G4g_VlmGLWWp'

export const supabase = createClient(supabaseUrl, supabaseKey)