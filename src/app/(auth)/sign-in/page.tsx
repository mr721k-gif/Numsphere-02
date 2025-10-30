import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, Message } from "@/components/form-message";
import {
  Phone,
  Zap,
  Shield,
  Clock,
  Headphones,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { signInAction, signInWithGoogleAction } from "@/app/actions";

export default function Login({ searchParams }: { searchParams: Message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group mb-8 hover:scale-105 transition-transform"
          >
            <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
              <Phone className="w-6 h-6 text-indigo-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-3xl font-black text-white">Numsphere*</span>
          </Link>

          <h2 className="text-5xl font-black text-white mb-4 leading-tight">
            Welcome back
          </h2>
          <p className="text-xl text-indigo-100 font-medium">
            Sign in to your VoIP dashboard
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 p-8">
          <form className="space-y-6">
            <SubmitButton
              formAction={signInWithGoogleAction}
              className="w-full flex justify-center items-center py-4 px-4 border-4 border-gray-900 rounded-2xl shadow-lg text-base font-black text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-all hover:scale-105"
              pendingText="Redirecting..."
            >
              <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </SubmitButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-4 border-gray-900" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-4 text-gray-900 font-black">
                  Or sign in with email
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-black text-gray-900 mb-2 block"
              >
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="mt-1 block w-full px-4 py-3 border-4 border-gray-900 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500 font-semibold"
                placeholder="you@company.com"
              />
            </div>

            <SubmitButton
              formAction={signInAction}
              className="w-full flex justify-center items-center py-4 px-4 border-4 border-gray-900 rounded-2xl shadow-lg text-base font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-all hover:scale-105"
              pendingText="Sending code..."
            >
              <Mail className="mr-2 w-5 h-5" />
              Send Verification Code
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700 font-semibold">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="font-black text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white font-bold">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Easy setup
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-sm text-indigo-100 font-medium">
            Your data is protected with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
}
