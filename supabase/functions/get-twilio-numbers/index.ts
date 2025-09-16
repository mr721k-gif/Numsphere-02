import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import twilio from 'https://esm.sh/twilio@4.19.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')

    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const client = twilio(accountSid, authToken)

    // Get user's owned numbers from database
    const { data: ownedNumbers } = await supabaseClient
      .from('phone_numbers')
      .select('*')
      .eq('user_id', user.id)

    // Get Twilio numbers
    const twilioNumbers = await client.incomingPhoneNumbers.list({ limit: 50 })

    const formattedNumbers = twilioNumbers.map((number: any) => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: number.capabilities,
      status: number.status,
      dateCreated: number.dateCreated,
      origin: 'twilio',
      owned: ownedNumbers?.some(owned => owned.twilio_sid === number.sid) || false
    }))

    return new Response(
      JSON.stringify({ 
        numbers: formattedNumbers,
        ownedCount: ownedNumbers?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})