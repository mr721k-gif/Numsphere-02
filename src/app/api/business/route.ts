import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { businessName, subdomain, industry, companySize } = body;

  if (!businessName || !subdomain) {
    return NextResponse.json(
      { error: "Business name and subdomain are required" },
      { status: 400 }
    );
  }

  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!subdomainRegex.test(subdomain)) {
    return NextResponse.json(
      { error: "Subdomain can only contain lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  const { data: existingBusiness } = await supabase
    .from("business_accounts")
    .select("id")
    .eq("subdomain", subdomain)
    .single();

  if (existingBusiness) {
    return NextResponse.json(
      { error: "Subdomain already taken" },
      { status: 400 }
    );
  }

  const { data: business, error } = await supabase
    .from("business_accounts")
    .insert({
      owner_id: user.id,
      business_name: businessName,
      subdomain,
      industry,
      company_size: companySize,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("users")
    .update({
      onboarding_complete: true,
      account_type: "business",
      business_id: business.id,
    })
    .eq("id", user.id);

  return NextResponse.json({ business });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business, error } = await supabase
    .from("business_accounts")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: business || null });
}
