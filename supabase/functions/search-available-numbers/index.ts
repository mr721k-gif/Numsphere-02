// supabase/functions/search-available-numbers/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }
  try {
    // Supabase auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
    // Parse input
    let country = "US";
    let type = "Local"; // could also be TollFree or Mobile
    let areaCode;
    let contains;
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        country = body.country || country;
        type = body.type || type;
        areaCode = body.areaCode;
        contains = body.contains;
      } else {
        const url = new URL(req.url);
        country = url.searchParams.get("country") || country;
        type = url.searchParams.get("type") || type;
        areaCode = url.searchParams.get("areaCode") || undefined;
        contains = url.searchParams.get("contains") || undefined;
      }
    } catch (_) {}
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({
          error: "Twilio credentials not configured",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
    // Build URL for AvailablePhoneNumbers subresource
    const params = new URLSearchParams({
      Limit: "20",
    });
    if (areaCode) params.set("AreaCode", areaCode);
    if (contains) params.set("Contains", contains);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${country}/${type}.json?${params.toString()}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      return new Response(
        JSON.stringify({
          error: "Twilio API failed",
          details: text,
        }),
        {
          status: resp.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
    const data = await resp.json();
    const numbers = (data.available_phone_numbers || []).map((n) => ({
      phoneNumber: n.phone_number,
      friendlyName: n.friendly_name || n.phone_number,
      locality: n.locality,
      region: n.region,
      isoCountry: n.iso_country,
      capabilities: n.capabilities,
    }));
    return new Response(
      JSON.stringify({
        success: true,
        numbers,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
