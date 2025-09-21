// app/api/twilio/voice/route.ts (Next.js 13+ /app directory)

import { NextResponse } from "next/server";

// Escape XML special characters to avoid TwiML errors
function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Build TwiML response
function buildTwiML(content: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${content}</Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

// Handle incoming POST requests from Twilio
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let to: string | null = null;
    let from: string | null = null;

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      to = (form.get("To") as string) || null;
      from = (form.get("From") as string) || null;
    } else if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}) as any);
      to = body?.To ?? null;
      from = body?.From ?? null;
    }

    // Fallback to query params for testing in browser
    if (!to) {
      const url = new URL(req.url);
      to = url.searchParams.get("To");
    }
    if (!from) {
      const url = new URL(req.url);
      from = url.searchParams.get("From");
    }

    if (to) {
      // Outbound: Dial the number with optional callerId
      const callerIdAttr = from ? ` callerId="${escapeXml(from)}"` : "";
      return buildTwiML(
        `<Dial${callerIdAttr}><Number>${escapeXml(to)}</Number></Dial>`,
      );
    }

    // Inbound: greet the caller
    return buildTwiML(
      `<Say voice="alice">Welcome to NumSphere. Please set up your account and call flow.</Say>`,
    );
  } catch (e) {
    console.error("Twilio webhook error:", e);
    return buildTwiML(
      `<Say>We are experiencing difficulties. Please try again later.</Say>`,
    );
  }
}

// Optional GET handler for browser testing
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("To");
  const from = url.searchParams.get("From");

  if (to) {
    const callerIdAttr = from ? ` callerId="${escapeXml(from)}"` : "";
    return buildTwiML(
      `<Dial${callerIdAttr}><Number>${escapeXml(to)}</Number></Dial>`,
    );
  }

  return buildTwiML(
    `<Say voice="alice">Welcome to NumSphere. Please set up your account and call flow.</Say>`,
  );
}
