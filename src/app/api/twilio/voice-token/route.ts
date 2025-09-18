import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import twilio from "twilio";

export async function POST(_req: NextRequest) {
  try {
    // 🔐 Supabase auth check
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore
              .getAll()
              .map(({ name, value }) => ({ name, value }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔑 Load Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const outgoingAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !outgoingAppSid) {
      return NextResponse.json(
        {
          error: "Missing Twilio environment variables",
          required: [
            "TWILIO_ACCOUNT_SID",
            "TWILIO_API_KEY",
            "TWILIO_API_SECRET",
            "TWILIO_TWIML_APP_SID",
          ],
        },
        { status: 500 },
      );
    }

    // 🎯 Twilio AccessToken (same as your Node script)
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: user.id, // 👈 each logged-in Supabase user gets their own identity
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingAppSid,
      incomingAllow: true, // allow incoming calls
    });

    token.addGrant(voiceGrant);

    // ✅ Return token to client
    return NextResponse.json(
      {
        token: token.toJwt(),
        identity: user.id,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error?.message ?? error),
      },
      { status: 500 },
    );
  }
}

// Optional: allow GET → behave same as POST
export async function GET(req: NextRequest) {
  return POST(req);
}
