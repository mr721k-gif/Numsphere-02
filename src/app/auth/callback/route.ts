import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        // Create user record if it doesn't exist
        await supabase.from("users").insert({
          id: data.user.id,
          user_id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
          email: data.user.email || "",
          address: data.user.user_metadata?.address || "",
          token_identifier: data.user.id,
          created_at: new Date().toISOString(),
        });

        // Create default subscription
        await supabase.from("user_subscriptions").insert({
          user_id: data.user.id,
          plan_type: 'free',
          number_releases_used: 0,
          max_number_releases: 1
        });
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate user`);
}