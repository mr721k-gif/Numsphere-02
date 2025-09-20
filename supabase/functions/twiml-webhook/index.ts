import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
    );

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioApiKey = Deno.env.get('TWILIO_API_KEY');
    const twilioApiSecret = Deno.env.get('TWILIO_API_SECRET');

    if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle incoming call webhook
    if (req.method === 'POST') {
      const formData = await req.formData();
      const callSid = formData.get('CallSid');
      const from = formData.get('From');
      const to = formData.get('To');
      const callStatus = formData.get('CallStatus');
      const direction = formData.get('Direction');

      // Log the incoming call
      try {
        // Find the user who owns this phone number
        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('user_id')
          .eq('phone_number', to)
          .single();

        if (phoneNumber) {
          await supabase
            .from('call_logs')
            .insert({
              user_id: phoneNumber.user_id,
              twilio_call_sid: callSid,
              from_number: from,
              to_number: to,
              direction: direction === 'inbound' ? 'inbound' : 'outbound',
              status: callStatus?.toLowerCase() || 'unknown',
              started_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Failed to log call:', error);
      }

      // Generate TwiML response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. This is a Numsphere phone number. Your call is being handled by our system.</Say>
    <Pause length="1"/>
    <Say voice="alice">If you need to reach the owner of this number, please try again later or send a text message.</Say>
    <Hangup/>
</Response>`;

      return new Response(twiml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml'
        }
      });
    }

    // Handle status callback webhook
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const callSid = url.searchParams.get('CallSid');
      const callStatus = url.searchParams.get('CallStatus');
      const callDuration = url.searchParams.get('CallDuration');

      if (callSid && callStatus) {
        try {
          // Update call log with final status and duration
          await supabase
            .from('call_logs')
            .update({
              status: callStatus.toLowerCase(),
              duration: callDuration ? parseInt(callDuration) : 0,
              ended_at: new Date().toISOString()
            })
            .eq('twilio_call_sid', callSid);
        } catch (error) {
          console.error('Failed to update call log:', error);
        }
      }

      return new Response('OK', {
        headers: corsHeaders
      });
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});