// app/api/call-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@/utils/supabase/server";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's assigned Twilio number
    const { data: numberData } = await supabase
      .from("phone_numbers")
      .select("phone_number")
      .eq("user_id", user.id)
      .single();

    if (!numberData) return NextResponse.json({ logs: [] });

    const userNumber = numberData.phone_number;

    // Fetch Twilio logs
    const outboundCalls = await client.calls.list({
      from: userNumber,
      limit: 50,
    });
    const inboundCalls = await client.calls.list({ to: userNumber, limit: 50 });

    // Map Twilio data to frontend-friendly format
    const logs = [...outboundCalls, ...inboundCalls]
      .map((call) => ({
        id: call.sid, // unique key
        from_number: call.from || "Unknown",
        to_number: call.to || "Unknown",
        direction: call.direction as "inbound" | "outbound",
        status: call.status || "unknown",
        duration: call.duration || 0,
        started_at: call.startTime
          ? call.startTime.toISOString()
          : new Date().toISOString(),
        ended_at: call.endTime ? call.endTime.toISOString() : null,
        created_at: call.startTime
          ? call.startTime.toISOString()
          : new Date().toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      );

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("Twilio API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Twilio logs" },
      { status: 500 },
    );
  }
}
