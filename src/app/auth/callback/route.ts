import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      try {
        // Check if user already exists in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Create user record for Google OAuth users
          const { error: updateError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              user_id: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              email: user.email || '',
              address: '', // Google OAuth doesn't provide address by default
              token_identifier: user.id,
              created_at: new Date().toISOString()
            });

          if (updateError) {
            console.error('Error creating user profile:', updateError);
          }
        }
      } catch (err) {
        console.error('Error handling Google OAuth user:', err);
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}