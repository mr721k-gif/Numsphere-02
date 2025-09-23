import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response = NextResponse.next({ request: { headers: request.headers } })
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isDashboard = pathname.startsWith('/dashboard')
    const authPages = ['/sign-in', '/sign-up', '/forgot-password', '/verify-otp']
    const isAuthPage = authPages.includes(pathname)

    // Block access to dashboard routes if not signed in
    if (isDashboard && !user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Prevent signed-in users from visiting auth pages
    if (isAuthPage && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (e) {
    return NextResponse.next({ request: { headers: request.headers } })
  }
}