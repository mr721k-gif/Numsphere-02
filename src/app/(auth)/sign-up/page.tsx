import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, Message } from "@/components/form-message";
import { Phone, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { signUpAction, signInWithGoogleAction } from "@/app/actions";

export default function Signup({ searchParams }: { searchParams: Message }) {
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
        />
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
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-3xl font-black text-white">Numsphere*</span>
          </Link>

          <h2 className="text-5xl font-black text-white mb-4 leading-tight">
            Start your VoIP journey
          </h2>
          <p className="text-xl text-indigo-100 font-medium">
            Join thousands of businesses revolutionizing their communications
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 p-6 space-y-4">
          <h3 className="font-black text-gray-900 mb-4 text-lg">
            What you'll get:
          </h3>
          <div className="space-y-3">
            {[
              "Crystal-clear HD voice calls",
              "Smart call routing and flows",
              "Real-time analytics and insights",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 p-8">
          <form action={signInWithGoogleAction} method="post" className="mb-6">
            <SubmitButton
              formAction={signInWithGoogleAction}
              pendingText="Redirecting..."
              className="w-full flex justify-center items-center py-4 px-4 border-4 border-gray-900 rounded-2xl shadow-lg text-base font-black text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-all hover:scale-105"
            >
              <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" aria-hidden>
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
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-4 border-gray-900" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-white px-4 text-gray-900 font-black">
                Or sign up manually
              </span>
            </div>
          </div>

          {/* Manual Sign-up form */}
          <form className="space-y-6" action={signUpAction} method="post">
            <div>
              <Label
                htmlFor="full_name"
                className="text-sm font-black text-gray-900 mb-2 block"
              >
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full px-4 py-3 border-4 border-gray-900 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500 font-semibold"
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-black text-gray-900 mb-2 block"
              >
                Work Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-4 py-3 border-4 border-gray-900 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500 font-semibold"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <Label
                htmlFor="address"
                className="text-sm font-black text-gray-900 mb-2 block"
              >
                Address
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                autoComplete="address-line1"
                required
                className="mt-1 block w-full px-4 py-3 border-4 border-gray-900 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500 font-semibold"
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <SubmitButton
              formAction={signUpAction}
              className="w-full flex justify-center items-center py-4 px-4 border-4 border-gray-900 rounded-2xl shadow-lg text-base font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-all hover:scale-105"
              pendingText="Creating your account..."
            >
              Create Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-black text-gray-900 font-semibold">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-black text-gray-900 hover:text-indigo-200 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
      </div>
    </div>
  );
}
