import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("call_flows")
    .select(
      "id,user_id,phone_number,flow_json,recording_enabled,created_at,updated_at,name,description,status",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ flows: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const {
    user_id,
    phone_number,
    flow_json,
    recording_enabled,
    name,
    description,
    status,
  } = body || {};

  if (!user_id || !phone_number || !Array.isArray(flow_json)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Check if a flow already exists for this user+number
  const { data: existing } = await supabase
    .from("call_flows")
    .select("id")
    .eq("user_id", user_id)
    .eq("phone_number", phone_number)
    .limit(1)
    .maybeSingle();

  let result;

  if (existing) {
    // 🔁 Update existing flow
    result = await supabase
      .from("call_flows")
      .update({
        name: name,
        description: description || "",
        status: status || "active",
        flow_json,
        recording_enabled: recording_enabled ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    // 🆕 Insert new flow
    result = await supabase
      .from("call_flows")
      .insert({
        user_id,
        phone_number,
        flow_json,
        name: name || "Untitled Flow",
        description: description || "",
        status: status || "active",
        recording_enabled: recording_enabled ?? true,
      })
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ flow: result.data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase.from("call_flows").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
