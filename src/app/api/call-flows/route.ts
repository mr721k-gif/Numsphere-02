import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone_number = searchParams.get("phone_number");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!phone_number) {
      return NextResponse.json(
        { error: "Missing phone_number" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("call_flows")
      .select("*")
      .eq("user_id", user.id)
      .eq("phone_number", phone_number)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ flow: data || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      phone_number,
      flow_json,
      recording_enabled,
      recording_disclaimer,
    } = body || {};

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!phone_number || !flow_json) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("call_flows")
      .upsert(
        {
          user_id: user.id,
          phone_number,
          flow_json,
          recording_enabled: !!recording_enabled,
          recording_disclaimer:
            recording_disclaimer ||
            "This call is being recorded for training purposes.",
        },
        { onConflict: "user_id,phone_number" },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ flow: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}