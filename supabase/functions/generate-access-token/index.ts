import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const apiKeySid = Deno.env.get('TWILIO_API_KEY_SID');
    const apiKeySecret = Deno.env.get('TWILIO_API_KEY_SECRET');

    if (!accountSid || !authToken || !apiKeySid || !apiKeySecret) {
      return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create access token using Twilio's JWT library approach
    const jwt = await import('https://esm.sh/jsonwebtoken@9.0.2');
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKeySid,
      sub: accountSid,
      nbf: now,
      exp: now + 3600, // 1 hour
      grants: {
        identity: user.id,
        voice: {
          incoming: { allow: true },
          outgoing: { 
            application_sid: Deno.env.get('TWILIO_TWIML_APP_SID') || 'default'
          }
        }
      }
    };

    const token = jwt.sign(payload, apiKeySecret, { algorithm: 'HS256' });

    return new Response(JSON.stringify({ 
      success: true, 
      token,
      identity: user.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating access token:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});