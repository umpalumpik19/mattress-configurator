import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Используем более стабильную bcrypt библиотеку для Deno
import { compareSync, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { hashedPassword, plainPassword } = await req.json()

    if (!hashedPassword || !plainPassword) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing hashedPassword or plainPassword',
          isValid: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify password using bcrypt - попробуем и синхронный и асинхронный методы
    let isValid = false;
    
    try {
      // Попробуем асинхронный метод
      isValid = await compare(plainPassword, hashedPassword);
    } catch (asyncError) {
      try {
        // Fallback на синхронный метод
        isValid = compareSync(plainPassword, hashedPassword);
      } catch (syncError) {
        throw new Error(`Bcrypt comparison failed: ${syncError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ isValid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Password verification error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Password verification failed',
        isValid: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})