import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, Message } from "@/components/form-message";
import { Phone, Zap, ArrowRight, Mail, Shield } from "lucide-react";
import { verifyOtpAction } from "@/app/actions";

export default function VerifyOtp({ 
  searchParams 
}: { 
  searchParams: Message & { email?: string; type?: string } 
}) {
  const email = searchParams.email || '';
  const type = searchParams.type || 'magiclink';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 group mb-8"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Numsphere
            </span>
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600">
            We've sent a verification code to your email address
          </p>
        </div>

        {/* Email Confirmation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Code sent to:</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form className="space-y-6">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="type" value={type} />
            
            <div>
              <Label
                htmlFor="token"
                className="text-sm font-medium text-gray-700"
              >
                Verification Code
              </Label>
              <Input
                id="token"
                name="token"
                type="text"
                autoComplete="one-time-code"
                required
                maxLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the 6-digit code from your email
              </p>
            </div>

            <SubmitButton
              formAction={verifyOtpAction}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              pendingText="Verifying..."
            >
              <Shield className="mr-2 w-4 h-4" />
              Verify Code
              <ArrowRight className="ml-2 w-4 h-4" />
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{" "}
              <Link
                href={`/sign-in?email=${encodeURIComponent(email)}`}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Resend code
              </Link>
            </p>
            
            <p className="text-sm text-gray-600">
              Wrong email?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Try again
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This code will expire in 10 minutes for your security
          </p>
        </div>
      </div>
    </div>
  );
}