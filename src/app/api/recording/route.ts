// app/api/recording/[recordingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

export async function GET(
  req: NextRequest,
  { params }: { params: { recordingId: string } },
) {
  const { recordingId } = params;

  try {
    // Get the recording as a URL with auth
    const recording = await client.recordings(recordingId).fetch();
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recording.sid}.mp3`;

    // Fetch the file with Twilio credentials
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch recording from Twilio");
    }

    const blob = await res.arrayBuffer();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${recording.sid}.mp3"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch recording" },
      { status: 500 },
    );
  }
}
