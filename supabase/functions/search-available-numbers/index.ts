import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { country, areaCode, contains, limit = 20 } = await req.json()

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

    // Use fetch instead of the problematic twilio library
    const auth = btoa(`${accountSid}:${authToken}`)
    
    // Build search parameters
    const searchParams = new URLSearchParams({
      PageSize: limit.toString()
    })
    
    if (areaCode) searchParams.append('AreaCode', areaCode)
    if (contains) searchParams.append('Contains', contains)

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${country || 'US'}/Local.json?${searchParams}`

    const response = await fetch(twilioUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`)
    }

    const data = await response.json()

    const formattedNumbers = (data.available_phone_numbers || []).map((number: any) => ({
      phoneNumber: number.phone_number,
      friendlyName: number.friendly_name,
      locality: number.locality,
      region: number.region,
      isoCountry: number.iso_country,
      capabilities: number.capabilities,
      estimatedPrice: '$1.00/month' // Twilio's standard pricing
    }))

    return new Response(
      JSON.stringify({ numbers: formattedNumbers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to search numbers', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})