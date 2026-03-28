import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || 'https://vlmoodcrcjhjtlxxtooz.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_biihpOFU-kb00A_FS1IIow_5SFzX3Vp'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const COLORS = ['#2d5a3d','#5b6dd9','#c8a96e','#e07b8a','#8d5bd9','#d97b5b','#5bd9b0','#d95b5b']
export const initials    = name => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'
export const avatarColor = name => COLORS[name ? name.charCodeAt(0) % COLORS.length : 0]
