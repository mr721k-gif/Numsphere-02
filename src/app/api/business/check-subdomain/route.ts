import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");

  if (!subdomain) {
    return NextResponse.json(
      { error: "Subdomain is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("business_accounts")
    .select("id")
    .eq("subdomain", subdomain)
    .single();

  return NextResponse.json({ available: !data });
}
