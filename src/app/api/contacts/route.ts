import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, phone_number, image_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = (body?.name as string | undefined)?.trim();
  const phone_number = (body?.phone_number as string | undefined)?.trim();
  const image_url = (body?.image_url as string | undefined)?.trim() || null;

  if (!name || !phone_number) {
    return NextResponse.json(
      { error: "Missing name or phone_number" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({ user_id: user.id, name, phone_number, image_url })
    .select("id, name, phone_number, image_url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data }, { status: 201 });
}
