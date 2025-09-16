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
    const { phoneNumber } = await req.json()

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

    // Check user subscription and release limits
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      // Create default subscription
      await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          number_releases_used: 0,
          max_number_releases: 1
        })
    }

    // Check if user has already purchased a number this billing cycle
    const currentSubscription = subscription || { number_releases_used: 0, max_number_releases: 1 }
    
    if (currentSubscription.number_releases_used >= currentSubscription.max_number_releases) {
      return new Response(
        JSON.stringify({ 
          error: 'You have reached your number purchase limit for this billing cycle',
          limit: currentSubscription.max_number_releases,
          used: currentSubscription.number_releases_used
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        PhoneNumber: phoneNumber,
        FriendlyName: `Number for ${user.email}`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Twilio API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
    }

    const purchasedNumber = await response.json()

    // Save to database
    const { data: savedNumber, error: dbError } = await supabaseClient
      .from('phone_numbers')
      .insert({
        user_id: user.id,
        twilio_sid: purchasedNumber.sid,
        phone_number: purchasedNumber.phone_number,
        friendly_name: purchasedNumber.friendly_name,
        capabilities: purchasedNumber.capabilities,
        monthly_price: 1.00,
        status: 'active'
      })
      .select()
      .single()

    if (dbError) {
      // If database save fails, release the Twilio number
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${purchasedNumber.sid}.json`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      })
      throw new Error('Failed to save number to database')
    }

    // Update subscription usage
    await supabaseClient
      .from('user_subscriptions')
      .update({ 
        number_releases_used: currentSubscription.number_releases_used + 1 
      })
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        number: savedNumber,
        message: 'Phone number purchased successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to purchase number', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})