// supabase/functions/search-available-numbers/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Twilio } from "https://esm.sh/twilio@5.3.4";
// ✅ CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
Deno.serve(async (req) => {
  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }
  try {
    // ✅ Auth check
    const supabaseClient = createClient(
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
    } = await supabaseClient.auth.getUser();
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
    // ✅ Parse input (JSON body or query string)
    let country = "US";
    let areaCode;
    let contains;
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        country = (body.country || country).toString();
        areaCode = body.areaCode ? body.areaCode.toString() : undefined;
        contains = body.contains ? body.contains.toString() : undefined;
      } else {
        const url = new URL(req.url);
        country = (url.searchParams.get("country") || country).toString();
        areaCode = url.searchParams.get("areaCode") || undefined;
        contains = url.searchParams.get("contains") || undefined;
      }
    } catch (_) {
      // ignore and use defaults
    }
    // ✅ Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({
          error: "Twilio credentials not configured",
          hint: "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Supabase secrets",
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
    const client = new Twilio(accountSid, authToken);
    // ✅ Build Twilio search options
    const searchOptions = {
      limit: 20,
    };
    if (areaCode) searchOptions.areaCode = areaCode;
    if (contains) searchOptions.contains = contains;
    let previewResults = null;
    // ✅ Try Preview API (with pricing)
    try {
      const params = new URLSearchParams();
      params.set("Country", country);
      params.set("Type", "local");
      params.set("Limit", "20");
      if (areaCode) params.set("AreaCode", areaCode);
      if (contains) params.set("Contains", contains);
      const previewUrl = `https://preview.twilio.com/AvailableNumbers?${params.toString()}`;
      const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
      const resp = await fetch(previewUrl, {
        headers: {
          Authorization: authHeader,
        },
      });
      if (resp.ok) {
        const json = await resp.json();
        const items = json?.items || json?.data || json;
        if (Array.isArray(items)) previewResults = items;
      } else {
        console.warn("Twilio Preview API error:", resp.status);
      }
    } catch (e) {
      console.warn("Preview API failed, falling back:", e);
    }
    // ✅ Format numbers
    let formattedNumbers = [];
    if (previewResults) {
      formattedNumbers = previewResults
        .map((n) => ({
          phoneNumber: n.PhoneNumber || n.phoneNumber,
          friendlyName:
            n.FriendlyName || n.friendlyName || n.PhoneNumber || n.phoneNumber,
          locality: n.Locality || n.locality || null,
          region: n.Region || n.region || null,
          isoCountry: n.IsoCountry || n.Country || country,
          capabilities: n.Capabilities || n.capabilities || {},
          type: n.Type || "local",
          lifecycle: n.Lifecycle || null,
          baseRecurringPrice: n.BaseRecurringPrice || null,
          baseSetupPrice: n.BaseSetupPrice || null,
          estimatedPrice: n.BaseRecurringPrice
            ? `$${n.BaseRecurringPrice}/month`
            : "$1.00/month",
        }))
        .filter((n) => !!n.phoneNumber);
    }
    // ✅ Fallback: Classic API
    if (!previewResults || formattedNumbers.length === 0) {
      try {
        const availableNumbers = await client
          .availablePhoneNumbers(country)
          .local.list(searchOptions);
        formattedNumbers = availableNumbers.map((num) => ({
          phoneNumber: num.phoneNumber,
          friendlyName: num.friendlyName || num.phoneNumber,
          locality: num.locality,
          region: num.region,
          isoCountry: num.isoCountry,
          capabilities: num.capabilities,
          estimatedPrice: "$1.15/month",
        }));
      } catch (err) {
        console.error("Twilio search error:", err);
        if (err.code === 21452) {
          return new Response(
            JSON.stringify({
              numbers: [],
              success: true,
              message: "No numbers found with the specified criteria",
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }
        return new Response(
          JSON.stringify({
            error: "Failed to search available numbers",
            details: err?.message || String(err),
          }),
          {
            status: err?.status || 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }
    }
    // ✅ Success response
    return new Response(
      JSON.stringify({
        numbers: formattedNumbers,
        success: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Server error:", error);
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
