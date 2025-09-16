import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import twilio from "twilio";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Mock data for fallback
    const mockTwilioNumbers = [
      {
        sid: "PN1234567890abcdef1234567890abcdef",
        phoneNumber: "+1 (555) 123-4567",
        friendlyName: "Main Business Line",
        capabilities: {
          voice: true,
          sms: true,
          mms: false,
        },
        status: "in-use",
        dateCreated: "2024-01-15T10:30:00Z",
        origin: "twilio",
      },
      {
        sid: "PN2234567890abcdef1234567890abcdef",
        phoneNumber: "+1 (800) 555-0123",
        friendlyName: "Customer Support",
        capabilities: {
          voice: true,
          sms: false,
          mms: false,
        },
        status: "in-use",
        dateCreated: "2024-01-20T14:15:00Z",
        origin: "twilio",
      },
      {
        sid: "PN3234567890abcdef1234567890abcdef",
        phoneNumber: "+44 20 7946 0958",
        friendlyName: "UK Office",
        capabilities: {
          voice: true,
          sms: true,
          mms: true,
        },
        status: "in-use",
        dateCreated: "2024-02-01T09:45:00Z",
        origin: "twilio",
      },
    ];

    if (!accountSid || !authToken) {
      return NextResponse.json(
        {
          numbers: mockTwilioNumbers,
          message: "Twilio credentials not configured - showing mock data",
        },
        { status: 200 },
      );
    }

    try {
      const client = twilio(accountSid, authToken);

      const numbers = await client.incomingPhoneNumbers.list({ limit: 50 });

      const formattedNumbers = numbers.map((number: any) => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: number.capabilities,
        status: number.status,
        dateCreated: number.dateCreated,
        origin: "twilio",
      }));

      return NextResponse.json({
        numbers: formattedNumbers,
        message: "Live Twilio data",
      });
    } catch (twilioError) {
      console.error("Twilio API error:", twilioError);
      return NextResponse.json(
        {
          numbers: mockTwilioNumbers,
          message: "Twilio API error - showing mock data",
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error fetching Twilio numbers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch phone numbers",
        numbers: [],
      },
      { status: 500 },
    );
  }
}
