import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: numbers, error } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedNumbers = (numbers || []).map((n) => ({
    phoneNumber: n.phone_number,
    owned: true,
    friendlyName: n.friendly_name,
  }));

  return NextResponse.json({ numbers: formattedNumbers });
}
