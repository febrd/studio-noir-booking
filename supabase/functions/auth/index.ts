
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    if (req.method === 'POST' && path === 'register') {
      const { name, email, password, role = 'pelanggan' } = await req.json()

      console.log('Registration attempt:', { name, email, role })

      if (!name || !email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Semua field harus diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the register_user function that handles password hashing
      const { data, error } = await supabase.rpc('register_user', {
        user_name: name,
        user_email: email,
        user_password: password,
        user_role: role
      })

      if (error) {
        console.error('Register error:', error)
        return new Response(
          JSON.stringify({ success: false, error: error.message || 'Terjadi kesalahan server' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Registration successful:', data)
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && path === 'login') {
      const { email, password } = await req.json()

      console.log('Login attempt:', { email })

      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email dan password harus diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the login_user function that handles password verification
      const { data, error } = await supabase.rpc('login_user', {
        user_email: email,
        user_password: password
      })

      if (error) {
        console.error('Login error:', error)
        return new Response(
          JSON.stringify({ success: false, error: error.message || 'Email atau password salah' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Login successful:', data)
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Endpoint tidak ditemukan' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
