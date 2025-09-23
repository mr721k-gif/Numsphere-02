import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import twilio from "twilio";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 🔑 Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: "Twilio not configured", numbers: [] },
        { status: 500 },
      );
    }

    // 🟢 Owned numbers from Supabase (fix: correct table name)
    const { data: ownedRows, error: ownedError } = await supabase
      .from("phone_numbers")
      .select("twilio_sid, phone_number, friendly_name, capabilities, status, created_at")
      .eq("user_id", user.id);

    if (ownedError) {
      console.error("Supabase error:", ownedError);
      return NextResponse.json(
        { error: "Failed to load owned numbers", numbers: [] },
        { status: 500 },
      );
    }

    const ownedNumbers = ownedRows || [];

    // 🔵 Live Twilio numbers
    const client = twilio(accountSid, authToken);
    const twilioNumbers = await client.incomingPhoneNumbers.list({ limit: 50 });

    // 🔀 Merge
    const merged = twilioNumbers.map((n: any) => ({
      sid: n.sid,
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      capabilities: n.capabilities,
      status: n.status,
      dateCreated: n.dateCreated,
      origin: "twilio",
      owned: ownedNumbers.some((o: any) => o.twilio_sid === n.sid),
    }));

    // 🟡 Add Supabase-only numbers (if Twilio doesn't return them anymore)
    const extras = ownedNumbers
      .filter((o: any) => !merged.some((t: any) => t.sid === o.twilio_sid))
      .map((o: any) => ({
        sid: o.twilio_sid,
        phoneNumber: o.phone_number,
        friendlyName: o.friendly_name,
        capabilities:
          typeof o.capabilities === "string"
            ? JSON.parse(o.capabilities)
            : o.capabilities || {},
        status: o.status,
        dateCreated: o.created_at,
        origin: "supabase",
        owned: true,
      }));

    return NextResponse.json({ numbers: [...merged, ...extras] });
  } catch (error) {
    console.error("Error fetching Twilio numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone numbers", numbers: [] },
      { status: 500 },
    );
  }
}