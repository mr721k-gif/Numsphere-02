import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    TWILIO_TWIML_APP_SID,
  } = process.env as Record<string, string | undefined>;

  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_API_KEY ||
    !TWILIO_API_SECRET ||
    !TWILIO_TWIML_APP_SID
  ) {
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

  try {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const identity = "web-user";

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });

    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY,
      TWILIO_API_SECRET,
      { identity },
    );

    token.addGrant(voiceGrant);

    console.log("🔑 Twilio token issued for:", identity);
    console.log("Grants:", token.grants);

    return NextResponse.json({ token: token.toJwt(), identity });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to generate token",
        details: String(error?.message ?? error),
      },
      { status: 500 },
    );
  }
}
